#!/usr/bin/env python
# simple partition tool lib with purpose on pyparted testing 

import parted  
import _pedmodule
import sys

import partedprint
import rfparted

class PartedCmd(object):
    def __init__(self, disk, devpath):
        if devpath:
            self.dev = parted.getDevice(devpath)
        else:
            raise Exception, "no device specified"

        if disk:
            self.disk = disk;
        else:
            raise Exception, "no disk specified"

    def mkpart(self, parttype, start, end, fs):
        args = [parttype, start, end, fs]
        try:
            self.disk = rfparted.mkpart(args, self.dev, self.disk)
        except Exception,e:
            return self.get_result(e)
        return self.get_result(None)

    def rmpart(self,partnumber):
        args = [partnumber]
        try:
            self.disk = rfparted.rmpart(args, self.dev, self.disk)
        except Exception,e:
            return self.get_result(e)
        return self.get_result(None)

    def mklabel(self, devtype):
        try:
            self.dev = parted.freshDisk(self.dev,str(devtype))
        except Exception,e:
             return self.get_result(e)

        self.disk = parted.disk.Disk(self.dev)
        return self.get_result(None)

    def reset(self):
        self.disk = parted.disk.Disk(self.dev)
        return self.get_result(None)

    def printpart(self):
        disks = [self.disk]

        return partedprint.parted_print(disks,True,True)

    def get_result(reason):
        if reason:
            result = [{ 'status': 'failure', 'reason': str(reason) }]
        else:
            result = [{ 'status': 'success'}]

        return json.dumps(result)
        

