#!/usr/bin/env python
# hippo server

import os
import time
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
        self.render("views/index.html", name="Sian Cao", envs=os.environ)

    # request install
    def post(self):
        print "request install: ", self.request.arguments
        self.install()
        #print self.get_argument('version')

    def install(self):
        time.sleep(5)
        self.finish()
        pass

class ProgressHandler(tornado.websocket.WebSocketHandler):
    clients = []

    def open(self):
        print "WebSocket opened"

    def on_message(self, msg):
        print "Got Cmd: ", msg 
        if msg == 'progress':
            # make it async, so front won't busy wait
            self.async_callback(self.report)()
        pass

    def on_close(self):
        print "WebSocket closed"

    def report(self):
        for i in range(1, 101):
            self.write_message(str(i)+u"%")
            time.sleep(0.2)

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
    app.listen(8080)
    tornado.ioloop.IOLoop.instance().start()
