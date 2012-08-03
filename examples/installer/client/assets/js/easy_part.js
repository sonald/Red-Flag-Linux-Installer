define(['jquery', 'system', 'i18n'], function($,_system,i18n){
    'use strict';
    var partialCache;
    var partial = {
        view: '#easy_part_tmpl',
        options: null,
        locals: null,

        initialize: function (options, locals) {
            this.options = options;
            this.locals = locals;
            this.options.installmode = "easy";
            this.options.grubinstall = "/dev/sda";
        },

        loadView: function () {
            this.locals = this.locals || {};
            partialCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            return partialCache;
        },

        postSetup: function () {
            $("body").off('click', '#easy_part_table ul.part');
            $('body').on('click', '#easy_part_table ul.part', function () {
                $('.warninfo').html("<br/>");
                if ($(this).hasClass("select")) {
                    $(this).removeClass("select");
                }else {
                    $("#easy_part_table").find('ul.select').removeClass("select");
                    $(this).addClass("select");
                    if ($(this).attr("psize") < 6) {
                        $('.warninfo').html("<b>You'd better choose a partition larger than 6G.</b>");
                    }
                }
            });
        },

        validate: function (callback) {
            var dnum, pnum, part, disk;
            var that = this;
            if ($("#part_content").find('ul.select').length < 1) {
                alert(i18n.gettext("you should select a partition."));
                return;
            }
            pnum = $("#part_content").find('ul.select').attr("pnum");//TODO
            dnum = $("#part_content").find('ul.select').attr("dnum");//TODO
            disk = this.options.disks[dnum];
            part = disk.table[pnum];
            if (part.size < 6) {
                alert(i18n.gettext("Choose one larger than 6G again!"));
                return;
            }
            var dpath = disk.path;

            if (part.number < 0) {
                window.apis.services.partition.EasyHandler(dpath, part.ty, part.start, part.end, 
                                                           function (result) {
                    if (result.status && result.status === "failure") {
                        alert(i18n.gettext(result.reason));
                    }else if (result.status && result.status === "success") {
                        var new_number = Number(result.handlepart);
                        window.apis.services.partition.getPartitions(function(disks){
                            console.log(disks);
                            that.locals["disks"] = disks;
                            that.options.disks = disks;
                            var disk = _.find(disks, function(el){
                                return el.path === dpath;
                            });
                            var part = _.find(disk.table, function (el) {
                                return (el.number === new_number);
                            });
                            part["mountpoint"] = "/";
                            part["dirty"] = true;
                            callback();
                        });
                    }
                });
            }else{
                part["dirty"] = true;
                part["mountpoint"] = "/";
                part.fs = "ext4";
                callback();
            }
        },
    };
    return partial;
});
