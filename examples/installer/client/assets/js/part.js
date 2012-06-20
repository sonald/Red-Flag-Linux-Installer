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
        locals:null,

        // do initialization, called when loading the page
        initialize: function(data) {
            this.locals = data
            console.log(this.locals);
            console.log('part initialized');
        },

        // compile and return page partial
        loadView: function(data) {
            if (typeof pageCache === 'undefined') {
                this.locals = this.locals || {};
                pageCache = ( jade.compile($(this.view)[0].innerHTML, {locals:['disks']}) )({disks:this.locals});
                console.log(pageCache);
            }

            return pageCache;
        }
    };

    return page;
});


