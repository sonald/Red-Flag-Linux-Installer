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

    function mock_packAndUnpack(options, callback) {
        var msgs = [
            {status: 'formatting /dev/sdb1'},
            {status: 'start copying base system'}
        ];

        for (var pr = 0; pr <= 100; pr += 2) {
            msgs.push({status: 'progress', data: pr});
        }

        msgs.push({status: 'success'});

        function doReport() {
            if (msgs.length === 0)
                return;

            callback( msgs.shift() );
            setTimeout(function() {
                doReport();
            }, 500);
        }

        doReport();
    }

    console.log('load process');
    var page = {
        name: 'Install',
        view: '#process_tmpl',
        app: null,
        $presentation: null,
        $progress: null,

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
            this.$progress = $('.progress');
            this.$presentation = $('#presentation');

            this.app.button_handler.rm("forward", "disabled");
            this.app.button_handler.change("forward", i18n.gettext("install"));

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
            // mock_packAndUnpack(this.app.options, $.proxy(this.onProgress, this));
            window.apis.services.install.packAndUnpack(
                this.app.options, $.proxy(this, this.onProgress));
        },

        buildMessage: function(msg, kind) {
            var $msg = $(document.createElement('div')).toggleClass('label ' + kind);
            $msg.text(msg);
            this.$presentation.append($msg);
        },

        onProgress: function(respond) {
            var $msg;

            if (respond.status === "progress") {
                this.buildMessage(respond.data, '');
                this.$progress.find('.bar').css('width', respond.data + '%');

            } else if (respond.status === "failure") {
                this.buildMessage(respond.reason, 'label-error');

            } else if (respond.status === "success") {
                this.buildMessage(
                    i18n.gettext('Congratulations~You have finished installing the system.'),
                    'label-important');

            } else {
                this.buildMessage(respond.status, 'label-info');
            }

            console.log(respond);
        },

        validate: function(callback) {
            // check if install finished
            callback();
            //return true;
        }
    };

    return page;
});


