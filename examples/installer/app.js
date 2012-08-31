#!/usr/bin/env node

var hippo = require('../../hippo');
var fs = require('fs');
var spawn = require('child_process').spawn;

function processCheck() {
    var pid = 0;
    var filename = '/var/run/qomo-installer.pid';
    if (fs.existsSync(filename)) {
        pid = Number(fs.readFileSync(filename, 'utf8'));
    }
    if (pid && pid > 0 && fs.existsSync ('/proc/'+pid+'/cmdline')) {
        return false
    }else {
        pid = process.pid;
		fs.writeFileSync(filename, pid, 'utf8');
    }
    return true;
}

if (processCheck() === false) {
	console.error('process check');
	process.exit(1);
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

var app = hippo(options).loadServices().start();
console.log('app started at 127.0.0.1:%d', options.port);
