#!/usr/bin/env python
""" Partition Service """

from gevent import monkey; monkey.patch_all()

from socketio import socketio_manage
from socketio.server import SocketIOServer
from socketio.namespace import BaseNamespace
import os
import sys
import json
import parted
import time

import lib.partedprint
import lib.rfparted
import lib.autoparted

class PartSocket(BaseNamespace):
    disks, disks_tag  = lib.autoparted.DevDisk()
    def error_handle(self,reason,handle_part):
        result = []
        if reason is not None:
            result = { 'status': 'failure', 'reason': str(reason) }
        elif handle_part is None:
            result = { 'status': 'success'}
        else:
            result = {'status' : 'success' , 'handlepart':str(handle_part)}
        return json.dumps(result)

    def has_disk(self,devpath):
        if devpath in self.disks:
            if self.disks[devpath] is not None:
                return True
        return False

    def on_mkpart(self, devpath, parttype, start, size, end, fs):
        data = {}
        if self.has_disk(devpath):
            disk = self.disks[devpath]
            dev = parted.getDevice(devpath)
            partnumber = [ part.number for part in disk.partitions ]
            size = parted.sizeToSectors(size, "GB", 512)
            try:
                self.disks[devpath] = lib.rfparted.mkpart(dev, disk, parttype, start,size, end, fs)
                self.disks_tag[devpath] = True
            except Exception, e:
                data = self.error_handle(e,None)

            for p in disk.partitions:
                if p.number in partnumber:
                    continue
                data = self.error_handle(None,"add"+devpath+ str(p.number))
                break;
        else:
            data = self.error_handle("Error arguments,no disk specified", None)

        self.emit('mkpart',data)

    def on_rmpart(self, devpath, partnumber):
        data = self.error_handle(None,"del"+devpath+str(partnumber))
        if self.has_disk(devpath):
            disk = self.disks[devpath]
            try:
                self.disks[devpath] = lib.rfparted.rmpart(disk, partnumber)
                self.disks_tag[devpath] = True
            except Exception, e:
                data = self.error_handle(e,None)
        else:
            data = self.error_handle("error arguments,no disk specified", None)
        self.emit('rmpart',data)

    def on_reset(self):
        parted.freeAllDevices()
        self.disks, self.disks_tag = lib.autoparted.DevDisk()
        data = self.error_handle(None, None)
        self.emit('reset',data)

    def on_commit(self):
        data = self.error_handle(None, None)
        for devpath in self.disks.keys():
            if self.disks_tag[devpath] is False:
                continue
            try:
                self.disks[devpath].commit()
            except Exception, e:
                data = self.error_handle(e,None)
        self.emit('commit',data)

    def on_getpartitions(self):
        data = lib.partedprint.parted_print(self.disks,True,True)
        self.emit('getpartitions',data)

    def on_setFlag(self, devpath, number, name, status):
        data = self.error_handle (None, None)
        try:
            disk = self.disks[devpath]
            lib.rfparted.setFlag(disk, number, name, status)
        except Exception, e:
            data = self.error_handle(e,None)
        self.emit('setFlag',data)

    def on_fdhandler(self, devpath, mem, sysflag):
        data = self.error_handle(None, None)
        try :
            dev = parted.getDevice(devpath)
            fdresult = lib.autoparted.fdhandler(dev,mem, self.disks, sysflag)
            self.disks[devpath] = fdresult[0]
            number = fdresult[1]
            self.disks_tag[devpath] = True
            data = self.error_handle(None,number)
        except Exception, e:
            data = self.error_handle(e, None)
        self.emit('fdhandler', data)

    def on_easyhandler(self, devpath, parttype, start, end, number):
        data = self.error_handle(None,None)
        try :
            dev = parted.getDevice(devpath)
            disk = self.disks[devpath]
            easyresult = lib.autoparted.easyhandler(dev, disk, parttype, start, end, number)
            self.disks[devpath] = easyresult[0]
            number = easyresult[1]
            self.disks_tag[devpath] = True
            data = self.error_handle(None,number)
        except Exception, e:
            data = self.error_handle(e, None)
        self.emit('easyhandler',data)

class Application(object):
    def __init__(self):
        self.buffer = []
        self.request = {};

    def __call__(self, environ, start_response):
        path = environ['PATH_INFO'].strip('/')
        if path.startswith("socket.io"):
            socketio_manage(environ, {'': PartSocket})

if __name__ == "__main__":
    SocketIOServer(('localhost', 3000), Application(),
        resource = "socket.io", policy_server=False).serve_forever()
