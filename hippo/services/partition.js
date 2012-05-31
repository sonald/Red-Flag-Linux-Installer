var _ = require('underscore');
var util  = require('util'),
    spawn = require('child_process').spawn,
    partsever = spawn('sudo', [__dirname+'/partsever.py']);

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
function next(){
    sock = io.connect('http://localhost:3000', {'force new connection': true});
    sock.on('error',function(reason){
        //console.log(reason);
        process.nextTick(next);
    });
    sock.on('connect',function(){
        console.log("connection");
    });
};

process.nextTick(next);

module.exports = (function() {
    'use strict';

    //TODO: stub is adapter bridging alien partitioning service
    var PartitionStub = {};

    PartitionStub.mkpart = function(devpath, parttype, start, end, fs, cb) {
        if(sock && sock.socket.connected){
            sock.emit('mkpart',devpath, parttype, start, end, fs);
            sock.on('mkpart',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.rmpart = function(devpath, partnumber, cb) {
        if(sock && sock.socket.connected){
            sock.emit('rmpart',devpath, partnumber);
            sock.on('rmpart',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.mklabel = function(devpath, devtype, cb) {
        if(sock && sock.socket.connected){
            sock.emit('mklabel', devpath, devtype);
            sock.on('mklabel',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.reset = function(devpath, cb) {
        if(sock && sock.socket.connected){
            sock.emit('reset', devpath);
            sock.on('reset',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.getPartitions = function(devpath, cb) {
        if(sock && sock.socket.connected){
            sock.emit('printpart',devpath);
            sock.on('printpart',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    return PartitionStub;
}());
