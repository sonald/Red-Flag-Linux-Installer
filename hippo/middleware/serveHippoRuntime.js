/*
 * =====================================================================================
 *
 *       Filename:  serveHippoRuntime.js
 *
 *    Description:  modify output html to serve assets
 *
 *        Version:  1.0
 *        Created:  2012年06月06日 17时31分10秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (yinshuiboy@gmail.com)
 *        Company:  
 *
 * =====================================================================================
*/

var fs = require('fs');
var urllib = require('url');

// interpolate app.jade file to support system assets ( js && css )
module.exports = function(options) {
    'use strict';

    var appView = options.viewPath;
    var systemAssets = options.systemAssets;
    var clientAssets = options.assets;

    return function(req, res, next) {
        if (req.method !== 'GET') 
            next();

        var path = urllib.parse(req.url).pathname;
        if (path !== '/')
            next();

        //TODO: check cache
        var tmpl = fs.readFileSync(appView);
        tmpl = viewManager.interpolateAssetsHead(systemAssets, tmpl, true);
        tmpl = viewManager.interpolateAssetsHead(clientAssets, tmpl);
        fs.writeFile(appView, tmpl, 'utf8', function(err) {
            if (err) {
                next(err);
            } else {
                next(); 
            }
        });

    };
};

