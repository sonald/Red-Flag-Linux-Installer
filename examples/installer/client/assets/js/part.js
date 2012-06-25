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

define(['jquery', 'system', 'jade'], function($) {
    'use strict';

    var pageCache;

    console.log('load partition');
    var page = {
        view: '#part_tmpl',
        locals: null,
        app: null,
         
        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            var self = this;
            self.app = app;

            window.apis.services.partition.reset(function(result) {
                if(result.status === "success"){
                    window.apis.services.partition.getPartitions(function(disks) {
                        self.locals = disks;
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
            var mypage;
            if (typeof mypage === 'undefined') {
                this.locals = this.locals || {};
                console.log(this.locals);
                mypage = ( jade.compile($(this.view)[0].innerHTML,
                                           {locals:['disks']})
                            )( {disks: this.locals} );
            }

            return mypage;
        },

        postSetup: function() {
        },

        validate: function() {
            this.app.userData['username'] = $('#name').attr('value');
            this.app.userData['passwd'] = $('#password').attr('value');
            this.app.userData['newroot'] = $("fieldset").find(":checked").attr("value");

            //TODO: validate selected partition
            return true;
        }
    };

    return page;
});


