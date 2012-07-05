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
        view: '#license_tmpl',
        app: null,

        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            this.app = app;
            callback();
            console.log('license initialized');
        },

        // compile and return page partial
        loadView: function () {
            if (typeof pageCache === 'undefined') {
                pageCache = (jade.compile($(this.view)[0].innerHTML.trim()))();
            }

            return pageCache;
        },

        updateActions: function() {
            if ( $("#choose").find(":checked").attr("value")==="agree" ){ 
                this.app.button_handler.rm("forward","disabled");
            } else if ( $("#choose").find(":checked").attr("value")==="disagree"){
                this.app.button_handler.add("forward","disabled");
            }
        },

        postSetup: function() {
            var self = this;
            this.app.button_handler.add("forward","disabled");
            this.app.button_handler.add("backward","disabled");

            $('body').on('click', '#choose', function(){
                self.updateActions();
            });

            self.updateActions();
        },

        validate: function() {
            return this.app.button_handler.hasclass("forward","disabled");
        },
    };

    return page;
});

