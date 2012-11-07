define(['jquery', 'system', 'i18n', 'autostart'], function($, nil, i18n, autoStart) {
    'use strict';
    var pageCache;

    console.log('load finished');

    var page = {
        name: i18n.gettext('Restore'),
        view: '#restore_tmpl',
        app: null,

        initialize: function (app, reinit, callback) {
            this.app = app;
            callback();
            console.log('restore page initialized');
        },

        loadView: function () {
            if (typeof pageCache === 'undefined') {
                var locals = {
                    gettext: function(msgid) { return i18n.gettext(msgid); }
                };
                pageCache = (jade.compile($(this.view)[0].innerHTML))(locals);
            }
            return pageCache;
        },

        postSetup: function () {
            var that = this;
            $('#finished').on('click', 'label.label_radio', function () {
                $('#finished').find('label.label_radio').removeClass("label_checked");
                $(this).addClass("label_checked");
            });
        },

        validate: function (callback) {
            $('#finished').off('click', 'label.label_radio');
            $('#finished').find("label.label_checked").attr("id") === "overload" ? autoStart.overload(app) : autoStart.auto(app);
            callback();
        }
    };

    return page;
});

