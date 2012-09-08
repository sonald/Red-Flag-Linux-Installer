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
    };

    var t;
    function timedCount() {
        $.galleryUtility.rightImage.image.trigger('click');
        t = setTimeout(timedCount, 5000);
    };

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
            var tmpl = '<img src="$1" alt="$2"></img>';
            var tmpl_active = '<img src="$1" alt="$2" class="start"></img>';
            
            var imgs = [
                'installer-001.png',
                'installer-002.png',
                'installer-003.png',
                'installer-004.png',
                'installer-005.png',
                'installer-006.png',
                'installer-007.png',
                'installer-008.png',
                'installer-009.png',
                'installer-010.png',
                'installer-011.png',
                'installer-012.png',
                'installer-013.png',
                'installer-014.png',
                'installer-015.png',
                'installer-016.png',
                'installer-017.png',
                'installer-018.png',
                'installer-019.png',
            ];

            var items = '', active_set = false;
            imgs.forEach(function(img) {
                if (!active_set) {
                    items += tmpl_active.replace('$1', 'images/' + img).replace('$2', img);
                    active_set = true;
                } else
                    items += tmpl.replace('$1', 'images/' + img).replace('$2', img);
            });
            
            $p.find('.mygallery').html(items);
            $p.find('.mygallery img').slidingGallery({
                container: $p,
                Lheight: 270,
                gutterWidth:25,
            });
            timedCount();
        },
        
        postSetup: function() {
            this.$logs = $('#install-log');
            this.setupPresentation();
            progressbar.init($('#install-progress'));

            this.app.buttons.get("forward").change(i18n.gettext('Install'));

            var that = this;
            that.app.buttons.get("forward").disable();
            that.app.buttons.get("forward").bind('click');
            that.app.buttons.get("close").disable();
            that.app.buttons.get("close").bind('click');

            window.apis.services.partition.commit(function(result) {
                if(result.status === "failure"){
                    console.log(result.reason);
                } else if (result.status === "success") {
                    that.onInstall();
                } else {
                    console.log(result);
                };
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
                    this.app.buttons.get("close").bind('click', function() {
                        window.installer && window.installer.closeInstaller();
                    });
                    clearTimeout(t);
                } else if (respond.status === "success") {
                    clearTimeout(t);
                    this.app.forward();
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


