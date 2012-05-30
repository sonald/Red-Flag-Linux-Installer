var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var fspath = require('path');

var god = {
    expose: function(cb) {
        cb(util.inspect(this));
    }
};

var apis = module.exports.apis = _.extend(god);

//TODO: support coffeescript, make it more efficient
var loadDirectory = function(path, ns) {
    'use strict';

    console.log('load %s', path);
    var files = fs.readdirSync(path);

    files.forEach(function(entry) {
        var file = fspath.join(path, entry);
        var stat = fs.lstatSync(file);

        if (stat.isFile() && /\.js$/.test(file)) {
            var intf = require(file);
            //console.log("intf: ", intf);
            ns[fspath.basename(entry, '.js')] = intf;

        } else if (stat.isDirectory()) {
            ns[entry] = ns[entry] || {}; // merge existed
            loadDirectory(file, ns[entry]);
        }
    });

};

var loadServices = module.exports.loadServices = function(paths) {
    paths.forEach(function(path) {
        try {
            var stat = fs.lstatSync(path);
            if (!stat.isDirectory())
                return;

        } catch(e) {
            console.log(e);
            return;
        }

        var ns = fspath.basename(path);
        apis[ns] = apis[ns] || {};
        loadDirectory(path, apis[ns]);
    });
    console.log('apis: ', util.inspect(apis, false, 3));
};
