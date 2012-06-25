#!/usr/bin/env python

import parted  
import _pedmodule
import sys
import json


def print_disk_helper_to_json_format(parts):
    """Return the stat of part given."""
    data = []
    for part in parts:
        partty =""
        tmp = []
        if part.type == parted.PARTITION_NORMAL:
            partty = "primary"
        elif part.type & parted.PARTITION_LOGICAL:
            partty = "logical"
        elif part.type & parted.PARTITION_EXTENDED:
            partty = "extended"
        elif part.type & parted.PARTITION_FREESPACE:
            partty = "freespace"
        elif part.type & parted.PARTITION_PROTECTED:
            partty = "protected"
        elif part.type & parted.PARTITION_METADATA:
            #partty = "metadata"
            continue

        start = parted.formatBytes(part.geometry.start*512,'MB')
        end = parted.formatBytes(part.geometry.end*512,'MB')
        size =  end - start
        fstype = ""
        if part.fileSystem:
            fstype = str(part.fileSystem.type)
        tmp = [ part.number, start, end, size, partty, fstype]
        data.append(tmp)
    return data

def print_disk_to_json_format(disk,free):
    """Return the stat of disk given."""
    size = disk.device.getSize()
    data = {
        "model": disk.device.model,
        "path": disk.device.path,
        "size":str(size)+'MB',
        "type":disk.type,
        "unit":'MB',
        "table":[],
        }
    parts = []
    if free == True:
        part = disk.getFirstPartition()
        while part:
            parts.append(part)
            part = part.nextPartition()
    else:
        parts = disk.partitions

    data['table'] = print_disk_helper_to_json_format(parts)
    return data

def print_disks_to_json_format(disks,free):
    """Return the stat of disks given with json."""
    data = []
    #for dev in parted.getAllDevices():
    for disk in disks:
        data.append(print_disk_to_json_format(disk,free))

    return json.dumps(data)

def print_disk_helper(parts):
    """Print the stat of parts given."""
    print "No.\tname\tpath\t\ttype  \t  fs\t\tsize"
    for part in parts:
        partty = ""
        if part.type == parted.PARTITION_NORMAL:
            partty += "NORMAL |"
        if part.type & parted.PARTITION_LOGICAL:
            partty += "LOGICAL |"
        if part.type & parted.PARTITION_EXTENDED:
            partty += "EXTENDED |"
        if part.type & parted.PARTITION_METADATA:
            partty += "METADATA |"
        if part.type & parted.PARTITION_PROTECTED:
            partty += "PROTECTED |"
        if part.type & parted.PARTITION_FREESPACE:
            partty += "FREESPACE |"
        print "%d\t%s\t%s\t%s\t%s\t\t%dMB" %  \
            (part.number, part.name, part.path,
                 partty or '[ ]',
                 '  ' + (part.fileSystem and part.fileSystem.type or "[  ]"), 
                 part.getSize())
    
def print_disk(disk,free):
    """Print the stat of disk given."""
    parts = []
    if free == True:
        part = disk.getFirstPartition()
        while part:
            parts.append(part)
            part = part.nextPartition()
    else:
        parts = disk.partitions
    print "dev model: %s" % (disk.device.model, ), 
    print ", type: %s" % (disk.type, ), 
    print ", primaries: %d" % (disk.primaryPartitionCount, )
    #FIXME: this crashes on gpt device
    #print "maxSupportedPartitionCount: %d" % (disk.maxSupportedPartitionCount, )
    print_disk_helper(parts)

def print_disks(disks,free):
    """Print the stat of disks given."""
    for disk in disks:
        print_disk(disk,free)

def parted_print(disks,isjson = False,free = False):
    """Get all disks,if disks is not given.Return the json data if 
    isjson is true.Get the stat of freepartition if free is true."""
    # list devices 
    if disks is None:
        disks = [ parted.disk.Disk(dev) for dev in parted.getAllDevices() ]

    if isjson:
        return  print_disks_to_json_format(disks,free)
    else:
        print_disks(disks,free)

def DevDisk():
    disks = {}
    for dev in parted.getAllDevices():
        disks[dev.path] = parted.disk.Disk(dev)

    return disks

