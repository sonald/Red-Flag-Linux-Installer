#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import getopt
import sys
from rfparted import *

def check_device(devpath):
    try:
        parted.getDevice(devpath)
    except parted.DeviceException:
        return False
    return True
    
def usage():
    print "%s: [OPTION]... [DEVICE [CMD [PARAM]...]...]" % (sys.argv[0], )
    print "\t-d,--dev device  operate only on device specified"


if __name__ == "__main__":
    # check uid
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hd:lj", ["help", "dev=", "list", "json"]) 
    except getopt.GetoptError:           
        usage()                          
        sys.exit(2)         

    #print opts
    for opt in opts:
        op, arg = opt[0], opt[1]
        if op == '-l' or op == '--list':
            print_disks()
            sys.exit(0)
        if op == '-j' or op == '--json':
            data = print_to_json_format()
            print data
            sys.exit(0)
            
    if not check_device(args[0]): 
        sys.exit(1)

    if len(args) > 1:
        cmd = args[1]
        dev = parted.getDevice(args[0])
        disk = parted.disk.Disk(dev)
        del args[1]
        del args[0]

        new_disk = dispatch(cmd, args, dev, disk)
        if new_disk:
            new_disk.commit()
            print_disk_helper(new_disk)

