#!/usr/bin/env node

var hippo = require('../../hippo');

// optional, all path here are relative to ./client/
var options = {
    port: 8080, 
    servicePaths: ['services'],
    viewEngine: 'jade', // use jade templating  
    appView: 'app.jade',
    assets: ['assets'], // static js and css
};

var app = hippo(options).loadServices().start();
console.log('app started at 127.0.0.1:%d', options.port);
