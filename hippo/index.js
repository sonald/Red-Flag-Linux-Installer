var fspath = require('path');
var express = require('express');
var dnode = require('dnode');
var _ = require('underscore');

var compress = require('./compress');
var apis = require('./apis');
var viewManager = require('./view');

var exports = module.exports;

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

            // serve web app at root
            server.get('/', function(req, res, next) {
                //res.render(opts.appView);

                var jade = require('jade');
                var fs = require('fs');

                // Compile a function
                var viewPath = fspath.join(client_root, 'views', opts.appView);

                var tmpl = fs.readFileSync(viewPath);
                var fn = jade.compile(tmpl, {filename: viewPath});

                tmpl = fn();
                tmpl = viewManager.interpolateAssetsHead(opts.systemAssets, tmpl, true);
                tmpl = viewManager.interpolateAssetsHead(opts.assets, tmpl);
                res.send(tmpl);
            });
            
            //serving all assets
            var all_assets = _.union(opts.assets, opts.systemAssets);
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
                //FIXME: timing is not correct
                //viewManager.packAssets(server, all_assets);
                
                var oneYear = 31557600000;
                all_assets.forEach(function(path) {
                    fspath.exists(path, function(exists) {
                        if (!exists) 
                            return;

                        server.use(express.static(path), {maxAge: oneYear});
                    });
                });

                //HACK: connect 2.x is not compatible, so I copied from conntect 1.x
                //one thing to notice is that *DO NOT* install connect 2.x, cause this
                //will crash
                server.use(compress());
            });

            //viewManager.assembleAssets(this, server);


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
