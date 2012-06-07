var fspath = require('path');
var express = require('express');
var dnode = require('dnode');
var fs = require('fs');
var _ = require('underscore');

var compress = require('./compress');
var apis = require('./apis');
var viewManager = require('./view');

var exports = module.exports;

exports.middleware = {};

_.chain(fs.readdirSync(__dirname + '/middleware'))
    .filter(function(file) {
        return /\.(js|coffee)$/.test(file);
    })
    .value()
    .forEach(function(file) {
        var name = file.substr(0, file.lastIndexOf('.'));
        console.log('middleware %s: %s', name, file);
        exports.middleware.__defineGetter__(name, function() {
            return require('./middleware/' + file);
        });
    });


module.exports = function() {
    'use strict';

    var server;
    var client_root = fspath.normalize(fspath.dirname(require.main.filename) + "/client");

    var defaults = {
        port: '8080',
        viewEngine: 'jade', // default view template engine
        // servicePaths: default location to found services
        servicePaths : ['/services'],
        appView: 'index.html',
        assets: [ '/assets' ], // static js and css

        systemAppView: __dirname + '/index.html',
        systemAssets: [ __dirname + '/static' ],
        systemServicePaths : [__dirname + '/services'],
    };

    var opts = arguments[0] && (typeof arguments[0] === 'object') ? arguments[0] : {};
    opts = _.defaults(opts, defaults);

    opts.servicePaths = opts.servicePaths.map(function(path) {
        return fspath.join(client_root, path);
    });
    // merge system services
    opts.servicePaths = _.union(opts.servicePaths, defaults.systemServicePaths);
    console.log('servicePaths: ', opts.servicePaths);

    if ( !fspath.existsSync(fspath.join(client_root, 'views', opts.appView)) ) {
        opts.appView = opts.systemAppView;
    }

    opts.assets = opts.assets.map(function(path) {
        return fspath.join(client_root, path);
    });

    //console.log(opts);

    return {
        start: function() {
            var self = this;

            server = express.createServer();

            server.register('.jade', require('jade'))
            .set('view engine', 'jade')
            .set('views', client_root + '/views')
            .set('view options', {   // disable express layout, we use jade layout
                layout: false
            });

            this.__defineGetter__('server', function() { return server; });
            this.__defineGetter__('options', function() { return opts; });

            //serving all assets
            var all_assets = _.union(opts.assets, opts.systemAssets);

            server.configure(function() {
                server.use(express.bodyParser());
                server.use(express.cookieParser());
                //TODO: use redis store at prod env 
                server.use(express.session(
                    {
                    secret: Date.now().toString()
                }));

            });

            viewManager.registerAssetsHeadHelper(server, 'systemAssets', opts.systemAssets);
            viewManager.registerAssetsHeadHelper(server, 'assets', opts.assets);
            server.helpers({
                'author': '<!-- Author: Sian Cao -->'
            });

            server.configure('development', function() {
                console.log('configure development');
                server.use(express.logger());

                all_assets.forEach(function(path) {
                    fspath.exists(path, function(exists) {
                        if (!exists) 
                            return;

                        server.use(express.static(path));
                    });
                });
            });

            server.configure('production', function() {
                console.log('configure production');
                server.use(express.csrf());
                //FIXME: timing is not correct
                //viewManager.packAssets(server, all_assets);

                //HACK: connect 2.x is not compatible, so I copied from conntect 1.x
                //one thing to notice is that *DO NOT* install connect 2.x, cause this
                //will crash
                server.use(compress());
                
                var oneYear = 31557600000;
                all_assets.forEach(function(path) {
                    fspath.exists(path, function(exists) {
                        if (!exists) 
                            return;

                        server.use(express.static(path), {maxAge: oneYear});
                    });
                });
            });

            //viewManager.assembleAssets(this, server);

            // serve web app at root
            server.get('/', function(req, res, next) {
                res.render(opts.appView);
            });

            server.listen(opts.port);
            dnode(apis.apis).listen(server);
            return this;
        },

        loadServices: function() {
            console.log('do loading services');
            apis.loadServices(opts.servicePaths);
            return this;
        },
    };
}; 

