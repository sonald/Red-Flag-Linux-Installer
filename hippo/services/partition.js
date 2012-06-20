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

        process.on('uncaughtException', function(err) {
            partsever.kill('SIGHUP');
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
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.mklabel = function(devpath, devtype, cb) {
        if(sock && sock.socket.connected){
            sock.emit('mklabel', devpath, devtype);
            sock.once('mklabel',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.reset = function(cb) {
        if(sock && sock.socket.connected){
            sock.emit('reset', devpath);
            sock.once('reset',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.getPartitions = function(cb) {
        var partical = "";
        if(sock && sock.socket.connected){
            sock.emit('getpartitions');
            sock.once('getpartitions',function(result){
                    var disks = JSON.parse(result);
                    cb(disks);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.printpart = function(devpath, cb) {
        var partical = "";
        if(sock && sock.socket.connected){
            sock.emit('printpart',devpath);
            sock.once('printpart',function(result){
                fs.readFile(__dirname+'/../../client/views/getpartitions.jade', 'utf8' ,function (err, data) {
                    if (err) throw err;
                    partical = data;
                    var disks = JSON.parse(result);
                    var fn = jade.compile(partical,{locals:['disks']});
                    var str = fn({disks:disks});

                    cb(str);
                });
            });
        }else{
            cb({error:"sever is loading",});
        }
    };

    PartitionStub.commitdisk = function(cb){
        if(sock && sock.socket.connected){
            sock.emit('commitdisk');
            sock.on('commitdisk',function(data){
                cb(data);
            });
        }else{
            cb({error:"sever is loading",});
        }
    };


    return PartitionStub;
}());
