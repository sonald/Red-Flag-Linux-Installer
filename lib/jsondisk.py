#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import json
import sys
from rfparted import *

class Parted_by_json(object):
    def __init__(self,data = None):
        if data is None:
            result("there is no data")

        mydata = json.loads(data)
        self.wrong_step = None
        self.data = None
        if mydata[0]['action'] == 'target':
            args = mydata[0]['args']
            try:
                self.dev = parted.getDevice(args[0])
            except Exception, e:
                reason ="Could not stat device " + args[0] + " - No such file or directory."
                result(reason)

            self.dev = parted.getDevice(args[0])
            self.disk = parted.disk.Disk(self.dev)
            del mydata[0]
            self.data = mydata
        else:
            result("stat the disk path first")

    def steps(self):
        """Return the number of tasks"""
        return len(self.data)

    def parted_by_step(self):
        """parted"""
        for step in self.data:
            cmd = step['action']
            args = step['args']
            self.disk = dispatch(cmd,args,self.dev,self.disk)

        self.disk.commit()
        result(None)
