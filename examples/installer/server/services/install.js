var pathlib = require('path');
var fs = require('fs');
var async = require('async');

module.exports = (function(){
    'use strict';
    errors  = { 
        ENOROOT: 'no install destination specified',
        ECOPYBASE: 'copy base system failed',
    }

    var exec = require('child_process').exec;

    function copyBaseSystem(newroot, watcher, next) {
        var helper = pathlib.join(__dirname, 'copy_base_system.sh') + 
            ' /dev/mapper/arch_root-image ' + newroot;
        console.log('run %s', helper);

        var child = exec(helper);
        var percentage = 0;

        child.on('exit', function(code, signal) {
            if (code && code === 0) {
                next();

            } else {
                watcher({status: 'failure', reason: errors[ECOPYBASE]});
            }
        });

        function populateProgress() {
            watcher({status: 'progress', data: percentage});
            percentage++;
        }

        process.nextTick(populateProgress);
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

    function system(cmd, cb) {
        var child = exec(cmd);
        child.on('exit', function(code, signal) {
            if (code && code === 0) {
                cb(null);

            } else {
                cb({status: 'failure', reason: errors[ECOPYBASE]});
            }
        });
    }

    function postInstall(opts, watcher, next) {
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
                system("mkdir -p /tmp/tmproot", cb),
                system("mount " + opts.newroot + " " + root_dir, cb),
                function(cb) {
                    generateFstab(root_dir, opts.newroot);
                    cb(null);
                },
                function(cb) {
                    var post = pathlib.join(root_dir, "/postscript.sh");
                    fs.writeFile(post, postscript, 'utf8', function(err) {
                        if (err) {
                            cb(err);
                            return;
                        }

                        fs.chmod(post, 493, function(err) {  // 0755 === 493
                            cb(err);
                        }); 
                    });
                },
                // run postscript
                system("chroot " + root_dir + " /postscript.sh &> " + root_dir + "/tmp/postscript.log", cb),
                system("umount " + root_dir + "/proc", cb),
                system("umount " + root_dir + "/dev", cb),
                system("umount " + root_dir + "/sys", cb),
                // delete postscript
                system("rm -rf " + root_dir + "/postscript.sh", cb),
                system("umount " + root_dir, cb)
        ], 
        function(err) {
            console.log(err?err:'postscript done');
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
                this.error(ENOROOT, cb);
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
                    console.log('install done');
                });
            });
        },
    };

    return Installer;

}());
