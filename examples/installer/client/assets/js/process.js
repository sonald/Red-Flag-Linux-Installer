/*
 * =====================================================================================
 *
 *       Filename:  process.js
 *
 *    Description:  process page
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

define(['jquery', 'system', 'i18n'], function($, _system, i18n) {
    'use strict';

    var pageCache;

    console.log('load process');
    var page = {
        view: '#process_tmpl',
        app: null,

        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            this.app = app;
            callback();
            console.log('process initialized');
        },

        // compile and return page partial
        loadView: function() {
            if (typeof pageCache === 'undefined') {
                pageCache = ( jade.compile($(this.view).html()) )();
                //console.log(pageCache);
            }

            return pageCache;
        },

        postSetup: function() {
            $(".dial").knob({
                width:300,
            });
            
            this.app.button_handler.rm("forward", "disabled");
            this.app.button_handler.change("forward", "install");

            var that = this;
            $('body').one('click', '#install', function() {
                that.app.button_handler.add("install", "disabled");
                window.apis.services.partition.commit(function(result) {
                    if(result.status === "failure"){
                        console.log(result.reason);
                    }else if (result.status === "success") {
                        that.onInstall();
                    }else{
                        console.log(result);
                    };
                });
            });
        },

        onInstall: function() {
            console.log(this.app.options);
            window.apis.services.install.packAndUnpack(this.app.options, this.onProgress);
        },

        onProgress: function(respond) {
            if (respond.status === "progress") {
                $("input.dial").val(respond.data).trigger("change");
            }else if (respond.status === "failure") {
                $('div#process_dial').html('<p>'+respond.reason + '</p>');
            }else if (respond.status === "success") {
                $('div#process_dial').html(i18n.gettext('<p>Congratulations~You have finished installing the system.</p>'));
            }
            console.log(respond);
        },

        validate: function(callback) {
            // check if install finished
            callback();
            //return true;
        },
    };

    return page;
});


