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
    };
    return partial;
});
