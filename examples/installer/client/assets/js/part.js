/*
 * =====================================================================================
 *
 *       Filename:  part.js
 *
 *    Description:  part page
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

define(['jquery', 'system', 'jade', 'js_validate', 'i18n'], function($, _system, _jade, jsvalidate, i18n) {
    'use strict';

    var pageCache;

    console.log('load partition');
    var page = {
        view: '#part_tmpl',
        locals: null,
        app: null,
         
        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            var that = this;
            that.app = app;

            window.apis.services.partition.reset(function(result) {
                if(result.status === "success"){
                    window.apis.services.partition.getPartitions(function(disks) {
                        that.locals = { 
                            'disks': disks,
                            gettext: function(msgid) { return i18n.gettext(msgid); }
                        };
                        pageCache = undefined;
                        console.log("success");
                        callback();
                    });

                }else if(result.status === "failure"){
                    console.log(result);
                    //TODO
                }else{
                    console.log("data error");
                    //TODO
                };
            });
            console.log('part initialized');
        },

        // compile and return page partial
        loadView: function() {
            if (typeof pageCache === 'undefined') {
                this.locals = this.locals || {};
                pageCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            }

            return pageCache;
        },

        postSetup: function() {
            $('body').off('click','button.new');
            $('body').off('click','button.delete');
            this.locals = this.locals || {};
            var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(this.locals);
            $("fieldset").after(pageC);

            this.app.button_handler.rm("forward","disabled");
            this.app.button_handler.rm("backward","disabled");

            var that = this;
            $('body').on('click','button.new',function () {
                //TODO
            });

            $('body').on('click','button.delete',function () {
                var devpath = $(this).attr("devpath");
                var partnumber = $(this).attr("partnumber");
                window.apis.services.partition.rmpart(devpath,partnumber,function(result){
                    if (result.status === "success") {
                        window.apis.services.partition.getPartitions(function(disks) {
                            that.locals["disks"] = disks;
                            var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(that.locals);
                            $("#part-table").replaceWith(pageC);
                        });
                    }else if(result.status === "failure") {
                        //TODO
                        console.log(result.reason);
                    }else {
                        //TODO
                        console.log(result);
                    };
                });
            });
        },

        rewind: function() {
            //enable backward
            return true;
        },

        validate: function() {
            $('fieldset').find('b').remove();
            jsvalidate.execu();

            if( jsvalidate.result === false ){
                jsvalidate.result = true;
                return false;
            };
            this.app.userData['username'] = $('#name').attr('value');
            this.app.userData['passwd'] = $('#password').attr('value');
            this.app.userData['newroot'] = $("fieldset").find(":checked").attr("value");

            if( typeof this.app.userData['newroot'] === "undefined" ){
                $('#getpartitions').before('<b>You must choose a disk. </b>');
                return false;
            };

            //TODO: validate selected partition
            return true;
        }
    };

    return page;
});


