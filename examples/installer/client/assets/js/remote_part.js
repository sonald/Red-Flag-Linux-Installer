define(['jquery', 'system', 'i18n'], function($,_system,i18n){
    'use strict';
    var remote = null;
    function init () {
        remote = remote || window.apis.services.partition;
    };
    var partial = {
        getparts: function (data, reflash_parts) {
            remote.getPartitions(function (disks) {
                disks = disks.reverse();
                reflash_parts (data, disks);
            });
        },

        method: function (action, args, callback) {
            init();
            var func = remote[action];
            var that = this;
            var test = function (result) {
                if (result.status && result.status === "success") {
                    that.getparts(result, callback);
                }else {
                    alert(i18n.gettext('Operation fails'));
                    console.log(result);
                }
            };
            args.push(test);
            func.apply(null, args); 
        },

        calc_percent: function (disks) {
            var new_disks = _.map(disks, function (disk) {
                var dsize = disk.size;
                var exsize, expercent=0, diskpercent=0;
                _.each(disk.table, function (part){
                    if (part.ty !== "logical") {
                        part.percent = (part.size/dsize < 0.03) ? 0.03:part.size/dsize;
                        diskpercent += part.percent;
                        if (part.ty === "extended") {
                            exsize = part.size;
                        }
                    }else {
                        part.percent = (part.size/exsize < 0.1) ? 0.1:part.size/exsize;
                        expercent += part.percent;
                    };
                });
                _.each(disk.table, function (part){
                    if (part.ty !== "logical") {
                        part.percent = part.percent*100/diskpercent;
                    }else {
                        part.percent = part.percent*100/expercent;
                    }
                });
                return disk;
            });
            return new_disks;
        },
        next: function () {
            var r = confirm(i18n.gettext("The selected will be formatted. Press ok to continue"));
            return r;
        },

        render: function (disks, act, locals) {
            var that = this;
            var tys, pindex, $disk, tmpPage, actPage, dindex = 0;
            tys = ["primary", "free", "extended"];//logical is special

            _.each(disks, function (disk) {
                pindex = 0;
                $disk = $('ul.disk[dpath="'+disk.path+'"]');
                _.each(disk.table, function (part){
                    part = that.part_proper(disk.path, disk.unit, part);
                    var args = {
                                pindex:pindex,
                                dindex:dindex,
                                part:part,
                                path:disk.path,
                                gettext:locals.gettext,
                            };
                    actPage = "";
                    if (part.number < 0) {
                        tmpPage = (jade.compile($('#free_part_tmpl')[0].innerHTML))(args);
                        if (act === true) {
                            actPage = (jade.compile($('#create_part_tmpl')[0].innerHTML))(args);
                        }
                    }else{
                        tmpPage = (jade.compile($('#'+part.ty+'_part_tmpl')[0].innerHTML))(args);
                        if (act === true && part.ty !== "extended") {
                            actPage = (jade.compile($('#edit_part_tmpl')[0].innerHTML))(args);
                        }
                    };
                    if (_.indexOf(tys, part.ty) > -1) {
                        $disk.append(tmpPage);
                    }else {
                        $disk.find('ul.logicals').append(tmpPage);
                    };
                    if (part.ty !== "extended") {
                        $disk.find('ul.selectable').last().after(actPage);
                    }
                    if (act === false) {
                        $disk.find('ul.selectable').last().tooltip({title: part.title});
                        $disk.find('ul.part').prev('button.close').remove();
                    }
                    pindex++;
                });
                dindex++;
            });
        },

        part_proper: function (path, unit, part){
            part.unit = unit;
            part.size = Number((part.size).toFixed(2));
            if (part.number > 0) {
                part.ui_path = path.slice(5)+part.number;
                part.fs = part.fs || "Unknow";
                part.fs = ((part.fs).match(/swap/g)) ? "swap" : part.fs;
                part.title = part.ui_path + " " + part.fs + " " + part.size + unit;
            }else {
                part.title = i18n.gettext("Free") + " " + part.size+unit;
            }
            return part;
        },
    };
    return partial;
});
