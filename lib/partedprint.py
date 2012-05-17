#!/usr/bin/env python

import parted  
import _pedmodule
import sys
import json


def print_disk_helper_to_json_format(part):
    partty =""
    if part.type == parted.PARTITION_NORMAL:
        partty = "normal"
    elif part.type & parted.PARTITION_LOGICAL:
        partty = "logical"
    elif part.type & parted.PARTITION_EXTENDED:
        partty = "extended"
    elif part.type & parted.PARTITION_FREESPACE:
        partty = "freespace"
    elif part.type & parted.PARTITION_METADATA:
        partty = "metadata"
    elif part.type & parted.PARTITION_PROTECTED:
        partty = "protected"

    start = parted.formatBytes(part.geometry.start,'kB')
    end = parted.formatBytes(part.geometry.end,'kB')
    size =  end - start
    fstype = ""
    if part.fileSystem:
        fstype = str(part.fileSystem.type)

    data = [ part.number, start, end, size, partty, fstype]

    return data


def print_disk_to_json_format(disk,free):
    size = disk.device.getSize()
    data = {
        "model": disk.device.model,
        "path": disk.device.path,
        "size":str(size)+'MB',
        "type":disk.type,
        "unit":'KB',
        "table":[],
        }
    parts = []
    if free == True:
        part = disk.getFirstPartition()
        while part:
            parts.append(part)
            part = part.nextPartition()
    else:
        parts = disk.partitions:

    for part in parts:    
        table = print_disk_helper_to_json_format(part)
        data['table'].append(table)
    return data

def print_disks_to_json_format(disks,free):
    data = []
    #for dev in parted.getAllDevices():
    for disk in disks:
        data.append(print_dev_to_json_format(disk,free))

    return json.dumps(data)

def print_disk_helper(parts):
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
    parts = []
    if free == True:
        while part:
            parts = part.append(part)
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
    # list devices
    #disks = [ parted.disk.Disk(dev) for dev in parted.getAllDevices() ]
    for disk in disks:
        print_disk(disk,free)

def parted_print(disks,isjson = False,free = False):
    if isjson:
        print_disks(disks,free)
    else:
        return  print_to_json_format(disks,free)

