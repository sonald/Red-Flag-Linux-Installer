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

define(['jquery', 'system', 'jade'], function($) {
    'use strict';

    var pageCache;

    console.log('load license');
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

            var self = this;
            $('body').on('click', '#install', function() {
                self.onInstall();
            });
        },

        onInstall: function() {
            console.log(this.app.userData);
            window.apis.services.install.packAndUnpack(this.app.userData, this.onProgress);
        },

        onProgress: function(respond) {
            console.log(respond);
        },

        validate: function() {
            // check if install finished
            return true;
        }
    };

    return page;
});


