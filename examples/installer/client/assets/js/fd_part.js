define(['jquery', 'system', 'i18n'], function($,_system,i18n){
    'use strict';
    var partialCache;
    var partial = {
        view: '#fulldisk_part_tmpl',
        locals:null,
        app:null,

        initialize: function (app, locals) {
            this.app = app;
            this.locals = locals;
            this.app.options.installmode = "fulldisk";
            this.app.options.grubinstall = "/dev/sda";
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
                        $('.warninfo').html("<b>You'd better choose a disk larger than 6G.</b>");
                    }
                }
            });
        },

        validate: function(callback) {
            var that = this;
            var dnum= $("#part_content").find('ul.select').attr("dnum");
            var dpath = that.app.options.disks[dnum].path;
            if (that.app.options.disks[dnum].size < 6) {
                alert(i18n.gettext("you should choose a disk larger than 6G!"));
                return;
            }

            window.apis.services.partition.FulldiskHandler(dpath, function (results) {
                if (results.status && results.status === "failure") {
                    console.log(results);
                    alert(i18n.gettext(results.reason));
                }else{
                    that.locals["disks"] = results;
                    that.app.options.disks = results;
                    var disk = _.find(results,function(el){
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
                }
            });
        },
    };
    return partial;
});
