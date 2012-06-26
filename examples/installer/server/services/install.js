var pathlib = require('path');
var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;

var fsutil = {
    getFileSystemInfo: function(path, callback) {
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
    }

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
                    var size = info['total blocks'] * info['block size'];
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
                        next();

                    } else {
                        watcher({status: 'failure', reason: errors['ECOPYBASE']});
                    }
                });

                function populateProgress() {
                    fsutil.getFileSystemInfo(newroot_mnt, function(info) {
                        var installed = (+info['total blocks'] - info['free blocks']) * info['block size'];
                        percentage = Math.round((installed / total_size) * 100);
                        
                        watcher({status: 'progress', data: percentage});
                    });
                }

                progId = setInterval(populateProgress, 1000);
            },
        ], 
        function(err) {
            if (err) {
                console.log(err);
                watcher({status: 'failure', reason: errors['ECOPYBASE']});
            }
        });
    }

    function generateFstab(root_dir, newroot) {
        var fstab = root_dir + "/etc/fstab";
        var contents = '';

        contents += "# /etc/fstab: static file system information.";
        contents += "# <file system> <mount point>   <type>  <options>       <dump>  <pass>";
        contents += "/dev/proc       /proc           proc    defaults        0       0";
        contents += "/dev/sys        /sys            sysfs   rw,noexec,nosuid,nodev      0 0";
        contents += "/dev/devpts     /dev/pts        devpts  gid=5,mode=620  0 0";
        contents += newroot + "      /       ext3        defaults        1       1";

        fs.writeFileSync(fstab, contents, 'utf8');
    }

    function system(cmd) {
        return function(err_cb) {
            var child = exec(cmd);
            child.on('exit', function(code, signal) {
                if (code === 0) {
                    err_cb(null);

                } else {
                    err_cb(cmd + ' failed');
                    cb({status: 'failure', reason: errors['ECOPYBASE']});
                }
            });
        };
    }

    function postInstall(opts, cb, next) {
        var postscript = fs.readFileSync(pathlib.join(__dirname, 'postscript.tmpl'), 'utf8');
        console.log(postscript);

        if (opts.username) {
            postscript += '/usr/sbin/useradd -m ' + opts.username + '\n';
            postscript += '/usr/bin/passwd -d ' + opts.username + '\n';
            postscript += '/usr/sbin/usermod -G disk,audio,video,sys,wheel ' + opts.username + '\n';
            postscript += '/bin/chmod +x /home/' + opts.username + '\n';

            if (opts.passwd) {
                postscript += "{ echo '" + opts.passwd + "'; echo '" + opts.passwd + 
                    "'; } | passwd root";
            }
        }

        var root_dir = "/tmp/tmproot";
        async.waterfall(
            [
                system("mkdir -p /tmp/tmproot"),
                system("mount " + opts.newroot + " " + root_dir),
                function(err_cb) {
                    generateFstab(root_dir, opts.newroot);
                    err_cb(null);
                },
                function(err_cb) {
                    var post = pathlib.join(root_dir, "/postscript.sh");
                    fs.writeFile(post, postscript, 'utf8', function(err) {
                        if (err) {
                            err_cb(err);
                            cb({status: 'failure', reason: errors['ECOPYBASE']});
                            return;
                        }

                        fs.chmod(post, 493, function(err) {  // 0755 === 493
                            if (err) {
                                err_cb(err);
                                cb({status: 'failure', reason: errors['ECOPYBASE']});
                            } else {
                                err_cb(null);
                            }
                        }); 
                    });
                },
                // run postscript
                system("chroot " + root_dir + " /postscript.sh &> " + root_dir + "/tmp/postscript.log"),
                system("umount " + root_dir + "/proc"),
                system("umount " + root_dir + "/dev"),
                system("umount " + root_dir + "/sys"),
                // delete postscript
                system("rm -rf " + root_dir + "/postscript.sh"),
                system("umount " + root_dir)
        ], 
        function(err) {
            if (err) {
                console.log(err?err:'postscript done');
            } else {
                next();
            }
        });
    }

    var Installer = {

        error: function(errno, cb) {
            console.log(errors[errno]);
            cb({
                status: 'failure',
                reason: errors[errno]
            });
        },

        packAndUnpack: function(options, cb) {
            if (!options.newroot) {
                this.error('ENOROOT', cb);
                return;
            }

            copyBaseSystem(options.newroot, cb, function() {
                var post_opts = {};
                if (options.username) {
                    post_opts.username = options.username;
                    if (!options.passwd) {
                    }
                }

                postInstall(post_opts, cb, function() {
                    cb({status: 'success'});
                    console.log('install done');
                });
            });
        },
    };

    return Installer;

}());
