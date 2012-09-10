#!/usr/bin/env node
/*
 * =====================================================================================
 *
 *       Filename:  bootstrap.js
 *
 *    Description:  bootstrap hippo and installer
 *
 *        Version:  1.0
 *        Created:  2012年06月28日 13时50分23秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (sonald), yinshuiboy@gmail.com
 *        Company:  Red Flag Linux Co. Ltd
 *
 * =====================================================================================
*/

// 1. run server in uid == 0
// 2. try to popup a web browser

/*jslint node: true*/

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var async = require('async');
var pathlib = require('path');
var installer = null;
// require('longjohn');

function sprintf(fmt) {
    fmt = fmt || "";
    if (arguments.length <= 1) {
        return fmt;
    }

    var args = [].slice.call(arguments, 1);
    var r = /%\d+/g;
    var match;
    var count = 1;
    var key2valMap = {};
    var result = fmt;

    while (args.length) {
        key2valMap['%'+count] = args.shift();
        count++;
    }

    while ((match = r.exec(fmt))) {
        if (!(match[0] in key2valMap)) {
            key2valMap[match[0]] = match[0];
        }
        result = result.replace(match[0], key2valMap[match[0]]);
    }

    return result;
}

function testExists(cmd, callback) {
    'use strict';

    if (cmd.indexOf(' ') != -1) {
        cmd = cmd.split(/\s+/)[0];
    }
    exec('which ' + cmd, {encoding: 'utf8'}, function(err, stdout) {
        callback(err?false:true);
    });
}

function startServer() {
    'use strict';

    var node_cmd = 'node app.js';
    var args = process.argv;
    var debug = '';
    if (args.indexOf('-d') > -1 || args.indexOf('--debug') > -1) {
        debug = 'NODE_DEBUG=1';
    }

    var cmd_list = [
        sprintf('gksudo -d -k -- %1 %2', debug, node_cmd),
        sprintf('kdesu -t -- %1 %2', debug, node_cmd)
    ];
    console.log(cmd_list);

    async.filter(cmd_list, testExists, function(results) {
        console.log('found: ', results);
        if (results.length === 0) {
            console.log('no appropriate frontend found');
            process.exit(1);
        }

        var cmd = results[0].split(/\s+/);

        installer = spawn(cmd[0], cmd.slice(1), {cwd: __dirname, env: process.env});

        var fe_loaded = false;
        installer.stdout.on('data', function(data) {
            var output = data.toString();
            if (!fe_loaded) {
                if (output.indexOf('app started at') >= 0) {
                    tryLoadFrontend();
                    fe_loaded = true;
                }
            }
            process.stdout.write(output);
        });

        installer.stderr.on('data', function(data) {
            process.stderr.write(data.toString());
        });

		installer.on ('exit', function(data) {
			if (data === 0) {
				var clear = spawn('sudo',['rm', '/var/run/qomo-installer.pid']);
			}
			process.exit(0);
		})
    });
}

function tryLoadFrontend() {
    'use strict';

    var options = {};
    if (process.argv.length > 2) {
        options.url = process.argv[process.argv.length - 1];
        if (options.url.indexOf('-') === 0) {
            options.url = null;
        }
    }

    console.log(options);

    var args = [ options.url || 'http://127.0.0.1:8080'];
    var candidates = [__dirname+ '/libs/run.py', 'chromium', 'google-chrome', 'firefox'];

    async.filter(candidates, testExists, function(results) {
        console.log('found: ', results);
        if (results.length === 0) {
            console.log('no appropriate frontend found');
            process.exit(1);
        }
        var fe = spawn(results[0], [args], {cwd: __dirname, env: process.env});
	fe.on('exit', function() {
	    if (installer && !installer.exitCode) {
                console.log('try kill node');

		var req = require('http').request({
		    host: 'localhost',
		    port: 8080,
		    method: 'POST',
		    path: '/shutdown'
		}, function(res) {
		    console.log(res);
		    process.exit(0);
		});

		req.on('error', function(err) {
		    console.log('req: ', err.message);
		});
		req.end('immediately');
	    }
	});

        process.on('exit', function() {
            if (!fe.exitCode) {
                fe.kill('SIGKILL');
            }
        });
    });
}

function sanityCheck() {
    'use strict';

    var standalone = false;

    if (!pathlib.existsSync('../../package.json')) {
        // installer is inside of hippo project
        standalone = true;
    }

    if (process.getuid() === 0) {
        console.error('please run in user mode');
        process.exit(1);
    }

    // check npm dependencies
    if (standalone) {
    }
}

['SIGTERM', 'SIGINT', "SIGHUP", "SIGQUIT"].forEach( function(sig) {
    process.on(sig, function() {
        console.log(sig);
        process.exit(0);
    });
});

sanityCheck();
startServer();
