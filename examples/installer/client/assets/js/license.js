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
            
            if ( $("#choose").find(".checked").length > 0 ){
                btns.get('forward').enable();
            } else {
                btns.get('forward').disable();
            }
        },

        postSetup: function() {
            var self = this;
            self.app.buttons.get('forward').disable();
            
            $('body').on('click', '#choose li', function(){
                $(this).parent().find('span').toggleClass("checked")
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
            var that = this, status=[], msg = "", has_disk=false;
            if (!this.app.buttons.get('forward').enabled())
                return;
            var msgs = {
                memory:i18n.gettext(
                        "Recommend memory of more than 1GB.Insufficient memory may cause installation failures."),
                disk:i18n.gettext("Installation on disk of less than 6GB may fail. Disk less than  6GB:"),
                memorydisk:i18n.gettext(
                    "Recommend memory of more than 1GB.Insufficient memory may cause installation failures.")
                    +i18n.gettext("Installation on disk of less than 6GB may also fail.Disk less than  6GB:"),
                failure:i18n.gettext("There is no disk for installations.")
            };
            window.apis.services.partition.getPartitions(function(disks) {
                var devices = _.pluck(disks, 'path');
                window.apis.services.install.minimalSufficient(devices, function (result) {
                    console.log(result);
                    _.each(result, function(el) {
                        if (el.target === "memory" && el.size < 1000) {
                            status.push("memory");
                        }else if (el.target === "disk" && el.size < 6000) {
                            status.push(el.path.slice(5));
                            has_disk = true;
                        }else if (el.target === "disk") {
                            has_disk = true;
                        }
                    });
                    if (status.length === 0 && has_disk ) {
                        callback();
                    }else if (has_disk === false) {
                        that.app.myalert(msgs.failure);
                    }else {
                        if (_.indexOf(status,"memory") > -1){
                            msg = "memory"
                            status = _.without(status, "memory");
                        }
                        if (status.length > 0 ) {
                            status = status.join(',');
                            msg = msg + "disk"
                            that.app.myalert(msgs[msg]+status, callback);
                        }else {
                            that.app.myalert(msgs[msg], callback);
                        }
                    }
                });
            });
        }

    };

    return page;
});

