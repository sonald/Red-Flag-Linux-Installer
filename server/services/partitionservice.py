#!/usr/bin/env python
""" Partitioning Service """

import os
import time
import sys
import json

import tornado.web
import tornadio2

# used for testing
_stubDisk = [
        { 
            "Model": "ATA HITACHI HTS72321 (scsi)",
            "path": "/dev/sda",
            "size": "160GB",
            "type": "msdos",
            "table": [
                (1, "32.3kB", "32.2GB", "32.2GB", "primary", "ext4"),
                (2, "96.7GB", "160GB", "63.4GB", "extended", ""),
                (5, "96.7GB", "129GB", "32.2GB", "logical", "ext4"),
            ]
        },
    ]
        
_stubDeviceList = [
        { 
            "Model": "ATA HITACHI HTS72321 (scsi)",
            "path": "/dev/sda",
            "size": "160GB",
            "type": "msdos",
        },
        { 
            "Model": "SSK SFD201 (scsi)",
            "path": "/dev/sdb",
            "size": "15GB",
            "type": "gpt",
        },
    ]
class PartitionService(tornado.web.RequestHandler):
    """Partitioning Service
    """
    serviceName = "partitioning"

    def initialize(self, socket=None):
        """ socket is socket.io used to report progress """
        self.report = socket.send if socket else self.write
        print "initializing PartitionService"

    def setReporter(socket=None):
        self.report = socket.send if socket else self.write

    def get(self):
        cmd = self.get_argument('cmd')
        if cmd == "view":
            self.render("../views/partition.html")

        elif cmd == "getDeviceList":
            print "send: ", json.dumps(_stubDeviceList)
            self.write(json.dumps(_stubDeviceList))

        elif cmd == "getAllDisks":
            print "send: ", json.dumps(_stubDisk)
            self.write(json.dumps(_stubDisk))

    @tornado.web.asynchronous
    def post(self):
        """ do partitioning """
        cmd = self.get_argument('cmd')
        if cmd == "commit":
            pass
        elif cmd == "partition":
            for i in range(1, 101):
                pack = json.dumps({
                    'progress': i
                    })
                time.sleep(.1)
                print pack
                self.report(pack)
        self.finish()

class PartitioningSocket(tornadio2.SocketConnection):
    def on_message(self, msg):
        pass

