#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import json
import sys
import rfparted

class PartedHelper(object):
    def __init__(self,data = None):
        """Transform the data given from json to python. Raises
        Exception if None is given"""

        if data:
            self.data = json.loads(data)
            self.dev = None
            self.disk = None
        else:
            raise Exception, 'no data specified'

    def check_device(self):
        """Given the operating system level path to a device node, set
        the value of self.dev and self.disk.  Raises Exception if an 
        invalid path is given."""

        cmd = self.data[0]['action']
        args = self.data[0]['args']
        if cmd == 'target':
            try:
                self.dev = parted.getDevice(args[0])
            except:
                reason ="Could not stat device " + \
                        args[0] + " - No such file or directory."
                raise Exception, reason
            
            self.disk = parted.disk.Disk(self.dev)
        else:
            raise Exception, "no disk specified"
        del self.data[0]
 
    def dev_part(self):
        """Handle the disk according to the data given step by step.
        The commands in the tasks only include rm, mkpart and mklabel.
        Raises Exception if a wrong task is executed."""

        for step in self.data:
            cmd = step['action']
            args = step['args']
            try:
                self.disk = rfparted.dispatch(cmd,args,self.dev,self.disk)
            except Exception,e:
                raise Exception, e
        self.disk.commit()

    def get_result(self,reason):
        """ Transform the result of these tasks from to python_format 
        to json_format."""

        if reason:
            result = [{ 'status': 'failure', 'reason': str(reason) }]
        else:
            result = [{ 'status': 'success'}]
        return json.dumps(result)

    def execute(self):
        """Handle the tasks according to the given data.Return none 
        if success or return the reason of failure"""

        try:
            self.check_device()
            self.dev_part()
        except Exception , e:
            return self.get_result(e)
        return self.get_result(None)
