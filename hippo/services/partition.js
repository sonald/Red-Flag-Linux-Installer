var _ = require('underscore');
var jade = require('jade');
var fs = require('fs');
var util  = require('util');
var spawn = require('child_process').spawn;

var partsever, sock;

module.exports = (function() {
    'use strict';

    //TODO: stub is adapter bridging alien partitioning service
    var PartitionStub = {};
    
    // reload is true if this module is reloaded (due to live reload by file
    // changes)
    PartitionStub.initialize = function(reload) {
        if (reload) {
            return;
        }

        partsever = spawn('python2', [__dirname+'/partsever.py']);

        partsever.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
        });

        partsever.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        partsever.on('exit', function (code) {
            console.log('child process exited with code ' + code);
        });

        process.on('exit', function(code, signal) {
            partsever.kill('SIGTERM');
            console.log(code, signal);
        });

        process.on('uncaughtException', function(err) {
            partsever.kill('SIGTERM');
            console.log(err);
        });

        var io = require("socket.io-client");
        sock = io.connect("http://127.0.0.1:3000");

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
    };

    PartitionStub.mkpart = function(devpath, parttype, start, end, fs, cb) {
        if(sock && sock.socket.connected){
            sock.emit('mkpart',devpath, parttype, start, end, fs);
            sock.once('mkpart',function(data){
                data = JSON.parse(data);
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.commit = function(cb) {
        if(sock && sock.socket.connected){
            sock.emit('commit');
            sock.once('commit',function(data){
                data = JSON.parse(data);
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.rmpart = function(devpath, partnumber, cb) {
        if(sock && sock.socket.connected){
            sock.emit('rmpart',devpath, partnumber);
            sock.once('rmpart',function(data){
                data = JSON.parse(data);
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.reset = function(cb) {
        if(sock && sock.socket.connected){
            sock.emit('reset');
            sock.once('reset',function(data){
                data = JSON.parse(data);
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.getPartitions = function(cb) {
        if (sock && sock.socket.connected) {
            sock.emit('getpartitions');
            sock.once('getpartitions',function (result) {
                    var disks = JSON.parse(result);
                    cb(disks);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.FulldiskHandler = function ( devpath, cb) {
        if (sock && sock.socket.connected) {
            sock.emit('fdhandler', devpath);
            sock.once('fdhandler', function (disks) {
                cb(JSON.parse(disks));
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    return PartitionStub;
}());
