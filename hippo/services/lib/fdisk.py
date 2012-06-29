#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import getopt
import sys
import rfparted
import partedprint

def check_device(devpath):
    """Given the operating system level path to a device node, set
    the value of self.dev and self.disk.  Return false if an 
    invalid path is given."""
    try:
        parted.getDevice(devpath)
    except parted.DeviceException:
        return False
    return True
    
def usage():
    print "%s: [OPTION]... [DEVICE [CMD [PARAM]...]...]" % (sys.argv[0], )
    print "Option:"
    #print "\t-d,--dev device  operate only on device specified"
    print "\t-h,--help \t\t show help information"
    print "\t-l,--list[free|json] \t lists partition layout on all block devices"
    print
    print "Command:"
    print "\tmklabel LABEL-TYPE                        create a new disklabel (partition table)"
    print "\tmkpart PART-TYPE START END [FS-TYPE]      make a partition"
    print "\trm NUMBER                                 delete partition NUMBER"
    print "\tprint [free|json]                         display the partition table,free space "
    print "\t                                          or get the result with json"

def print_handler(opts,args):
    #disks = {devpath:disks}
    disks = {}
    isjson = False
    withfree = False
    for opt in opts:
        op, arg = opt[0],opt[1]
        if op == '-l' or op == '--list':
            disks = None
        elif op == '-h' or op == '--help':
            usage()
            sys.exit(0)
        else:
            usage()
            sys.exit(1)


    for arg in args:
        if arg == 'json':
            isjson = True
        elif arg == 'free':
            withfree = True
        elif arg == 'print' and disks == []:
            if not check_device(args[0]): 
                usage()
                sys.exit(1)
            else:
                dev = parted.getDevice(args[0])
                try:
                    disks[dev.path] = parted.disk.Disk(dev)
                except:
                    disks[dev.path] = None
    if isjson:
        print partedprint.parted_print(disks,isjson,withfree)
    else:
        partedprint.parted_print(disks,isjson,withfree)

if __name__ == "__main__":
    # check uid
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hl", ["help", "list"]) 
    except getopt.GetoptError:           
        usage()                          
        sys.exit(2)         

    #print_handler
    if opts or "print".startswith(args[1]):
        print_handler(opts,args)
        sys.exit(0)
            
    if not check_device(args[0]): 
        sys.exit(1)

    if len(args) > 1:
        cmd = args[1]
        dev = parted.getDevice(args[0])
        try:
            disk = parted.disk.Disk(dev)
        except:
            print "the dev's type is unknow."
            sys.exit(1)

        del args[1]
        del args[0]

        new_disk = dispatch(cmd, args, dev, disk)
        if new_disk:
            new_disk.commit()
            print_disk_helper(new_disk)

