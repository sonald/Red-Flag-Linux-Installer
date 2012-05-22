#!/usr/bin/env python
""" User Service """

import os
import time
import sys
import json

import tornado.web
import tornadio2

# used for testing

class UserService(tornado.web.RequestHandler):
    """User Service
    """
    serviceName = "user"

    def initialize(self):
        if UserSocket.reporter:
            self.reporter = UserSocket.reporter

    def report(self, data):
        if self.reporter:
            self.reporter.send(data)
        else:
            print "no reporter found, keep silent"

    def get(self):
        self.render("../views/user.html")

    @tornado.web.asynchronous
    def post(self):
        """ create a new user"""
        cmd = self.get_argument('cmd')
        if cmd == 'commit':
            name = self.get_argument('name')
            self.reporter.send(name)

        self.finish()

class UserSocket(tornadio2.SocketConnection):
    reporter = None

    def on_open(self, info):
        self.__class__.reporter = self
        pass

    def on_message(self, msg):
        pass

    def on_close(self):
        self.send("abc")
        self.__class__.reporter = None
        pass
    
