#!/usr/bin/env node

var hippo = require('./hippo');

// optional
var options = {
    port: 8080, 
    servicePaths: [__dirname]
};

var app = hippo(options).loadServices().start();

