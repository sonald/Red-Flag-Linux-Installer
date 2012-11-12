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
var program = require('commander');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var async = require('async');
var pathlib = require('path');
var installer = null;
// require('longjohn');

function sprintf(fmt) {
    'use strict';

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

    var debug = '';
    if (program.debug) {
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
		});
    });
}

function tryLoadFrontend() {
    'use strict';

    var urllib = require('url');

    var urlObj = urllib.parse(program.url || 'http://127.0.0.1:8080', true);
    urlObj.query.autorun = !!program.autorun;
    urlObj.query.sony = !!program.sony;
    urlObj.query.restore = !!program.restore;

    var url = urllib.format(urlObj);
    console.log(url);

    var candidates = [__dirname+ '/libs/run.py', 'chromium', 'google-chrome', 'firefox'];

    async.filter(candidates, testExists, function(results) {
        console.log('found: ', results);
        if (results.length === 0) {
            console.log('no appropriate frontend found');
            process.exit(1);
        }
        var fe = spawn(results[0], [url], {cwd: __dirname, env: process.env});
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

function kern_cmdline_probe(condition, callback) {
    var cmd = 'awk \'BEGIN{RS=" "; FS="="; found=0;} ' + condition + ' {if (!length($2)) $2=1; found=$2; } ' + 
        + 'END {print found;} \' /proc/cmdline';

    exec(cmd, {encoding: 'utf8'}, function(err, stdout) {
        stdout = stdout ? stdout.trim() : "";
        if (err) {
            stdout = false;
        } else if (!+stdout || stdout == false) {
            stdout = false;
        }

        callback(stdout);
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
    'use strict';

    process.on(sig, function() {
        console.log(sig);
        process.exit(0);
    });
});

program
    .option('-d, --debug', 'output debug infomation from server')
    .option('-a, --autorun', 'initiate autorun mode of installer')
    .option('-s, --sony', 'initiate sony mode of installer')
    .option('-u, --url <url>', 'url of install server')
    .option('-r, --restore', 'launch restore mode for OEM only')
    .parse(process.argv);

sanityCheck();
kern_cmdline_probe('$1 == "rfrestore"', function(res) {
    program.restore = !!res;
    startServer();
});
