var lib = require('./hippo');
var express = require('express');
var dnode = require('dnode');
var _ = require('underscore');

module.exports = function() {
    'use strict';
    var apis = lib.apis;

    var defaults = {
        port: '8080',
        // servicePaths: default location to found services
        servicePaths : [__dirname + '/services'],
    };
    var server;
    var opts = arguments.length && Array.isArray(arguments[0]) ? arguments[0] : {};
    if (!opts.servicePaths) {
        opts.servicePaths = [];
    }
    opts.servicePaths = _.union(opts.servicePaths, defaults.servicePaths);

    console.log('servicePaths: ', opts.servicePaths);
    if (!opts.port) {
        opts.port = defaults.port;
    }

    return {
        start: function() {
            server = express.createServer()
            .use(express.logger())
            .use(express.static(__dirname))
            .use(express.static(__dirname + '/static'))
            .listen(opts.port);

            console.log(apis);
            return dnode(apis).listen(server);
        },

        loadServices: function() {
            console.log('do loading services');
            lib.loadServices(opts.servicePaths);
            return this;
        },
    };
};
