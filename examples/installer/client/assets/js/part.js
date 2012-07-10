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
            $('body').on('click','a.delete',function () {
                var path = $(this).attr("devpath");
                var number = $(this).attr("partnumber");
                window.apis.services.partition.rmpart(
                    path, number, $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-submit',function () {
                var size, parttype, fstype, start, end, path;
                var id = $(this).attr("for");
                var $content = $("#"+id).find(".modal-body");
                var args = [];

                size = Number($content.find("#size")[0].value);
                $content.find(":checked").each(function(){
                    if (this.id) {
                        if (this.id === "beginning") {
                            start = Number(this.value);
                            end = start + size;
                        }
                        else if ( this.id === "end") {
                            end = Number(this.value);
                            start = end - size;
                        };
                    }else{
                        args.push(this.value);
                    }
                });
                path = "/dev/" + id.match(/[a-z]{3}$/g)[0];
                parttype = args[0];
                fstype = args[1];

                window.apis.services.partition.mkpart(
                    path, parttype, start, end, fstype, $.proxy(that.partflesh, that));
            });
        },

        rewind: function() {
            //enable backward
            return true;
        },

        validate: function(callback) {
            $('fieldset').find('b').remove();
            jsvalidate.execu();

            if( jsvalidate.result === false ){
                jsvalidate.result = true;
                return false;
            };
            this.app.userData['username'] = $('#name').attr('value');
            this.app.userData['passwd'] = $('#password').attr('value');
            this.app.userData['newroot'] = $("#part-table input[name='parts']:checked").attr("value");

            if( typeof this.app.userData['newroot'] === "undefined" ){
                $('#getpartitions').before(i18n.gettext('<b>You must choose a disk. </b>'));
                return false;
            };
            window.apis.services.partition.commit(function(result) {
                if(result.status === "failure"){
                    console.log(result.reason);
                    return false;
                }else if (result.status === "success") {
                    callback();
                    return true;
                }else{
                    console.log(result);
                    return false;
                }
            });
        },
        partflesh: function(result){
            var that = this;
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
        },
    };

    return page;
});


