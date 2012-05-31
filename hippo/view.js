// some view handle methods


var fs = require('fs');
var fspath = require('path');
var _ = require('underscore');

var exports = module.exports;

var _exts = ['.js', '.coffee', '.css'];

// file content caches
var assetsCache = {};

// collecting all files with ext in exts recursivling, and 
// store in a hash map
function collectFilesSync(absPath, exts) {
    'use strict';

    var collection = {};

    function removePrefix(prefix, aPath) {
        return aPath.replace(new RegExp('^' + prefix), '');
    }

    function matchExt(aPath) {
        return _.any( exts.map(function(ext) {
            return RegExp(ext +'$').test(aPath);
        }) );
    }

    function doCollect(path) {
        var entries = fs.readdirSync(path);

        entries.forEach(function(entry) {
            var file = fspath.join(path, entry);
            var stat = fs.statSync(file);

            if (stat.isFile() && matchExt(file)) {
                var ext = fspath.extname(file);
                collection[ext] = collection[ext] || {};
                collection[ext][removePrefix(absPath, file)] = file;

            } else if (stat.isDirectory()) {
                doCollect(file);
            }
        });
    }

    doCollect(absPath);

    return collection;
};

function collectPathsSync(assetPaths, exts) {
    var files = {}, tmp;
    assetPaths.forEach(function(assetPath) {
        tmp = collectFilesSync(assetPath, exts);
        _.keys(tmp).forEach(function(key) {
            if (!_.has(files, key)) 
                files[key] = {};
            files[key] = mapMerge(files[key], tmp[key]);
        });
    });

    return files;
}

function mapMerge(map1, map2) {
    return _.defaults(map1, map2);
}

function minifyCode(code) {
    var jsparser = require('uglify-js').parser;
    var uglify = require('uglify-js').uglify;

    var ast = jsparser.parse(code);
    ast = uglify.ast_mangle(ast);
    ast = uglify.ast_squeeze(ast);

    return uglify.gen_code(ast);
}

exports.packAssets = function(app, http, assetPath) {
    'use strict';

    var opts = app.options;
    var files;

    if (typeof assetPath === 'string') {
        files = collectFilesSync(assetPath, _exts);
    } else {
        files = collectPathsSync(opts.assets, _exts);
    }
    //console.log("collected: \n", files);

	// register all assets using minified
    files['.js'] && _.keys(files['.js']).forEach(function(assetName) {
	    http.all(assetName, function(req, res, next) {
			res.header('Content-Type', 'application/x-javascript');
            var code = minifyCode( fs.readFileSync(files['.js'][assetName], 'utf-8') );
			res.send(code);
			res.end();
		});
	});

    files['.css'] && _.keys(files['.css']).forEach(function(assetName) {
	    http.all(assetName, function(req, res, next) {
			res.header('Content-Type', 'text/css');
			res.send(fs.readFileSync(files['.css'][assetName], 'utf-8'));
			res.end();
		});
	});
};

// this could be used at client side js and css
exports.assembleAssets = function(app, http, assetPath) {
    'use strict';

    var opts = app.options;
    var files;

    if (typeof assetPath === 'string') {
        files = collectFilesSync(assetPath, _exts);
    } else {
        files = collectPathsSync(opts.assets, _exts);
    }
    //console.log("collected: \n", files);
    
    if (!assetsCache['.js']) {
        assetsCache['.js'] = '';
        files['.js'] && _.keys(files['.js']).forEach(function(assetName) {
            assetsCache['.js'] += fs.readFileSync(files['.js'][assetName], 'utf-8');
        });
    }

    http.all('/hippoall.js', function(req, res, next) {
        res.header('Content-Type', 'application/x-javascript');
        res.send(assetsCache['.js']);
        res.end();
    });

    if (!assetsCache['.css']) {
        assetsCache['.css'] = '';
        files['.css'] && _.keys(files['.css']).forEach(function(assetName) {
            assetsCache['.css'] += fs.readFileSync(files['.css'][assetName], 'utf-8');
        });
    }

    http.all('/hippoall.css', function(req, res, next) {
        res.header('Content-Type', 'text/css');
        res.send(assetsCache['.css']);
        res.end();
    });
};

// if cascade === true, means the result can be pipe to another preprocessor
exports.interpolateAssetsHead = function(assetPaths, view, cascade) {
    'use strict';

    var files = collectPathsSync(assetPaths, _exts);

    var header = '';
    header += '<script src="/dnode.js"></script>';
    files['.js'] && _.keys(files['.js']).forEach(function(assetName) {
        header += '<script src="' + assetName + '"></script>';
	});

    files['.css'] && _.keys(files['.css']).forEach(function(assetName) {
        header += '<link href="' + assetName + '" rel="stylesheet" type="text/css"/>';
	});

    if (cascade)
        header += '<!--=require_all-->';
    var result = view.replace(new RegExp('<!--=require_all-->'), header);
    return result;
};
