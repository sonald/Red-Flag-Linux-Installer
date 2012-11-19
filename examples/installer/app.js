#!/usr/bin/env node

var hippo = require('../../hippo');
var fs = require('fs');
var pathlib = require('path');

function SysName() {
    var filename = '/etc/qomo-release';
    if (pathlib.existsSync(filename)) {
        return "Qomo";
    }
    return "Red Flag inWise";
}

// optional, all path here are relative to ./client/
var options = {
    port: 8080, 
    servicePaths: ['services'],
    viewEngine: 'jade', // use jade templating  
    appView: 'app.jade',
    assets: ['assets'], // static js and css
    localeDir: 'assets/locales'
};
var app = hippo(options).loadServices();
function processCheck() {
    var test_server = require('net').createServer();
    var result = true;
    test_server.on('error', function(e) {
        if (e.code == 'EADDRINUSE') {
            console.log('process check:eaddrinuse');
        }
	    process.exit(1);
    })
    test_server.listen('/tmp/qomo_installer.sock', function(){;
        var pid = 0, mypid = process.pid;
        var filename = '/var/run/qomo-installer.pid';
        if (pathlib.existsSync(filename)) {
	        console.error('process check');
            test_server.close();
	        process.exit(1);
        }
        fs.writeFileSync(filename, mypid, 'utf8');
        test_server.close();
        app.start();
        app.server.helpers({
            name: SysName()
        });
        console.log('app started at 127.0.0.1:%d', options.port);
    })
}
processCheck();
