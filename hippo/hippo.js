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

var loadDirectory = function(path, ns) {
    console.log('load %s', path);
    var files = fs.readdirSync(path);

    files.forEach(function(entry) {
        var file = fspath.join(path, entry);
        var stat = fs.lstatSync(file);

        if (stat.isFile() && /\.js$/.test(file)) {
            ns[fspath.basename(entry, '.js')] = require(file);

        } else if (stat.isDirectory()) {
            ns[entry] = ns[entry] || {}; // merge existed
            ns = ns[entry];
            loadDirectory(path, ns);
        }
    });

};

var loadServices = module.exports.loadServices = function(paths) {
    paths.forEach(function(path) {
        var ns = fspath.basename(path);
        apis[ns] = {};
        loadDirectory(path, apis[ns]);
    });
    console.log('apis: ', apis);
};

