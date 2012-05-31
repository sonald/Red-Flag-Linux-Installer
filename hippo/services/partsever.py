#!/usr/bin/env python
""" Partition Service """

import os
import sys
import json
import tornadio2
import tornado
import parted

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

    @tornadio2.event
    def mkpart(self, devpath, parttype, start, end, fs):
        disk = self.disks[devpath] #need try
        obj = lib.partedcmd.PartedCmd(disk,devpath)
        data = obj.mkpart(parttype, start, end, fs)
        self.disks[devpath] = obj.disk

        self.emit('mkpart',data)

    @tornadio2.event
    def rmpart(self, devpath, partnumber):
        disk = self.disks[devpath] #need try
        obj = lib.partedcmd.PartedCmd(disk,devpath)
        data = obj.rmpart(partnumber)
        self.disks[devpath] = obj.disk

        self.emit('rmpart',data)

    @tornadio2.event
    def reset(self, devpath):
        disk = self.disks[devpath] #need try
        obj = lib.partedcmd.PartedCmd(disk, devpath)
        data = obj.reset()
        self.disks[devpath] = obj.disk

        self.emit('reset',data)

    @tornadio2.event
    def mklabel(self, devpath, devtype):
        disk = self.disks[devpath] #need try
        obj = lib.partedcmd.PartedCmd(disk,devpath)
        data = obj.mklabel(devtype)
        self.disks[devpath] = obj.disk
        self.emit('mklabel',data)

    @tornadio2.event
    def printpart(self, devpath):
        disk = self.disks[devpath] #need try
        data = lib.partedprint.parted_print([disk],True,True)
        #obj = lib.partedcmd.PartedCmd(disk,devpath)
        #data = obj.printpart()
        print data
        self.emit('printpart',data)

if __name__ == "__main__":
    MyRouter = tornadio2.TornadioRouter(PartSocket)
    app = tornado.web.Application(
                            MyRouter.urls,
                            socket_io_port = 3000)
    socketio_server = tornadio2.server.SocketServer(app)
