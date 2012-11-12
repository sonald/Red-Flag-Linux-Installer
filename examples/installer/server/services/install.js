/*jslint node: true*/

var pathlib = require('path');
var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;

// simple sprintf stuff
function sprintf(fmt) {
    'use strict';

    fmt = fmt || "";
    if (arguments.length <= 1) {
        return fmt;
    }

    var args = [].slice.call(arguments, 1);
    var r = /%\d+/g;
    var match;
    var count = 1;
    var key2valMap = {};
    var result = fmt;

    while (args.length) {
        key2valMap['%'+count] = args.shift();
        count++;
    }

    while ((match = r.exec(fmt))) {
        if (!(match[0] in key2valMap)) {
            key2valMap[match[0]] = match[0];
        }
        result = result.replace(match[0], key2valMap[match[0]]);
    }

    return result;
}

var fsutil = {
    getFileSystemInfo: function(path, callback) {
        'use strict';

        exec('stat -f -c "%s %b %f" ' + path, {encoding: 'utf8'}, function(err, stdout, stderr) {
            if (err) {
                debug('stat failed: ', err);
                callback(err);
                return;
            }

            var re = /(\d+) (\d+) (\d+)/;
            var info = re.exec(stdout);
            if (!info) {
                callback('stat result is invalid: ' + stdout);
                return;
            }

            // "block size": info[1],
            // "total blocks": info[2],
            // "free blocks": info[3]
            info = {
                "total": (+info[2]) * info[1],
                "free": (+info[3]) * info[1]
            };
            debug('getFileSystemInfo: ', info);
            callback(null, info);
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

            debug('mktemp: ' + stdout);
            callback(stdout);
        });
    }
};

var debug = (function() {
    'use strict';

    if (process.env.NODE_DEBUG) {
        return function() {
            var util = require('util');

            var msg = [].slice.apply(arguments).reduce(function(acc, item) {
                item = typeof item === 'string'? item: util.inspect(item, true, 5);
                return acc + ' ' + item;
            });

            console.log(msg);
        };
    } else {
        return function() {};
    }
}());

module.exports = (function(){
    'use strict';

    // supporting routines
    var errors = {
        ENOROOT: 'ENOROOT',
        ECOPYBASE: 'ECOPYBASE',
        EPOSTSCRIPT: 'EPOSTSCRIPT'
    };

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
            var child = exec(cmd, { maxBuffer: (1<<20)*4 });
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
            'ext3': 'mkfs.ext3 ',
            'swap': 'mkswap '
        };

        var cmd = cmds[(part.fs.indexOf('swap') != -1?'swap':part.fs)];
        cmd = part.label ? cmd+"-L "+part["label"]+" ": cmd;
        if (!cmd) {
            cmd = part.label ? cmds[0]+"-L "+part["label"]+" ": cmds[0];
        }
        cmd = cmd + part.path;
        system(cmd)( callback );
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

    function sortByMnt(part1, part2) {
        var r = /\/[^\/]+/g;
        var order1 = 0, order2 = 0;
        var mnt1 = part1.mountpoint, mnt2 = part2.mountpoint;

        if (mnt1 && mnt2) {
            while (r.exec(mnt1)) {
                ++order1;
            }

            while (r.exec(mnt2)) {
                ++order2;
            }

            return order1 > order2 ? 1 : (order1 < order2 ? -1: 0);
        } else {
            return 0;
        }

    }
    //FIXME: recursive mounting is evil and hard
    // mount /dev/sdb1 tmproot/
    // mkdir tmproot/usr
    // mount /dev/sdb2 tmproot/usr
    // ....
    function mountNeededPartitions(disks, destdir, callback) {
        var mounts = enumMountPoints(disks);

        async.forEachSeries(mounts.sort(sortByMnt),
            function(mnt, cb) {
                var mntdir = pathlib.join(destdir, mnt.mountpoint);
                system('mkdir -p ' + mntdir)(function(err) {
                    system(sprintf('mount -t %1 %2 %3', mnt.fs, mnt.path, mntdir))(cb);
                });
            }, callback);
    }

    // unmount all partitions from system disks
    function unmountNeededPartitions(disks, callback) {
        var mounts = enumMountPoints(disks);

        async.forEachSeries(mounts.sort(sortByMnt).reverse(),
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

    //1. interpolate part path into itself for convience,
    //2. and record install device ( where / roots),
    //3. flag all swap partitions dirty (according to design.md, we need to
    //   clear and mount all swaps)
function preprocessOptions(opts) {
    opts.disks.map(function(disk) {
        disk.table.map(function(part) {
            part.path = part.path || disk.path + part.number;

            if (part.mountpoint === '/') {
                opts.installdevice = disk;
            }

            if (part.fs.toLowerCase().indexOf('swap') > -1) {
                part.dirty = true;
            }
        });
    });

    return opts;
}

    // install routines

    function copyBaseSystem(options, watcher, next) {
        async.waterfall([
            function(cb) {
                fsutil.mktempdir(function(dirname) {
                    var cmd = sprintf('mount -o ro /dev/loop0 %1', dirname);
                    system(cmd)(function(err) {
                        cb(err, dirname);
                    });
                });
            },

            function(loop0_dirname, cb) {
            exec('losetup -f', {encoding: 'utf8'}, function(err, stdout, stderr) {
                if (err) {
                    cb(err);
                    return;
                }
                stdout = stdout.trim();
                cb(err, loop0_dirname, stdout);
            });
        },

        function(loop0_dirname, loopdev, cb) {
            var cmd = sprintf('losetup %1 %2', loopdev, loop0_dirname+"/root-image.fs");
            system(cmd)(function(err) {
                cb(err,loop0_dirname,  loopdev);
            });
        },

        function(loop0_dirname, loopdev, cb) {
            fsutil.mktempdir(function(dirname) {
                var cmd = sprintf('mount -o ro %1 %2', loopdev, dirname);
                system(cmd)(function(err) {
                    cb(err, loop0_dirname, loopdev, dirname);
                });
                });
            },

            function(loop0_dirname, loopdev, base_mnt, cb) {
                fsutil.mktempdir(function(dirname) {
                    //TODO: we may need to mkdir -p before mounting
                    //sub-volumes such as /opt.
                    mountNeededPartitions(options.disks, dirname, function(err) {
                        cb(err, loop0_dirname, loopdev, base_mnt, dirname);
                    });
                });
            },

            function(loop0_dirname, loopdev, base_mnt, newroot_mnt, cb) {
                fsutil.getFileSystemInfo(base_mnt, function(err, info) {
                    if (err) {
                        debug(err);
                        cb(err);
                        return;
                    }

                    var size = info['total'] - info['free'];
                    cb(null, loop0_dirname, loopdev, base_mnt, newroot_mnt, size);
                });
            },

            function(loop0_dirname, loopdev, base_mnt, newroot_mnt, total_size, cb) {
                var helper = sprintf('%1 %2 %3', pathlib.join(__dirname, 'copy_base_system.sh'),
                   base_mnt, newroot_mnt);
                var child = exec(helper);

                var percentage = 0;
                var progId;

                debug('run ' + helper);
                child.stdout.on('data', function(data) {
                    process.stdout.write(data);
                });
                child.stderr.on('data', function(data) {
                    process.stdout.write(data);
                });
                child.on('exit', function(code, signal) {
                    progId.stop();
                    if (code === 0) {
                        watcher({status: 'progress', data: 100});
                        cb(null, loop0_dirname, loopdev, base_mnt, newroot_mnt);

                    } else {
                        watcher({status: 'failure', reason: 'ECOPYBASE'});
                        cb({status: 'failure', reason:'ECOPYBASE'});
                    }
                });

                //TODO: dynamically adjust reporting speed
                function populateProgress() {
                    fsutil.getFileSystemInfo(newroot_mnt, function(err, info) {
                        if (err) {
                            progId.stop();
                            cb(err);
                        }

                        var installed = info['total'] - info['free'];
                        percentage = Math.floor((installed / total_size) * 100);
                        percentage = Math.min(percentage, 100);

                        watcher({status: 'progress', data: percentage});
                    });
                }

                progId = setInterval(populateProgress, 1000);
            },

            // cleanup: umount newroot_mnt and rmdir it
            function(loop0_dirname, loopdev, base_mnt, newroot_mnt, cb) {
                unmountNeededPartitions(options.disks, function(err) {
                    cb(err, loop0_dirname, loopdev, base_mnt, newroot_mnt);
                });
            },

            function(loop0_dirname, loopdev, base_mnt, newroot_mnt, cb) {
                system('umount ' + base_mnt)(function(err) {
                    cb(err, loop0_dirname, loopdev, base_mnt, newroot_mnt);
                });
            },

            function(loop0_dirname, loopdev, base_mnt, newroot_mnt, cb) {
                system('losetup -d ' + loopdev )(function(err) {
                    cb(err, loop0_dirname, base_mnt, newroot_mnt);
                });
            },

            function(loop0_dirname, base_mnt, newroot_mnt, cb) {
                system('umount /dev/loop0' )(function(err) {
                    cb(err, loop0_dirname, base_mnt, newroot_mnt);
                });
            },

            function(loop0_dirname, base_mnt, newroot_mnt, cb) {
                system('rmdir ' + base_mnt)(function(err) {
                    cb(err, loop0_dirname, newroot_mnt);
                });
            },

            function(loop0_dirname, newroot_mnt, cb) {
                system('rmdir ' + newroot_mnt)(function(err) {
                    cb(err, loop0_dirname);
                });
            },

            function(loop0_dirname, cb) {
                system('rmdir ' + loop0_dirname)(cb);
            }
        ],
        function(err) {
            if (err) {
                debug(err);
                watcher({status: 'failure', reason:'ECOPYBASE'});
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
                        callback(err);

                    } else {
                        var len = stdout.length;
                        if (stdout[len-1] === '\n')
                            stdout = stdout.slice(0, len-1);

                        var pass = part.mountpoint === '/' ? '1': '0';
                        var mnt_opts = 'defaults';
                        if (part.fs === 'ext4') {
                            mnt_opts += ',noatime';
                        }
                        contents += sprintf('%1\t%2\t%3\t%4\t0\t%5\n', stdout,
                            part.mountpoint, part.fs, mnt_opts, pass);
                        callback(null);
                    }
                });
            }

            var swaps = filterAndFlattenPartitions(opts.disks, function(entry) {
                return entry.dirty && entry.fs.toLowerCase().indexOf('swap') != -1;
            }).map(function(part) {
                return {
                    fs: 'swap',
                    mountpoint: 'swap',
                    path: part.path
                };
            });

            async.forEachSeries(mounts.sort().concat(swaps), genFstabEntry, function(err) {
                debug(contents);
                fs.writeFileSync(fstab, contents, 'utf8');
                err_cb(err);
            });
        }

        function generatePostscript(err_cb) {
            function postSetVar(name, val) {
                postscript += sprintf('export HIPPO_%1=%2\n', name, val);
            }

            var postscript = fs.readFileSync(pathlib.join(__dirname, 'postscript.tmpl'), 'utf8');
            postSetVar("NEWROOT", opts.newroot);

            if (opts.username) {
                postSetVar("USERNAME", opts.username);
            }

            opts.hostname = opts.hostname || opts.username + '-qomo';
            postSetVar("HOSTNAME", opts.hostname);

            opts.timezone = opts.timezone || 'Asia/Shanghai';
            postSetVar("TIMEZONE", opts.timezone);

            opts.lang = opts.lang || process.env.LANG.slice(0, 2);
            var lang2localeMap = {
                'zh': 'zh_CN.UTF-8',
                'en': 'en_US.UTF-8'
            };
            postSetVar("LANG", lang2localeMap[opts.lang]);

            opts.keyboard = opts.keyboard || 'en_US';
            postSetVar("KEYBOARD", opts.keyboard);

            // info postinstall all swap partitions
            var swap_list = filterAndFlattenPartitions(opts.disks, function(entry) {
                return entry.fs && entry.fs.toLowerCase().indexOf('swap') != -1;
            }).map(function(part) {
                return part.path;
            }).sort();

            postSetVar("SWAPS", sprintf("(%1)", swap_list.join(" ")));

            // handle swap file
            var need_swap_file = swap_list.length === 0;

            if (need_swap_file && opts.installmode !== 'advanced') {
                //TODO: check if space is big enough to create swapfile
                var swapsize = 1<<30;

                if (opts.installmode === 'easy') {
                    swapsize = require('os').totalmem();
                    if (swapsize > (4<<30)) {
                        swapsize = 4<<30;
                    }

                } else if (opts.installmode === 'fulldisk') {
                    swapsize = 1<<30;
                }

                postscript += 'dd if=/dev/zero of=/swapfile bs=1048576 count=' + Math.round(swapsize/(1<<20)) + '\n';
                postscript += 'mkswap /swapfile\n';
                postscript += 'echo "/swapfile swap swap defaults 0 0" >> /etc/fstab \n';
            }



            var grubpos = opts.grubinstall || "null";
            postSetVar("GRUB_VERSION", "2");
            postSetVar("GRUB", grubpos);

            postscript += 'if [ -f /etc/postinstall ]; then \n . /etc/postinstall; \nfi\n';
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

        async.waterfall(
            [
                system("mkdir -p " + root_dir),
                function(err_cb) {
                    mountNeededPartitions(opts.disks, root_dir, function(err) {
                        err_cb(err);
                    });
                },
                // system("mount " + opts.newroot + " " + root_dir),
                function(err_cb) {
                    generateFstab(root_dir, enumMountPoints(opts.disks), err_cb);
                },
                generatePostscript,
                system("mount --bind /dev " + root_dir + "/dev"),
                // run postscript
                system("chroot " + root_dir + " /postscript.sh &> " + root_dir + "/tmp/postscript.log"),
                system("umount " + root_dir + "/proc"),
                system("umount " + root_dir + "/sys"),
                system("umount " + root_dir + "/dev"),
                // delete postscript
                system("rm -rf " + root_dir + "/postscript.sh"),
                function(err_cb) {
                    unmountNeededPartitions(opts.disks, function(err) {
                        err_cb(err);
                    });
                },
                function(err_cb) {
                    installer.installMedia(function(media) {
                        var cmd = "bash /etc/postjobs &> /tmp/postjobs.log";
                        process.env["ISO_DEV"] = media.device;
                        exec(cmd, {encoding: 'utf8', env: process.env}, function(err, stdout) {
                            err_cb(err);
                        });
                    });
                }
            ],

            function(err) {
                if (err) {
                    watcher({status: 'failure', reason: errors['EPOSTSCRIPT']});
                    console.error('postInstall failed: ', err);
                }

                next(err);
            });
    } // ~ postInstall


    var installer = {
        meminfo: function(cb) {
            cb( {
                free: require('os').freemem(), // unit: bytes
                total: require('os').totalmem()
            });
        },

        installMedia: function(reporter) {
            // the only safe mode to fallback
            var res_mode = {mode: 'cd'};

            function kern_cmdline_probe(condition, callback) {
                var cmd = 'awk \'BEGIN{RS=" "; FS="="; found=0;} ' + condition + ' {if (!length($2)) $2=1; found=$2; } ' + 
                    + 'END {print found;} \' /proc/cmdline';

                exec(cmd, {encoding: 'utf8'}, function(err, stdout) {
                    stdout = stdout ? stdout.trim() : "";
                    if (err) {
                        stdout = false;
                    } else if (!+stdout || stdout == false) {
                        stdout = false;
                    }

                    callback(stdout);
                });
            }

            kern_cmdline_probe('$1 == "rflive"', function(res) {
                if (res) {
                    reporter(res_mode);
                    return;
                }

                var cmd = 'cat /proc/mounts | awk \'$2 == "/run/redflagiso/bootmnt" { print $1 }\'';
                exec(cmd, {encoding: 'utf8'}, function(err, stdout, stderr) {
                    if (err) {
                        reporter(res_mode);
                        return;
                    }

                    var iso_root_dev = stdout.trim();

                    var re_cd = /\/dev\/sr[0-9]*/;
                    var re_usb = /\/dev\/[sh]d[a-z]([0-9]*)/;
                    var re_loop = /\/dev\/loop([0-9]*)/;

                    if (re_cd.test(iso_root_dev)) {
                        reporter(res_mode);

                    } else if (re_usb.test(iso_root_dev)) {
                        reporter({"mode": 'usb', "device": iso_root_dev.replace(/[0-9]*/, '')});

                    } else if (re_loop.test(iso_root_dev)) {
                        reporter({"mode": 'hd', "device": iso_root_dev});

                    } else {
                        reporter(res_mode);
                    }
                });

            });

        },

        // [ '/dev/sda', '/dev/sdb' ]
        /**
         * @return {JSON} status of checking
         * @arg devices
         */
         minimalSufficient: function(devices, reporter) {
            function sizeInM(size) {
                return size / Math.pow(10, 6);
            }

            function diskminCheck(device) {
                return function(cb) {
                    var devname = device.replace(/\/dev\//, '');
                    var cmd = 'echo $(( `cat /sys/block/' + devname + '/size` * 512 ))';
                    exec(cmd, {encoding: 'utf8'}, function(err, stdout, stderr) {
                        if (err) {
                            // if err happens, assume size is 0
                            cb(null, {target: 'disk', size: 0, path: device});
                            return;
                        }

                        var size = +stdout.trim();
                        cb(null, {target: 'disk', size: sizeInM(size), path: device});
                    });
                };
            }

            var checklist = [];
            devices.forEach(function(device) {
                checklist.push(diskminCheck(device));
            });

            checklist.push( function(cb) {
                cb(null, {target: 'memory', size: sizeInM(require('os').totalmem())});

            } );

            async.parallel(checklist, function(err, results) {
                debug('minimalSufficient: ', results);
                reporter(results);
            });
        },

        /**
         * options contains all info needed to do installation
         * options = {
            // newroot: '/dev/sda1',
            grubinstall: '' // empty, '/dev/sda', '/dev/sdb2'
            installmode: 'fulldisk' // easy, advanced
            timezone: '',
            hostname: username + '-qomo',
            username: '',
            lang: 'zh',
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
            options = preprocessOptions( options );
            options.newroot = options.newroot || guessNewRoot(options.disks);
            debug(options);

            if (!options.newroot) {
                console.error( 'ENOROOT' );
                reporter( {status: 'failure', err: 'ENOROOT'} );
                return;
            }
            async.waterfall([
                function(next) {
                    reporter({status: 'Format'});
                    formatDirtyPartitions( options.disks, error_wrapper(reporter, next) );
                },
                function(next) {
                    reporter({status: 'COPY'});
                    copyBaseSystem( options, reporter, error_wrapper(reporter, next) );
                },
                function(next) {
                    reporter({status: 'POST'});
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
},

        // check if external images are exists, if does, link into assets/
        loadExternalImages: function(reporter) {
            var theme_loc = '/usr/share/apps/installer/images';

            if (pathlib.existsSync(theme_loc)) {
                var assets_path = pathlib.join(__dirname, "../../client/assets");
                var dest = pathlib.join(assets_path, 'theme');

                try {
                    if (pathlib.existsSync(dest)) {
                        fs.unlinkSync(dest);
                    }
                    fs.symlinkSync(theme_loc, dest);
                } catch(ex) {
                }
            }

            reporter( {'status': pathlib.existsSync(dest)} );
        }
    };

    return installer;
}());
