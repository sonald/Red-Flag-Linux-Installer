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

class PartSocket(BaseNamespace):
    disks = lib.partedprint.DevDisk()
    def on_open(self, info):
        pass

    def on_message(self,msg):
        pass

    def on_close(self):
        pass
    
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

    def on_mkpart(self, devpath, parttype, start, end, fs):
        data = {}
        start = parted.sizeToSectors(float(start), "GB", 512)
        end = parted.sizeToSectors(float(end), "GB", 512)

        if self.has_disk(devpath):
            disk = self.disks[devpath]
            dev = parted.getDevice(devpath)
            partnumber = []
            parts = disk.partitions
            for p in parts:
                partnumber.append(p.number)

            try:
                self.disks[devpath] = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)
            except Exception, e:
                data = self.error_handle(e,None)

            parts = disk.partitions
            for p in parts:
                if p.number in partnumber:
                    continue
                data = self.error_handle(None,"add"+devpath+ str(p.number))
                break;
        else:
            data = self.error_handle("args is error.",None)

        self.emit('mkpart',data)

    def on_rmpart(self, devpath, partnumber):
        data = self.error_handle(None,"del"+devpath+str(partnumber))
        if self.has_disk(devpath):
            disk = self.disks[devpath]
            try:
                self.disks[devpath] = lib.rfparted.rmpart(disk, partnumber)
            except Exception, e:
                data = self.error_handle(e,None)
        else:
            data = self.error_handle("error arguments,no disk specified", None)
        self.emit('rmpart',data)

    def on_reset(self):
        parted.freeAllDevices()
        self.disks = {}
        for dev in parted.getAllDevices():
            self.disks[dev.path] = lib.rfparted.reset(dev)
        data = self.error_handle(None, None)
        self.emit('reset',data)

    def on_commit(self):
        data = self.error_handle(None, None)
        for disk in self.disks.values():
            if disk is None:
                continue
            try:
                disk.commit()
            except Exception, e:
                data = self.error_handle(e,None)
        self.emit('commit',data)

    def on_getpartitions(self):
        data = lib.partedprint.parted_print(self.disks,True,True)
        self.emit('getpartitions',data)

    def on_fdhandler(self, devpath, mem):
        data = self.error_handle(None,None)##TODO
        dev = parted.getDevice(devpath)
        ###unit of devsize is GiB short of GB
        ###so the unit of start and end should use GiB
        sizeL = dev.getLength()
        size = dev.getSize('GB')
        disk = parted.disk.Disk(dev)
        parttype = "primary"
        if disk.deleteAllPartitions() and size > 10:
            fs = "linux-swap(v1)"
            start = parted.sizeToSectors(0, "GB", 512)
            end = parted.sizeToSectors(mem,'B',512)
            try:
                disk = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)

                fs = "ext4"
                start = end + 100;
                if size > 30:
                    end = parted.sizeToSectors(30, "GB", 512)
                    disk = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)
                    start = end + 100;
                end = sizeL - 100
                disk = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)

                self.disks[devpath] = disk
                data = lib.partedprint.parted_print(self.disks,True,True)
            except Exception, e:
                data = self.error_handle(e,None)
        elif disk.deleteAllPartitions() and size >= 6:
            fs = "ext4"
            start = parted.sizeToSectors(0, "GB", 512)
            end = sizeL - 100
            disk = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)

            self.disks[devpath] = disk
            data = lib.partedprint.parted_print(self.disks,True,True)
        else:
            data = self.error_handle("You'd better choose a disk larger than 6G.", None)
        
        self.emit('fdhandler',data)

class Application(object):
    def __call__(self, environ, start_response):
        path = environ['PATH_INFO'].strip('/')
        if path.startswith("socket.io"):
            socketio_manage(environ, {'': PartSocket})

if __name__ == "__main__":
    SocketIOServer(('127.0.0.1', 3000), Application(),
        resource="socket.io", policy_server=False).serve_forever()
