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

function watchService(file, fn) {
    'use strict';

    fs.watchFile(file, function(cur, prev) {
        console.log('cur mtime: ', cur.mtime);
        //reset require cache
        require.cache[file] || delete require.cache[file];
        fn();
    });

}

//TODO: support coffeescript, make it more efficient
var loadDirectory = function(path, ns) {
    'use strict';

    console.log('load %s', path);
    var files = fs.readdirSync(path);

    files.forEach(function(entry) {
        var file = fspath.join(path, entry);
        var stat = fs.lstatSync(file);

        if (stat.isFile() && /\.js$/.test(file)) {
            try {
                var intf = fspath.basename(entry, '.js');
                ns.__defineGetter__(intf, function() {
                    console.log('loading %s', file);
                    //TODO: re-require if service updated
                    return require(file);
                });
                watchService(file, function() {
                    ns[intf]; 
                });

            } catch(e) {
                console.log(e);
            }

        } else if (stat.isDirectory()) {
            ns[entry] = ns[entry] || {}; // merge existed
            loadDirectory(file, ns[entry]);
        }
    });

};

// accept a path or a group of path as arguments
var loadServices = module.exports.loadServices = function(paths) {
    'use strict';

    if ('undefined' === typeof paths) 
        return;
    
    var dest = [];

    if (typeof paths === 'string') {
        dest = [paths];

    } else if (Array.isArray(paths)) {
        dest = paths;

    } else {
        console.log('invalid argument: ', paths);
        return;
    }

    dest.forEach(function(path) {
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
