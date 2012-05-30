var lib = require('./hippo');
var fspath = require('path');
var express = require('express');
var dnode = require('dnode');
var _ = require('underscore');

module.exports = function() {
    'use strict';
    var apis = lib.apis;
    var server;
    var client_root = fspath.normalize(__dirname + "/../client/");

    var defaults = {
        port: '8080',
        viewEngine: 'jade', // default view template engine
        // servicePaths: default location to found services
        servicePaths : [__dirname + '/services'],
        appView: 'index.html',
        assets: [client_root + 'assets'], // static js and css
    };

    var opts = arguments[0] && (typeof arguments[0] === 'object') ? arguments[0] : {};
    opts.port = opts.port || defaults.port;
    if (!opts.servicePaths) {
        opts.servicePaths = [];
    } else {
        opts.servicePaths = opts.servicePaths.map(function(path) {
            return client_root + path;
        });
    }

    opts.appView = opts.appView || defaults.appView;
    opts.servicePaths = _.union(opts.servicePaths, defaults.servicePaths);
    opts.viewEngine = opts.viewEngine || defaults.viewEngine;
    if (!opts.assets) {
        opts.assets = [];
    } else {
        opts.assets = opts.assets.map(function(path) {
            return client_root + path;
        });
    }
    opts.assets = _.union(opts.assets, defaults.assets);

    console.log('servicePaths: ', opts.servicePaths);
    if (!opts.port) {
        opts.port = defaults.port;
    }

    return {
        start: function() {
            server = express.createServer()
            .use(express.logger());

            server.register('.jade', require('jade'));
            server.set('view engine', 'jade')
            .set('views', client_root + 'views');

            server.get('/', function(req, res, next) {
                // disable express layout, we use jade layout
                res.render(opts.appView, {layout: false});
                next();
            });
            
            server.use(express.static(__dirname));
            server.use(express.static(__dirname + '/static'))


            opts.assets.forEach(function(path) {
                fspath.exists(path, function(exists) {
                    if (!exists) 
                        return;

                    server.use(express.static(path));
                });
            });

            server.listen(opts.port);
            dnode(apis).listen(server);
            this.__defineGetter__('server', function() { return server; });
            return this;
        },

        loadServices: function() {
            console.log('do loading services');
            lib.loadServices(opts.servicePaths);
            return this;
        },
    };
};
