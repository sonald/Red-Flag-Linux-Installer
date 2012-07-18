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

    var cmd_list = [
        'pkexec --user root node ' + pathlib.join(__dirname, 'app.js'),
        'gksudo -t node app.js',
        'gksu -t node app.js',
        'kdesu node app.js'
    ];

    async.filter(cmd_list, testExists, function(results) {
        console.log('found: ', results);
        if (results.length === 0) {
            console.log('no appropriate frontend found');
            process.exit(1);
        }

        var cmd = results[0].split(/\s+/);
        var installer = spawn(cmd[0], cmd.slice(1), {cwd: __dirname, env: process.env});

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

        process.on('exit', function() {
            if (!installer.exitCode) {
                console.log('try kill node');
                // installer.kill('SIGKILL');
            }
        });
    });
}

function tryLoadFrontend() {
    'use strict';

    var options = {};
    if (process.argv.length > 2) {
        options.url = process.argv[2];
    }

    console.log(options);

    var args = [ options.url || 'http://127.0.0.1:8080'];
    var candidates = ['google-chrome', __dirname+ '/libs/run.py', 'chromium', 'google-chrome', 'firefox'];

    async.filter(candidates, testExists, function(results) {
        console.log('found: ', results);
        if (results.length === 0) {
            console.log('no appropriate frontend found');
            process.exit(1);
        }
        var fe = spawn(results[0], [args], {cwd: __dirname, env: process.env});

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

