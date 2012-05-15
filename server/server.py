#!/usr/bin/env python
# hippo server

import os
import time
import sys
import json

import tornado.web
import tornado.ioloop
import tornado.locale
import tornado.websocket
import tornado.escape

import tornadio2

import services.partitionservice as partservice

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("hello, world")

class HippoHandler(tornado.web.RequestHandler):
    """main entry for installer
    """
    def get(self):
        self.render("views/index.html", name=(os.getenv('USER') or os.getenv('LOGNAME')), 
                envs=os.environ)

    def post(self):
        print "request install: ", self.request.arguments

class UnpackingHandler(tornado.web.RequestHandler):
    serviceName = "unpacking"
    def get(self):
        self.render("views/index.html", name=(os.getenv('USER') or os.getenv('LOGNAME')), 
                envs=os.environ, stage=serviceName)

    def post(self):
        pass

class ProgressHandler(tornado.websocket.WebSocketHandler):
    reporter = None
    def open(self):
        self.__class__.reporter = self
        pass

    def on_message(self, msg):
        pass

    def on_close(self):
        self.__class__.reporter = None
        pass

settings = {
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        "debug": True # in debug mode, pages autoreload
        }

app = tornado.web.Application([
    (r"/", IndexHandler),
    (r"/hippo", HippoHandler),
    (r"/unpacking", UnpackingHandler),
    (r"/(test\.png)", tornado.web.StaticFileHandler,
        dict(path=settings['static_path'])),

    (r"/service/partitioning", partservice.PartitionService),

    (r"/ws", ProgressHandler),
    ], **settings)

if __name__ == "__main__":
    try:
        app.listen(8080)
        tornado.ioloop.IOLoop.instance().start()
    except:
        sys.exit(1)
