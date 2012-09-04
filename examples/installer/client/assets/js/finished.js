define(['jquery', 'system', 'i18n'], function($, nil, i18n) {
    'use strict';
    var pageCache;

    console.log('load finished');

    var page = {
        name: i18n.gettext('Finished'),
        view: '#finished_tmpl',
        app: null,

        initialize: function (app, reinit, callback) {
            this.app = app;
            callback();
            console.log('finished page initialized');
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
            this.app.buttons.get('forward').enable();
            this.app.buttons.get('forward').change(i18n.gettext('Finished'));
            this.app.buttons.get('forward').bind('click', function () {
                var result = $('#finished').find(':checked').attr("value");
                console.log(result);
                window.installer && window.installer.reboot(result);
            });
        },

    };

    return page;
});

