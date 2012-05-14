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

class IndexHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("hello, world")

class HippoHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("views/index.html", name=(os.getenv('USER') or os.getenv('LOGNAME')), 
                envs=os.environ)

    # request install
    def post(self):
        print "request install: ", self.request.arguments
        self.install()
        #print self.get_argument('version')

    def install(self):
        pack = json.dumps({
            'stage': 'partitioning', 
            })
        # do partitioning service
        ProgressHandler.clients[0].write_message(pack)
        time.sleep(2)

        for i in range(1, 101):
            pack = json.dumps({
                'stage': 'unpacking', 
                'progress': i
                })
            ProgressHandler.clients[0].write_message(pack)
            time.sleep(.1)

        pack = json.dumps({
            'stage': 'postscripting', 
            })
        ProgressHandler.clients[0].write_message(pack)
        time.sleep(2)
        self.finish()

class ProgressHandler(tornado.websocket.WebSocketHandler):
    clients = []

    def open(self):
        self.__class__.clients.append(self)
        print "WebSocket opened"

    def on_message(self, msg):
        self.dispatch(msg)

    def on_close(self):
        self.__class__.clients.remove(self)
        print "WebSocket closed"

    def dispatch(self, msg):
        print "Got Cmd: ", msg 
        if msg == 'progress':
            # make it async, so front won't busy wait
            self.async_callback(self.report)()
        pass

settings = {
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        "debug": True # in debug mode, pages autoreload
        }

app = tornado.web.Application([
    (r"/", IndexHandler),
    (r"/hippo", HippoHandler),
    (r"/(test\.png)", tornado.web.StaticFileHandler,
        dict(path=settings['static_path'])),
    (r"/ws", ProgressHandler),
    ], **settings)

if __name__ == "__main__":
    #tornado.locale.load_translations(
            #os.path.join(os.path.dirname(__file__), "translations"))
    try:
        app.listen(8080)
        tornado.ioloop.IOLoop.instance().start()
    except:
        sys.exit(1)
