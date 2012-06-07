#!/usr/bin/env python
# simple partition tool lib with purpose on pyparted testing 

import parted  
import _pedmodule
import sys
import json

import partedprint
import rfparted

class PartedCmd(object):
    def __init__(self, disk = None, devpath = None):
        if devpath is None:
            raise Exception, "no device specified"
        elif disk is None:
            raise Exception, "no disk specified"

        self.disk = disk;
        self.devpath = devpath

    def mkpart(self, parttype, start, end, fs):
        args = [parttype, start, end, fs]
        try:
            self.dev = parted.getDevice(self.devpath)
            self.disk = rfparted.mkpart(args, self.dev, self.disk)
        except Exception,e:
            return self.get_result(e)
        return self.get_result(None)

    def rmpart(self,partnumber):
        args = [partnumber]
        try:
            self.dev = parted.getDevice(self.devpath)
            self.disk = rfparted.rmpart(args, self.dev, self.disk)
        except Exception,e:
            return self.get_result(e)
        return self.get_result(None)

    def mklabel(self, devtype):
        try:
            self.dev = parted.getDevice(self.devpath)
            self.dev = parted.freshDisk(self.dev,str(devtype))
        except Exception,e:
            return self.get_result(e)

        self.disk = parted.disk.Disk(self.dev)
        return self.get_result(None)

    def reset(self):
        try:
            self.dev = parted.getDevice(self.devpath)
        except Exception,e:
            return self.get_result(e)

        self.disk = parted.disk.Disk(self.dev)
        return self.get_result(None)

    def printpart(self):
        disks = [self.disk]

        return partedprint.parted_print(disks,True,True)

    def get_result(self,reason):
        result=[]
        if reason:
            result = [{ 'status': 'failure', 'reason': str(reason) }]
        else:
            result = [{ 'status': 'success'}]

        return json.dumps(result)
        

