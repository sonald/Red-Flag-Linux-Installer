define(['jquery', 'system', 'remote_part'], function($, _system, Rpart) {
    'use strict';
    var autoStart = {
        auto: function (app) {
            var dpath = '/dev/sda';
            app.options.grubinstall = dpath;
            app.options.installmode = 'fulldisk';
            Rpart.method('FulldiskHandler', null, [dpath,app.options.sysflag],function (result, disks) {
                app.options.disks = disks;
                var new_number = Number(result.handlepart);
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
                    return (el.number === new_number);
                });
                part["mountpoint"] = "/";
            });
            if (app.auto === true) { 
                app.currentPage +=1;
            }
            return;
        },

        overload: function (app) {
            var dpath = '/dev/sda';
            app.options.grubinstall = dpath;
            app.options.installmode = 'fulldisk';
            Rpart.getparts(null, null, function (disks) {
                app.options.disks = disks;
                var need_number = app.options.sysflag === "sony" ? 2 : 1;
                var disk = _.find(disks, function(el){
                    return el.path === dpath;
                });
                need_number = disk.type === "gpt" ? need_number+1 : need_number;
                var part = _.find(disk.table, function (el) {
                    return (el.number = need_number) ;
                });
                part["mountpoint"] = "/";
            });
            return;
        },
    };
    return autoStart;
});
