#!/usr/bin/env python
""" Unpacking Service """

import os
import time
import sys
import json

import tornado.web
import tornadio2

class UnpackingService(tornado.web.RequestHandler):
    """Unpacking Service
    """
    serviceName = "unpacking"

    def initialize(self):
        if UnpackingSocket.reporter:
            self.reporter = UnpackingSocket.reporter

    def report(self, data):
        if self.reporter:
            self.reporter.send(data)
        else:
            print "no reporter found, keep silent"

    def get(self):
        cmd = self.get_argument('cmd')
        if cmd == "view":
            self.render("../views/unpack.html")

        elif cmd == "size":
            print "send: ", json.dumps(1<<24)
            self.write(json.dumps(1<<24))

    @tornado.web.asynchronous
    def post(self):
        cmd = self.get_argument('cmd')
        if cmd == "unpack":
            for i in range(0, 101, 2):
                pack = json.dumps({
                    'progress': i
                    })
                time.sleep(.1)
                print pack
                self.report(pack)
        self.finish()


class UnpackingSocket(tornadio2.SocketConnection):
    reporter = None

    def on_open(self, info):
        self.__class__.reporter = self
        pass

    def on_message(self, msg):
        pass

    def on_close(self):
        self.__class__.reporter = None
        pass

