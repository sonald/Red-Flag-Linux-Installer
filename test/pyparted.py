#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import _pedmodule
import getopt
import sys

def check_device(devpath):
    try:
        parted.getDevice(devpath)
    except parted.DeviceException:
        return False
    return True

def print_disk_helper(disk):
    parts = disk.partitions
    print "dev model: %s" % (disk.device.model, )
    print "disk type: %s" % (disk.type, )
    print "primaries: %d" % (disk.primaryPartitionCount, )
    #FIXME: this crashes on gpt device
    #print "maxSupportedPartitionCount: %d" % (disk.maxSupportedPartitionCount, )
    print "No.\tname\tpath\t\ttype  \t  fs\t\tsize"
    for part in parts:
        print "%d\t%s\t%s\t%s\t%s\t\t%dMB" %  \
            (part.number, part.name, part.path,
                 part.type and _pedmodule.partition_type_get_name(part.type) or '[  ]',
                 '  ' + (part.fileSystem and part.fileSystem.type or "[  ]"), part.getSize())


def print_disks():
    # list devices
    disks = [ parted.disk.Disk(dev) for dev in parted.getAllDevices() ]
    for disk in disks:
        print_disk_helper(disk)

def print_disk(args):
    disk = parted.disk.Disk(parted.getDevice(args[0]))
    print_disk_helper(disk)

def mkpart(args):
    pass

def rmpart(args):
    pass

def mklabel(args):
    pass
    
def usage():
    print "%s: [OPTION]... [DEVICE [CMD [PARAM]...]...]" % (sys.argv[0], )
    print "\t-d,--dev device  operate only on device specified"

_commands = {
        "print" : print_disk,
        "mkpart" : mkpart,
        "rm" : rmpart,
        "mklabel" : mklabel,
        }

def dispatch(cmd, args):
    cands = [ cand for cand in _commands.keys() if cand.startswith(cmd) ]    
    if len(cands) > 1:
        print "ambiguous cmd %s, possible ones %s " % (cmd, cands)
        sys.exit(1)

    if not check_device(args[0]): 
        return False
    _commands[cands[0]](args)

if __name__ == "__main__":
    # check uid
    try:                                
        opts, args = getopt.getopt(sys.argv[1:], "hd:l", ["help", "dev=", "list"]) 
    except getopt.GetoptError:           
        usage()                          
        sys.exit(2)         

    #print opts
    for opt in opts:
        op, arg = opt[0], opt[1]
        if op == '-l' or op == '--list':
            print_disks()
            sys.exit(0)

    if len(args) > 1:
        cmd = args[1]
        del args[1]
        dispatch(cmd, args)

