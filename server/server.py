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

from services.partitionservice import *
from services.unpackservice import *

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

class RouterConnection(tornadio2.SocketConnection):
    __endpoints__ = {
            '/' + PartitioningService.serviceName: PartitioningSocket,
            '/' + UnpackingService.serviceName: UnpackingSocket
            }
    def on_open(self, info):
        print 'Router: ', repr(info)


settings = {
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        "debug": True, # in debug mode, pages autoreload
        }

router = tornadio2.TornadioRouter(RouterConnection)

app = tornado.web.Application(
        router.apply_routes([
            (r"/", IndexHandler),
            (r"/hippo", HippoHandler),
            (r"/(test\.png)", tornado.web.StaticFileHandler,
                dict(path=settings['static_path'])),

            (r"/service/partitioning", PartitioningService),
            (r"/service/unpacking", UnpackingService)
            ]),
        socket_io_port = 8080,
        **settings)

if __name__ == "__main__":
    try:
        tornadio2.SocketServer(app)
        #app.listen(8080)
        #tornado.ioloop.IOLoop.instance().start()
    except:
        sys.exit(1)
