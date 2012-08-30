define(['jquery', 'system', 'js_validate', 'i18n'], function($, _system, jsvalidate, i18n) {
    'use strict';

    var pageCache;

    console.log('load userinfo');
    var page = {
	      name: i18n.gettext('Set'),
        view: '#userinfo_tmpl',
        locals: null,
        app: null,
         
        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            var that = this;
            that.app = app;
            callback();
            console.log('userinfo initialized');
        },

        // compile and return page partial
        loadView: function() {
            if (typeof pageCache === 'undefined') {
                this.locals = {
                    gettext: function(msgid) {return i18n.gettext(msgid); }
                };
                pageCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            }
            return pageCache;
        },

        postSetup: function() {
            this.app.buttons.get('forward').enable();
            $('body').off('keyup', 'input#name');

            $('body').on('keyup', 'input#name', function() {
                $('fieldset').find('b').remove();
                var value = $(this).attr("value");
                $('input#hostname').attr("value", value+"-qomo");
                jsvalidate.execu();
            });
        },

        validate: function(callback) {
            $('fieldset').find('b').remove();
            jsvalidate.execu();
            console.log(jsvalidate.result);

            if( jsvalidate.result === false ){
                jsvalidate.result = true;
                return false;
            }
            this.app.options.username = $('input#name').attr("value");
            this.app.options.hostname = $('input#hostname').attr("value");
            callback();
        }
    };

    return page;
});

