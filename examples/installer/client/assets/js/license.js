/*
 * =====================================================================================
 *
 *       Filename:  license.js
 *
 *    Description:  license page
 *
 *        Version:  1.0
 *        Created:  2012年06月18日 19时07分32秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (sonald), yinshuiboy@gmail.com
 *        Company:  Red Flag Linux Co. Ltd
 *
 * =====================================================================================
*/
/*jslint browser: true, devel: true*/
/*global jade: false*/

define(['jquery', 'system', 'i18n'], function($, nil, i18n) {
    'use strict';

    var pageCache;

    console.log('load license');
    var page = {
	      name: i18n.gettext('Welcome'),
        view: '#license_tmpl',
        app: null,

        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            var locale = i18n.options.domain.slice(0,2);
            this.app = app;
            this.view += '_' + locale;

            callback();
            console.log('license initialized');
        },

        // compile and return page partial
        loadView: function () {
            if (typeof pageCache === 'undefined') {
                var locals = {
                    gettext: function(msgid) { return i18n.gettext(msgid); }
                };

                pageCache = (jade.compile($(this.view)[0].innerHTML.trim()))(locals);
            }

            return pageCache;
        },

        updateActions: function() {
            var btns = this.app.buttons;
            
            if ( $("#choose").find(".checked").attr("value")==="agree" ){
                btns.get('forward').enable();
                
            } else if ( $("#choose").find(".checked").attr("value")==="disagree"){
                btns.get('forward').disable();
            }
        },

        postSetup: function() {
            var self = this;
            self.app.buttons.get('forward').disable();
            
            $('body').on('click', '#choose li', function(){
                $(this).parent().find('span').removeClass("checked")
                $(this).find('span').addClass("checked");
                self.updateActions();
            });

            var lang = 'zh';
            var href = $('#js_langs').find('li.active a').attr('href');
            if (href) {
                lang = href.replace('/?locale=', '');
            }
            this.app.options.lang = lang;
            
            self.updateActions();
        },

        validate: function(callback) {
            if (!this.app.buttons.get('forward').enabled())
                return;
            
            window.apis.services.partition.getPartitions(function(disks) {
                var devices = _.pluck(disks, 'path');
                window.apis.services.install.minimalSufficient(devices, function (result) {
                    if (result.status === "success") {
                        callback();
                    }else if (result.status === "warning"){
                        alert(i18n.gettext(result.reason));
                        callback ();
                    }else {
                        alert(i18n.gettext(result.reason));
                    }
                });
            });
        }

    };

    return page;
});

