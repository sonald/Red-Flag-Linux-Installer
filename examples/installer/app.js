#!/usr/bin/env node

var hippo = require('../../hippo');
var fs = require('fs');
var pathlib = require('path');
var spawn = require('child_process').spawn;

function processCheck() {
    var pid = 0, mypid = process.pid;
    var filename = '/var/run/qomo-installer.pid';
    if (pathlib.existsSync(filename)) {
        pid = Number(fs.readFileSync(filename, 'utf8'));
    }
    if (pid && pid > 0 && pathlib.existsSync ('/proc/'+pid+'/cmdline')) {
        return false;
        
    }else {
        fs.writeFileSync(filename, mypid, 'utf8');
    }
    return true;
}

function SysName() {
    var filename = '/etc/qomo-release';
    if (pathlib.existsSync(filename)) {
        return "Qomo";
    }
    return "inWise";
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


var app = hippo(options).loadServices();
app.start();
app.server.helpers({
    name: SysName()
});
console.log('app started at 127.0.0.1:%d', options.port);
