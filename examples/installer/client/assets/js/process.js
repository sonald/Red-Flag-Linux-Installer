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

define(['jquery', 'system', 'progressbar', 'i18n'], function($, _system, progressbar, i18n) {
    'use strict';

    var pageCache;
    function mock_packAndUnpack(options, callback) {
        var msgs = [
            {status: 'formatting /dev/sdb1'},
            {status: 'start copying base system'}
        ];

        for (var pr = 0; pr <= 100; pr += 2) {
            if (pr > 1 && pr < 10)
                continue;
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
        name: i18n.gettext('Install'),
        view: '#process_tmpl',
        app: null,
        $presentation: null,
        $logs: null,

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

        setupPresentation: function() {
            var $p = this.$presentation = $('#presentation');
            var tmpl = '<div class="item"> <img src="$1" alt="$2"></img> </div>';
            var tmpl_active = '<div class="item active"> <img src="$1" alt="$2"></img> </div>';
            
            var imgs = [
                'installer-001.jpg', 
                'installer-002.jpg', 
                'installer-003.jpg', 
                'installer-004.jpg', 
                'installer-005.jpg', 
                'installer-006.jpg', 
                'installer-007.jpg', 
                'installer-008.jpg', 
                'installer-009.jpg', 
                'installer-010.jpg', 
                'installer-011.jpg', 
                'installer-012.jpg', 
                'installer-013.jpg', 
                'installer-014.jpg', 
                'installer-015.jpg', 
                'installer-016.jpg', 
                'installer-017.jpg', 
                'installer-018.jpg', 
                'installer-019.jpg', 
                'installer-020.jpg', 
                'installer-021.jpg', 
                'installer-022.jpg', 
                'installer-023.jpg', 
                'installer-024.jpg', 
                'installer-025.jpg', 
                'installer-026.jpg', 
                'installer-027.jpg', 
                'installer-028.jpg', 
                'installer-029.jpg' 
            ];

            var items = '', active_set = false;
            imgs.forEach(function(img) {
                if (!active_set) {
                    items += tmpl_active.replace('$1', 'images/' + img).replace('$2', img);
                    active_set = true;
                } else
                    items += tmpl.replace('$1', 'images/' + img).replace('$2', img);
            });
            
            $p.find('.carousel-inner').html(items);
            $p.carousel();
        },
        
        postSetup: function() {
            this.$logs = $('#install-log');
            this.setupPresentation();
            progressbar.init($('#install-progress'));

            this.app.buttons.get("forward").enable();
            this.app.buttons.get("forward").change(i18n.gettext('install'));


            var that = this;
            this.app.buttons.get("forward").bind('click', function() {
                that.app.buttons.get("forward").disable();
                that.app.buttons.get("close").disable();

                window.apis.services.partition.commit(function(result) {
                    if(result.status === "failure"){
                        console.log(result.reason);
                    } else if (result.status === "success") {
                        that.onInstall();
                    } else {
                        console.log(result);
                    };
                });
            });
        },

        onInstall: function() {
            console.log(this.app.options);
            //mock_packAndUnpack(this.app.options, $.proxy(this.onProgress, this));
            window.apis.services.install.packAndUnpack(
                this.app.options, $.proxy(this.onProgress, this));
        },

        buildMessage: function(msg, kind) {
            var $msg = $('<span class="label ' + kind + '"></span>');
            $msg.text(msg);
            this.$logs.html($msg);
        },

        onProgress: (function() {
            var progress = 0;

            return function(respond) {
                if (respond.status === "progress") {
                    var percentage = parseInt(respond.data, 10);
                    
                    percentage = isNaN(percentage) ? 0: percentage;
                    percentage = Math.min(percentage, 100);

                    if (progress >= percentage)
                        return;
                    progress = percentage;

                    this.buildMessage('install progress: ' + respond.data + '%', '');
                    progressbar.update(respond.data);
                    
                } else if (respond.status === "failure") {
                    this.buildMessage(respond.reason, 'label-error');
                    this.app.buttons.get("close").enable();
                    
                } else if (respond.status === "success") {
                    this.buildMessage(
                        i18n.gettext('Congratulations~You have finished installing the system.'),
                        'label-important');
                    this.app.buttons.get("close").enable();

                } else {
                    this.buildMessage(respond.status, 'label-info');
                }
            };
        }()),

        validate: function(callback) {
            // check if install finished
            callback();
            //return true;
        }
    };

    return page;
});


