#!/usr/bin/env python
""" Partitioning Service """

import os
import time
import sys
import json

import tornado.web
import tornadio2

# used for testing
_stubDisks = [
        { 
            "model": "ATA HITACHI HTS72321 (scsi)",
            "path": "/dev/sda",
            "size": "160GB",
            "type": "msdos",
            "table": [
                [ 1, "32.3kB", "32.2GB", "32.2GB", "primary", "ext4" ],
                [ 2, "96.7GB", "160GB", "63.4GB", "extended", "" ],
                [ 5, "96.7GB", "129GB", "32.2GB", "logical", "ext4" ],
            ]
        },
        { 
            "model": "SSK SFD201 (scsi)",
            "path": "/dev/sdb",
            "size": "15GB",
            "type": "gpt",
            "table": [
                [ 1, "32.3kB", "32.2GB", "32.2GB", "part1", "ext4" ],
                [ 2, "96.7GB", "160GB", "63.4GB", "part2", "" ],
                [ 3, "96.7GB", "129GB", "32.2GB", "part3", "ntfs" ],
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

class PartitioningService(tornado.web.RequestHandler):
    """Partitioning Service
    """
    serviceName = "partitioning"

    def initialize(self):
        if PartitioningSocket.reporter:
            self.reporter = PartitioningSocket.reporter

    def report(self, data):
        if self.reporter:
            self.reporter.send(data)
        else:
            print "no reporter found, keep silent"

    def get(self):
        cmd = self.get_argument('cmd')
        if cmd == "view":
            self.render("../views/partition.html", disks=_stubDisks)

        elif cmd == "getDeviceList":
            print "send: ", json.dumps(_stubDeviceList)
            self.write(json.dumps(_stubDeviceList))

        elif cmd == "getAllDisks":
            print "send: ", json.dumps(_stubDisks)
            self.write(json.dumps(_stubDisks))

    @tornado.web.asynchronous
    def post(self):
        """ do partitioning """
        cmd = self.get_argument('cmd')
        if cmd == "commit":
            pass
        elif cmd == "partition":
            for i in range(0, 101, 2):
                pack = json.dumps({
                    'progress': i
                    })
                time.sleep(.1)
                print pack
                self.report(pack)
        self.finish()

class PartitioningSocket(tornadio2.SocketConnection):
    reporter = None

    def on_open(self, info):
        self.__class__.reporter = self
        pass

    def on_message(self, msg):
        pass

    def on_close(self):
        self.__class__.reporter = None
        pass

