var _ = require('underscore');
var util  = require('util'),
    spawn = require('child_process').spawn,
    partsever    = spawn('sudo', ['python', __dirname+'/partsever.py']);

partsever.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
});

partsever.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
});

partsever.on('exit', function (code) {
    console.log('child process exited with code ' + code);
});


var io = require("socket.io-client");
var sock = io.connect("http://127.0.0.1:3000");

module.exports = (function() {
    'use strict';

    //TODO: stub is adapter bridging alien partitioning service
    var PartitionStub = {};

    PartitionStub.mkpart = function(devpath, parttype, start, end, fs, cb) {
        sock.emit('mkpart',devpath, parttype, start, end, fs);
        sock.on('mkpart',function(data){
            cb(data);
        });
    };

    PartitionStub.rmpart = function(devpath, partnumber, cb) {
        sock.emit('rmpart',devpath, partnumber);
        sock.on('rmpart',function(data){
            cb(data);
        });
    };

    PartitionStub.mklabel = function(devpath, devtype, cb) {
        sock.emit('mklabel', devpath, devtype);
        sock.on('mklabel',function(data){
            cb(data);
        });
    };

    PartitionStub.reset = function(devpath, cb) {
        sock.emit('reset', devpath);
        sock.on('reset',function(data){
            cb(data);
        });
    };

    PartitionStub.getPartitions = function(devpath, cb) {
        sock.emit('printpart',devpath);
        sock.on('printpart',function(data){
            cb(data);
        });
    };

    return PartitionStub;
}());
