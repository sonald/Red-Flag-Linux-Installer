define(['jquery', 'system', 'i18n'], function($,_system,i18n){
    'use strict';
    var partialCache;
    var partial = {
        view: '#fulldisk_part_tmpl',
        locals:null,
        options:null,

        initialize: function (options, locals) {
            this.options = options;
            this.locals = locals;
            this.options.installmode = "fulldisk";
            this.options.grubinstall = "/dev/sda";
        },

        loadView: function () {
            this.locals = this.locals || {};
            partialCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            return partialCache;
        },

        postSetup: function () {
            $("body").off('click', '#fulldisk_part_table ul.disk');
            $('body').on('click', '#fulldisk_part_table ul.disk', function () {
                $('.warninfo').html("");
                if ($(this).hasClass("select")) {
                    $(this).removeClass("select");
                }
                else {
                    $("#fulldisk_part_table").find('ul.select').removeClass("select");
                    $(this).addClass("select");
                    if ($(this).attr("dsize") < 6) {
                        $('.warninfo').html("<b>"+i18n.gettext("Select a disk of at least 6 GB.")+"</b>");
                    }
                }
            });
        },

        validate: function(callback) {
            var that = this;
            var dnum= $("#part_content").find('ul.select').attr("dnum");
            var dpath = that.options.disks[dnum].path;
            if (that.options.disks[dnum].size < 6) {
                alert(i18n.gettext("Select a disk of at least 6 GB."));
                return;
            }

            window.apis.services.partition.FulldiskHandler(dpath, function (result) {
                if (result.status && result.status === "failure") {
                    alert(i18n.gettext(result.reason));
                }else if ( result.status && result.status === "success"){
                    window.apis.services.partition.getPartitions(function(disks){
                        that.locals["disks"] = disks;
                        that.options.disks = disks;
                        var disk = _.find(disks, function(el){
                            return el.path === dpath;
                        });
                        disk.table = _.map(disk.table, function (el) {
                            if (el.number > 0) {
                                el["dirty"]=true;
                            }
                            return el;
                        });
                        var part = _.find(disk.table, function (el) {
                            return (el.fs!="linux-swap(v1)" && el.number > 0);
                        });
                        part["mountpoint"] = "/";
                        callback();
                    });
                }
            });
        },
    };
    return partial;
});
