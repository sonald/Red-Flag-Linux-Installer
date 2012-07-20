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
    };
    return partial;
});
