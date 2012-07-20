/*jslint node: true*/

var pathlib = require('path');
var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;


var fsutil = {
    getFileSystemInfo: function(path, callback) {
        'use strict';

        exec('stat -f -c "%s %b %f" ' + path, {encoding: 'utf8'}, function(err, stdout, stderr) {
            if (err) {
                callback(err);
                return;
            }

            var re = /(\d+) (\d+) (\d+)/;
            var info = re.exec(stdout);
            if (!info) {
                callback(new Error('stat result is invalid: ' + stdout));
                return;
            }

            console.log('getFileSystemInfo: %s', info);
            callback(null, {
                "block size": info[1],
                "total blocks": info[2],
                "free blocks": info[3]
            });
        });
    },

    mktempdir: function(callback) {
        'use strict';

        exec('mktemp -d', {encoding: 'utf8'}, function(err, stdout, stderr) {
            if (err) {
                throw err;
            }

            var len = stdout.length;
            if (stdout[len-1] === '\n')
                stdout = stdout.slice(0, len-1);

            console.log('mktemp: %s', stdout);
            callback(stdout);
        });
    }
};

var debug = (function() {
    'use strict';

    if (process.env.NODE_DEBUG) {
        return function() {
            [].slice.apply(arguments).forEach(function(obj) {
                console.log( require('util').inspect(obj, true, 10) );
            });
        };
    } else {
        return function() {};
    }
}());

module.exports = (function(){
    'use strict';

    var errors  = {
        ENOROOT: 'no install destination specified',
        ECOPYBASE: 'copy base system failed',
        EPOSTSCRIPT: 'postscript setup failed'
    };

    // supporting routines

    function error_wrapper(watcher, err_callback) {
        return function(err) {
            if (err) {
                err = (typeof err === 'string') && errors[err] ? errors[err] : err;
                debug(err);
                watcher({status: "failure", reason: err});
            }

            err_callback(err);
        };
    }



    function system(cmd) {
        return function(err_cb) {
            debug('exec ' + cmd);
            var child = exec(cmd);
            child.on('exit', function(code, signal) {
                if (code === 0) {
                    err_cb(null);

                } else {
                    err_cb(cmd + ' failed');
                }
            });
        };
    }

    function filterAndFlattenPartitions(disks, filter) {
        var parts = [];

        disks.forEach(function(disk) {
            parts = parts.concat( disk.table.filter(filter) );
        });

        return parts;
    }

    function formatPartition(part, callback) {
        var cmds = {
            'ext4': 'mkfs.ext4 ',
            'swap': 'mkswap '
        };

        system(cmds[(part.fs.indexOf('swap') != -1?'swap':part.fs)] + part.path)(callback);
    }

    function formatDirtyPartitions(disks, callback) {
        var parts = filterAndFlattenPartitions(disks, function(part) {
            return part.dirty === true;
        });

        async.forEachSeries(parts, formatPartition, callback);
    }

    function enumMountPoints(disks) {
        var mounts = filterAndFlattenPartitions(disks, function(entry) {
            return entry.mountpoint && entry.mountpoint.trim().length > 0;
        });

        return mounts;
    }

    //FIXME: recursive mounting is evil and hard
    // mount /dev/sdb1 tmproot/
    // mkdir tmproot/usr
    // mount /dev/sdb2 tmproot/usr
    // ....
    function mountNeededPartitions(disks, destdir, callback) {
        var mounts = enumMountPoints(disks);

        async.forEachSeries(mounts.sort(),
            function(mnt, cb) {
                system('mount -t ' + mnt.fs + ' ' + mnt.path + ' ' + mnt.mountpoint)(cb);
            }, callback);
    }

    // unmount all partitions from system disks
    function unmountNeededPartitions(disks, callback) {
        var mounts = enumMountPoints(disks);

        async.forEachSeries(mounts.sort().reverse(),
            function(mnt, cb) {
                system('umount ' + mnt.path)(cb);
            }, callback);
    }

    //the problem of guessNewRoot is that when system is splitted into different
    //mountpoints, it's not enough to just show off '/' mountpoint.
    function guessNewRoot(disks) {
        var cands = [];

        disks.forEach(function(disk) {
            cands = cands.concat( disk.table.filter(function(entry) {
                return (entry.mountpoint === '/');
            }) );
        });

        if (cands.length === 1) {
            return cands[0].path;
        }

        // if no candidates found or more than one found, it's an error.
        return null;
    }

    //interpolate part path into itself for convience
    function preprocessDisks(disks) {
        disks.map(function(disk) {
            disk.table.map(function(part) {
                part.path = part.path || disk.path + part.number;
            });
        });

        return disks;
    }

    // install routines

    function copyBaseSystem(options, watcher, next) {
        async.waterfall([
            function(cb) {
                fsutil.mktempdir(function(dirname) {
                    exec('mount -t ext4 ' + options.newroot + ' ' + dirname, {}, function(err) {
                        if (err) {
                            cb(err);

                        } else {
                            cb(null, dirname);
                        }
                    });
                });
            },

            function(newroot_mnt, cb) {
                fsutil.getFileSystemInfo('/', function(err, info) {
                    if (err) {
                        debug(err);
                        cb(err);
                        return;
                    }

                    var size = (+info['total blocks'] - info['free blocks']) * info['block size'];
                    cb(null, newroot_mnt, size);
                });
            },

            function(newroot_mnt, total_size, cb) {
                var helper = pathlib.join(__dirname, 'copy_base_system.sh') +  ' / ' + newroot_mnt;
                var child = exec(helper);

                var percentage = 0;
                var progId;

                console.log('run %s', helper);
                child.on('exit', function(code, signal) {
                    progId.stop();
                    if (code === 0) {
                        watcher({status: 'progress', data: 100});
                        cb(null, newroot_mnt);

                    } else {
                        watcher({status: 'failure', reason: errors['ECOPYBASE']});
                        cb({status: 'failure', reason: errors['ECOPYBASE']});
                    }
                });

                //TODO: dynamically adjust reporting speed
                function populateProgress() {
                    fsutil.getFileSystemInfo(newroot_mnt, function(err, info) {
                        if (err) {
                            progId.stop();
                            cb(err);
                        }

                        var installed = (+info['total blocks'] - info['free blocks']) * info['block size'];
                        percentage = Math.floor((installed / total_size) * 100);

                        watcher({status: 'progress', data: percentage});
                    });
                }

                progId = setInterval(populateProgress, 1000);
            },

            // cleanup: umount newroot_mnt and rmdir it
            function(newroot_mnt, cb) {
                system('umount ' + newroot_mnt)(function(err) {
                    cb(null, newroot_mnt);
                });
            },

            function(newroot_mnt, cb) {
                system('rmdir ' + newroot_mnt)(cb);
            }
        ],
        function(err) {
            if (err) {
                debug(err);
                watcher({status: 'failure', reason: errors['ECOPYBASE']});
            }
            next(err);
        });
    } //~ copyBaseSystem

    function postInstall(opts, watcher, next) {
        var root_dir = "/tmp/tmproot";

        function generateFstab(root_dir, mounts, err_cb) {
            var fstab = root_dir + "/etc/fstab";
            var contents = '';

            contents += "# /etc/fstab: static file system information.\n";
            contents += "# <file system> <mount point>   <type>  <options>       <dump>  <pass>\n";
            contents += "proc            /proc           proc    nodev,noexec,nosuid 0       0\n";

            function genFstabEntry(part, callback) {
                exec("blkid " + part.path + " -s UUID | awk -F: '{print $2}'", {}, function(err, stdout) {
                    if (err) {
                        debug(err);
                        callback(err);

                    } else {
                        var len = stdout.length;
                        if (stdout[len-1] === '\n')
                            stdout = stdout.slice(0, len-1);

                        //FIXME: ext4 is hardcoded
                        contents += stdout + "\t" + part.mountpoint + "\text4\tdefaults\t0\t1\n";
                        callback(null);
                    }
                });
            }

            async.forEachSeries(mounts.sort(), genFstabEntry, err_cb);
            fs.writeFileSync(fstab, contents, 'utf8');
        }

        function generatePostscript(err_cb) {
            var postscript = fs.readFileSync(pathlib.join(__dirname, 'postscript.tmpl'), 'utf8');

            if (opts.username) {
                postscript += '/usr/sbin/useradd -m ' + opts.username + '\n';
                postscript += '/usr/bin/passwd -d ' + opts.username + '\n';
                postscript += '/usr/sbin/usermod -G disk,audio,video,sys,wheel ' + opts.username + '\n';
                postscript += '/bin/chmod +x /home/' + opts.username + '\n';

                // give sudo power
                postscript += 'echo ' + opts.username + ' ALL=(ALL) ALL > /etc/sudoers.d/' +
                    opts.username + '\n';
            }

            //TODO: root is unaccessible
            opts.passwd = opts.passwd || require('crypto').createHash('sha1')
                    .update(Date().toString()).digest('hex');
            if (opts.passwd) {
                postscript += "{ echo '" + opts.passwd + "'; echo '" + opts.passwd +
                    "'; } | passwd root\n";
            }


            // whatever which cmd failed in script, consider it ok.
            postscript += 'exit 0\n';
            debug(postscript);

            var post = pathlib.join(root_dir, "/postscript.sh");
            fs.writeFile(post, postscript, 'utf8', function(err) {
                if (err) {
                    err_cb(err);
                    return;
                }

                fs.chmod(post, 493, function(err) {  // 0755 === 493
                    err_cb(err);
                });
            });
        }

        function grubInstall(err_cb) {
            var grubpos = opts.grubinstall || "";
            if (grubpos.length === 0) {
                err_cb(null);
                return;
            }

            system('grub-install --recheck --root-directory="' + root_dir + '" ' + grubpos)(err_cb);
        }

        async.waterfall(
            [
                system("mkdir -p " + root_dir),
                system("mount " + opts.newroot + " " + root_dir),
                function(err_cb) {
                    generateFstab(root_dir, enumMountPoints(opts.disks), err_cb);
                },
                generatePostscript,
                // run postscript
                system("chroot " + root_dir + " /postscript.sh &> " + root_dir + "/tmp/postscript.log"),
                system("umount " + root_dir + "/proc"),
                system("umount " + root_dir + "/sys"),
                // delete postscript
                system("rm -rf " + root_dir + "/postscript.sh"),
                grubInstall,
                system("umount " + root_dir)
            ],

            function(err) {
                if (err) {
                    watcher({status: 'failure', reason: errors['EPOSTSCRIPT']});
                    console.log('postInstall failed: ', err);
                } else {
                    next();
                }
            });
    } // ~ postInstall


     return {
        meminfo: function(cb) {
            cb( {
                free: require('os').freemem(), // unit: bytes
                total: require('os').totalmem()
            });
        },

        hdinstallMode: function(cb) {
            //TODO: detect it
            cb(false);
        },

        /**
         * options contains all info needed to do installation
         * options = {
            // newroot: '/dev/sda1',
            grubinstall: '' // empty, '/dev/sda', '/dev/sdb2'
            installmode: 'fulldisk' // easy, advanced
            // disks contains almost all partitions, use dirty to distinct which
            // need formatting
            disks: [
                {
                    path: '/dev/sda',
                    ...,
                    table: [
                        {number: '1', fs: 'ext4', mountpoint: '/', dirty: true|false },
                        {...}
                    ]
                },
                {
                    //another disk
                }
            ]
         }
         */
        packAndUnpack: function(options, reporter) {
            if (process.env.RFINSTALLER === 'fake') {
                var fake_options = {
                    "grubinstall": "/dev/sdb",
                    "installmode": "fulldisk",
                    "username": "pangu_test",
                    "disks": [
                    {
                        "table": [
                        {
                            "fs": "linux-swap(v1)",
                            "end": 1.003483648,
                            "ty": "primary",
                            "number": 1,
                            "start": 0.000032256,
                            "size": 1.003451392,
                            "dirty": true
                        },
                        {
                            "fs": "ext4",
                            "end": 8.003196928,
                            "ty": "primary",
                            "number": 2,
                            "start": 1.01170944,
                            "size": 6.991487488,
                            "dirty": true,
                            "mountpoint": "/"
                        },
                        {
                            "fs": "",
                            "end": 8.587191808,
                            "ty": "free",
                            "number": -1,
                            "start": 8.00319744,
                            "size": 0.5839943680000008
                        }
                        ],
                        "path": "/dev/sdb",
                        "model": "ATA QEMU HARDDISK",
                        "type": "msdos",
                        "unit": "GB",
                        "size": 8.589934592
                    },
                    {
                        "table": [
                        {
                            "fs": "ext4",
                            "end": 8.388607488,
                            "ty": "primary",
                            "number": 1,
                            "start": 0.000032256,
                            "size": 8.388575231999999
                        }
                        ],
                        "path": "/dev/sda",
                        "model": "ATA QEMU HARDDISK",
                        "type": "msdos",
                        "unit": "GB",
                        "size": 8.388608
                    }
                    ]
                };

                options = fake_options; // for testing
            }

            options.disks = preprocessDisks( options.disks );
            options.newroot = options.newroot || guessNewRoot(options.disks);
            debug(options);

            if (!options.newroot) {
                console.log( errors['ENOROOT'] );
                reporter( {status: 'succes', err: errors['ENOROOT']} );
                return;
            }

            async.waterfall([
                function(next) {
                    formatDirtyPartitions( options.disks, error_wrapper(reporter, next) );
                },
                function(next) {
                    copyBaseSystem( options, reporter, error_wrapper(reporter, next) );
                },
                function(next) {
                    //FIXME: do I need to umount all partitions and then remount it?
                    postInstall(options, reporter, function(err) {
                        next( err, {status: 'success'} );
                    });
                }
            ], function(err, result) {
                if (err) {
                    debug(err);
                    reporter(err);
                } else {
                    reporter( result );
                }
                console.log( 'install done' );
            });
        }
    };

}());
