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
                throw err;
            }

            var re = /(\d+) (\d+) (\d+)/;
            var info = re.exec(stdout);
            if (!info) {
                throw new Error('stat result is invalid: ' + stdout);
            }

            console.log('getFileSystemInfo: %s', info);
            callback({
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

module.exports = (function(){
    'use strict';
    var errors  = {
        ENOROOT: 'no install destination specified',
        ECOPYBASE: 'copy base system failed',
        EPOSTSCRIPT: 'postscript setup failed'
    };

    function copyBaseSystem(newroot, watcher, next) {
        async.waterfall([

            function(cb) {
                fsutil.mktempdir(function(dirname) {
                    exec('mount -t ext4 ' + newroot + ' ' + dirname, {}, function(err) {
                        if (err) {
                            cb(err);

                        } else {
                            cb(null, dirname);
                        }
                    });
                });
            },

            function(newroot_mnt, cb) {
                fsutil.getFileSystemInfo('/', function(info) {
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
                        next();

                    } else {
                        watcher({status: 'failure', reason: errors['ECOPYBASE']});
                    }
                });

                function populateProgress() {
                    fsutil.getFileSystemInfo(newroot_mnt, function(info) {
                        var installed = (+info['total blocks'] - info['free blocks']) * info['block size'];
                        percentage = Math.floor((installed / total_size) * 100);

                        watcher({status: 'progress', data: percentage});
                    });
                }

                progId = setInterval(populateProgress, 1000);
            }
        ],
        function(err) {
            if (err) {
                console.log(err);
                watcher({status: 'failure', reason: errors['ECOPYBASE']});
            }
        });
    }

    function generateFstab(root_dir, newroot, err_cb) {
        var fstab = root_dir + "/etc/fstab";
        var contents = '';

        contents += "# /etc/fstab: static file system information.\n";
        contents += "# <file system> <mount point>   <type>  <options>       <dump>  <pass>\n";
        contents += "proc            /proc           proc    nodev,noexec,nosuid 0       0\n";
        //contents += "/dev/sys        /sys            sysfs   rw,noexec,nosuid,nodev      0 0\n";
        //contents += "/dev/devpts     /dev/pts        devpts  gid=5,mode=620  0 0\n";

        exec("blkid " + newroot + " -s UUID | awk -F: '{print $2}'", {}, function(err, stdout) {
            if (err) {
                err_cb(err);

            } else {
                var len = stdout.length;
                if (stdout[len-1] === '\n')
                    stdout = stdout.slice(0, len-1);

                //FIXME: ext4 is hardcoded
                contents += stdout + "      /       ext4        defaults        0       1\n";
                fs.writeFileSync(fstab, contents, 'utf8');
                err_cb(null);
            }
        });
    }

    function system(cmd) {
        return function(err_cb) {
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

    function postInstall(opts, watcher, next) {
        var postscript = fs.readFileSync(pathlib.join(__dirname, 'postscript.tmpl'), 'utf8');

        if (opts.username) {
            postscript += '/usr/sbin/useradd -m ' + opts.username + '\n';
            postscript += '/usr/bin/passwd -d ' + opts.username + '\n';
            postscript += '/usr/sbin/usermod -G disk,audio,video,sys,wheel ' + opts.username + '\n';
            postscript += '/bin/chmod +x /home/' + opts.username + '\n';

            if (opts.passwd) {
                postscript += "{ echo '" + opts.passwd + "'; echo '" + opts.passwd +
                    "'; } | passwd root\n";
            }
        }
        console.log(postscript);

        var root_dir = "/tmp/tmproot";
        var dest_dev = /(\/dev\/[a-z]+)(\d+)/.exec(opts.newroot)[1];

        async.waterfall(
            [
                system("mkdir -p /tmp/tmproot"),
                system("mount " + opts.newroot + " " + root_dir),
                function(err_cb) {
                    generateFstab(root_dir, opts.newroot, err_cb);
                },
                function(err_cb) {
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
                },
                // run postscript
                system("chroot " + root_dir + " /postscript.sh &> " + root_dir + "/tmp/postscript.log"),
                system("umount " + root_dir + "/proc"),
                system("umount " + root_dir + "/sys"),
                // delete postscript
                system("rm -rf " + root_dir + "/postscript.sh"),
                system('grub-install --recheck --root-directory="' + root_dir + '" ' + dest_dev),
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
    }

    function formatPartition(part, callback) {
        var cmds = {
            'ext4': 'mkfs.ext4 ',
            'swap': 'mkswap '
        };

        exec(cmds[part.fs] + part.path, {}, callback);
    }

    function formatDirtyPartitions(disks, callback) {
        var parts = [];

        disks.forEach(function(disk) {
            parts.concat( disk.table );
        });

        async.forEachSeries(parts, formatPartition, callback);
    }

    function enumMountPoints(disks) {
        var mounts = [];
        disks.forEach(function(disk) {
            mounts.concat( disk.table.filter(function(entry) {
                return entry.mountpoint.trim().length > 0;
            }));
        });

        //TODO: sort it!
        return mounts;
    }

    function mountNeededPartitions(disks, callback) {
        var mounts = enumMountPoints(disks);

        async.forEachSeries(mounts,
            function(mnt, cb) {
                exec('mount -t ' + mnt.fs + ' ' + mnt.path + ' ' + mnt.mountpoint, {}, cb);
            }, callback);
    }


    function guessNewRoot(disks) {
        var cands = [];

        disks.forEach(function(disk) {
            cands.concat( disk.table.filter(function(entry) {
                return (entry.mountpoint === '/');
            }) );
        });

        if (cands.length === 1) {
            return cands[0];
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

    var Installer = {

        error: function(errno, cb) {
            console.log(errors[errno]);
            cb({
                status: 'failure',
                reason: errors[errno]
            });
        },

        /**
         * options contains all info needed to do installation
         * options = {
            // newroot: '/dev/sda1',
            grubinstall: '' // empty, '/dev/sda', '/dev/sdb2'
            installmode: 'fulldisk' // easy, advanced
            disks: [
                {
                    path: '/dev/sda',
                    ...,
                    table: [
                        {number: '1', fs: 'ext4', mountpoint: '/' },
                        {...}
                    ]
                },
                {
                    //another disk
                }
            ]
         }
         */
        packAndUnpack: function(options, cb) {
            options.disks = preprocessDisks( options.disks );
            options.newroot = options.newroot || guessNewRoot(options.disks);
            if (!options.newroot) {
                this.error('ENOROOT', cb);
                return;
            }

            async.waterfall([
                function(next) {
                    formatDirtyPartitions(options.disks, next);
                },
                function(next) {
                    mountNeededPartitions(options.disks, next);
                },
                function(next) {
                    copyBaseSystem(options.newroot, cb, function() {
                        next(null);
                        //TODO: umount all partitions
                    });
                },
                function(next) {

                    postInstall(options, cb, function() {
                        next(null, {status: 'success'});
                    });
                }
            ], function(err, result) {
                cb(result);
                console.log('install done');
            });
        }
    };

    return Installer;

}());
