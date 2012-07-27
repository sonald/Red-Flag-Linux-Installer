define(['jquery', 'system', 'i18n'], function($,_system,i18n){
    'use strict';
    var partialCache;
    var partial = {
        view: '#easy_part_tmpl',
        app: null,
        locals: null,

        initialize: function (app, locals) {
            this.app = app;
            this.locals = locals;
            this.app.options.installmode = "easy";
            this.app.options.grubinstall = "/dev/sda";
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
            var dnum, pnum, part;
            if ($("#part_content").find('ul.select').length < 1) {
                alert(i18n.gettext("you should a part to install the system."));
                return;
            }
            pnum = $("#part_content").find('ul.select').attr("pnum");//TODO
            dnum = $("#part_content").find('ul.select').attr("dnum");//TODO
            if (this.app.options.disks[dnum].table[pnum].size < 6 || 
                this.app.options.disks[dnum].table[pnum].number < 0) {
                alert(i18n.gettext("you should a part which is larger than 6G and not free!"));
                return;
            }

            part = this.app.options.disks[dnum].table[pnum];
            part["dirty"] = true;
            part["mountpoint"] = "/";
            part.fs = "ext4";
            callback();
        },
    };
    return partial;
});
