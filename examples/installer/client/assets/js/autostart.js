define(['jquery', 'system', 'remote_part'], function($, _system, Rpart) {
    'use strict';
    var autoStart = {
        run: function (app) {
            var dpath = '/dev/sda';
            app.options.grubinstall = dpath;
            app.options.installmode = 'fulldisk';
            Rpart.method('FulldiskHandler', [dpath],function (result, disks) {
                app.options.disks = disks;
                var disk = _.find(disks, function(el){
                    return el.path === dpath;
                });
                disk.table = _.map(disk.table, function (el) {
                    if (el.number > 0 && el.fs !== "bios_grub") {
                        el["dirty"]=true;
                    }
                    return el;
                });
                var part = _.find(disk.table, function (el) {
                    return (el.fs!="linux-swap(v1)" && el.number > 0 && el.dirty === true);
                });
                part["mountpoint"] = "/";
                app.currentPage = 2;
            });

        },
    };
    return autoStart;
});
