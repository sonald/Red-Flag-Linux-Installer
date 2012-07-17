/*
 * =====================================================================================
 *
 *       Filename:  system.js
 *
 *    Description:  
 *
 *        Version:  1.0
 *        Created:  2012年06月18日 19时06分35秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (sonald), yinshuiboy@gmail.com
 *        Company:  Red Flag Linux Co. Ltd
 *
 * =====================================================================================
*/

require.config({
    paths: {
        dnode: '/dnode',
    },
    shim: {
        'bootstrap': ['jquery'],
        'jquery.knob': ['jquery'],
        'jquery.color':['jquery'],
        'sitemap': ['jquery'],
    },
});

// stub to load all hippo system libs
// the problem is that underscore is actually not AMD-compatible now, it expose global `_`
// as well as bootstrap
define(['jquery', 'jquery.knob', 'dnode', 'underscore', 'bootstrap', 'jade', 'jed', 'jquery.color', 'sitemap'], function($) {
    console.log('load sytem');
});

