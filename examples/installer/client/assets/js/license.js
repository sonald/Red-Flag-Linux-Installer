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

        // do initialization, called when loading the page
        initialize: function() {
            console.log('license initialized');
        },

        // compile and return page partial
        loadView: function() {
            if (typeof pageCache === 'undefined') {
                pageCache = ( jade.compile($(this.view).html()) )();
            }

            return pageCache;
        }
    };

    return page;
});


