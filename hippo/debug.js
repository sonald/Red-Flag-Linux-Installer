/*
 * =====================================================================================
 *
 *       Filename:  debug.js
 *
 *    Description:  debug support
 *
 *        Version:  1.0
 *        Created:  2012年06月15日 17时00分37秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (), yinshuiboy@gmail.com
 *        Company:  Red Flag Linux Co. Ltd
 *
 * =====================================================================================
*/

//TODO: support log into file or stream
module.exports = function(options) {
    'use strict';
    
    var debug = {};

    var opts = options || {};
    opts.level = opts.level || 0; 

    debug.env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

    debug.log = function() {
        if (debug.level > 2 || debug.env === 'development') {
            console.log.apply(null, arguments);
        }
    };

    debug.err = function() {
        if (debug.level > 0) {
            console.error.apply(null, arguments);
        }
    };

    debug.warn = function() {
        if (debug.level > 1) {
            console.warn.apply(null, arguments);
        }
    };

    return debug; 
};

