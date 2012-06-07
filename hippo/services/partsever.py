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
import lib.partedhelper
import lib.partedcmd

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
        if reason:
            result = [{ 'status': 'failure', 'reason': str(reason) }]
        else:
            result = [{ 'status': 'success'}]
        return json.dumps(result)
    
    def updatedisks(self):
        devs = parted.getAllDevices()
        new_disks = {}
        for dev in devs:
            if dev.path in self.disks:
                new_disks[dev.path] = self.disks[dev.path]
            else:
                new_disks[dev.path] = parted.disk.Disk(dev)

        self.disks = new_disks

    @tornadio2.event
    def mkpart(self, devpath, parttype, start, end, fs):
        self.updatedisks()
        if devpath in self.disks:
            disk = self.disks[devpath] #need try
            obj = lib.partedcmd.PartedCmd(disk,devpath)
            data = obj.mkpart(parttype, start, end, fs)
            self.disks[devpath] = obj.disk
        else:
            data = self.error_handle("error arguments,no disk specified")
        self.emit('mkpart',data)

    @tornadio2.event
    def rmpart(self, devpath, partnumber):
        self.updatedisks()
        if devpath in self.disks:
            disk = self.disks[devpath] #need try
            obj = lib.partedcmd.PartedCmd(disk,devpath)
            data = obj.rmpart(partnumber)
            self.disks[devpath] = obj.disk
        else:
            data = self.error_handle("error arguments,no disk specified")
        self.emit('rmpart',data)

    @tornadio2.event
    def reset(self, devpath):
        self.updatedisks()
        if devpath in self.disks:
            disk = self.disks[devpath] #need try
            obj = lib.partedcmd.PartedCmd(disk, devpath)
            data = obj.reset()
            self.disks[devpath] = obj.disk
        else:
            data = self.error_handle("error arguments,no disk specified")
        self.emit('reset',data)

    @tornadio2.event
    def mklabel(self, devpath, devtype):
        self.updatedisks()
        if devpath in self.disks:
            disk = self.disks[devpath] #need try
            obj = lib.partedcmd.PartedCmd(disk,devpath)
            data = obj.mklabel(devtype)
            self.disks[devpath] = obj.disk
        else:
            data = self.error_handle("error arguments,no disk specified")
        self.emit('mklabel',data)

    @tornadio2.event
    def printpart(self, devpath):
        #obj = lib.partedcmd.PartedCmd(disk,devpath)
        #data = obj.printpart()
        self.updatedisks()
        if devpath in self.disks:
            disk = self.disks[devpath] #need try
            data = lib.partedprint.parted_print([disk],True,True)
        else:
            data = self.error_handle("error arguments,no disk specified")
        self.emit('printpart',data)

    @tornadio2.event
    def getpartitions(self,devpath):
        self.updatedisks()
        disks = self.disks.values()
        data = lib.partedprint.parted_print(disks,True,True)
        self.emit('getpartitions',data)

    @tornadio2.event
    def commitdisk(self):
        self.updatedisks()
        for i in range(10):
            up = i
            time.sleep(1)
            self.emit('commitdisk',up)

if __name__ == "__main__":
    MyRouter = tornadio2.TornadioRouter(PartSocket)
    app = tornado.web.Application(
                            MyRouter.urls,
                            socket_io_port = 3000)
    socketio_server = tornadio2.server.SocketServer(app)
