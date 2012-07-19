#!/usr/bin/env python
""" Partition Service """

import os
import sys
import json
import tornadio2
import tornado
import parted
import time

import lib.partedprint
import lib.rfparted

class PartSocket(tornadio2.SocketConnection):
    disks = lib.partedprint.DevDisk()
    def on_open(self, info):
        pass

    def on_message(self,msg):
        pass

    def on_close(self):
        pass
    
    def error_handle(self,reason):
        result = []
        if reason is not None:
            result = { 'status': 'failure', 'reason': str(reason) }
        else:
            result = { 'status': 'success'}
        return json.dumps(result)

    def has_disk(self,devpath):
        if devpath in self.disks:
            if self.disks[devpath] is not None:
                return True
        return False

    @tornadio2.event
    def mkpart(self, devpath, parttype, start, end, fs):
        data = self.error_handle(None)       
        start = parted.sizeToSectors(float(start), "GB", 512)
        end = parted.sizeToSectors(float(end), "GB", 512)

        if self.has_disk(devpath):
            disk = self.disks[devpath]
            dev = parted.getDevice(devpath)
            try:
                disk = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)
            except Exception, e:
                data = self.error_handle(e)
        else:
            data = self.error_handle("args is error.")

        self.emit('mkpart',data)

    @tornadio2.event
    def rmpart(self, devpath, partnumber):
        data = self.error_handle(None)       
        if self.has_disk(devpath):
            disk = self.disks[devpath]
            try:
                disk = lib.rfparted.rmpart(disk, partnumber)
            except Exception, e:
                data = self.error_handle(e)
        else:
            data = self.error_handle("error arguments,no disk specified")
        self.emit('rmpart',data)

    @tornadio2.event
    def reset(self):
        parted.freeAllDevices()
        self.disks = {}
        for dev in parted.getAllDevices():
            self.disks[dev.path] = lib.rfparted.reset(dev)
        data = self.error_handle(None)
        self.emit('reset',data)

    @tornadio2.event
    def commit(self):
        data = self.error_handle(None)
        for disk in self.disks.values():
            if disk is None:
                continue
            try:
                disk.commit()
            except Exception, e:
                data = self.error_handle(e)
        self.emit('commit',data)

    @tornadio2.event
    def getpartitions(self):
        data = lib.partedprint.parted_print(self.disks,True,True)
        self.emit('getpartitions',data)

    @tornadio2.event
    def fdhandler(self, devpath):
        data = self.error_handle(None)##TODO
        dev = parted.getDevice(devpath)
        ###unit of devsize is GiB short of GB
        ###so the unit of start and end should use GiB
        size = dev.getSize('GB')
        disk = parted.disk.Disk(dev)
        parttype = "primary"
        if disk.deleteAllPartitions() and size >= 6:
            fs = "linux-swap(v1)"
            start = parted.sizeToSectors(0, "GB", 512)
            end = parted.sizeToSectors(1, "GB", 512)
            try:
                disk = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)
                fs = "ext4"
                start = parted.sizeToSectors(1.01, "GB", 512)
                end = parted.sizeToSectors(size, "GB", 512)
                if size > 30:
                    end = parted.sizeToSectors(30, "GiB", 512)
                disk = lib.rfparted.mkpart(dev, disk, parttype, start, end, fs)
                self.disks[devpath] = disk
                data = lib.partedprint.parted_print(self.disks,True,True)
            except Exception, e:
                data = self.error_handle(e)
        else:
            data = self.error_handle("You'd better choose a disk larger than 6G.")
        
        self.emit('fdhandler',data)


if __name__ == "__main__":
    MyRouter = tornadio2.TornadioRouter(PartSocket)
    app = tornado.web.Application(
                            MyRouter.urls,
                            socket_io_port = 3000)
    socketio_server = tornadio2.server.SocketServer(app)
