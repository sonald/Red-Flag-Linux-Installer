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
    reporter = None

    def initialize(self):
        if self.application.settings['reporter']:
            self.reporter = self.application.settings['reporter'].reporter

    def report(self, data):
        if self.reporter:
            self.reporter.write_message(data)
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


