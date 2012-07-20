#!/usr/bin/env python

import parted  
import _pedmodule
import sys
import json


def print_disk_helper_to_json_format(parts):
    """Return the stat of part given."""
    parts_data = []
    for part in parts:
        partty =""
        tmp = {}
        if part.type == parted.PARTITION_NORMAL:
            partty = "primary"
        elif part.type & parted.PARTITION_LOGICAL:
            partty = "logical"
        elif part.type & parted.PARTITION_EXTENDED:
            partty = "extended"
        elif part.type & parted.PARTITION_FREESPACE:
            partty = "free"
        elif part.type & parted.PARTITION_PROTECTED:
            partty = "protected"
        elif part.type & parted.PARTITION_METADATA:
            #partty = "metadata"
            continue

        start = parted.formatBytes(part.geometry.start*512,'GB')
        end = parted.formatBytes(part.geometry.end*512,'GB')
        size =  end - start
        if size < 0.01 and part.number < 0:
            continue
        fstype = ""
        if part.fileSystem:
            fstype = str(part.fileSystem.type)
        tmp = { 
                "number": part.number, 
                "start": start, 
                "end": end, 
                "size": size, 
                "ty": partty,
                "fs": fstype,
                }
        parts_data.append(tmp)
    return parts_data

def print_disk_to_json_format(disk,free):
    """Return the stat of disk given."""
    parts = []
    if free == True:
        part = disk.getFirstPartition()
        while part:
            parts.append(part)
            part = part.nextPartition()
    else:
        parts = disk.partitions
    disk_data = print_disk_helper_to_json_format(parts)
    return disk_data

def print_disks_to_json_format(disks,free):
    """Return the stat of disks given with json."""
    data = []
    devpaths = disks.keys()
    for devpath in devpaths:
        dev = parted.getDevice(devpath)
        disksize = parted.formatBytes(dev.getLength()*512,'GB')
        dev_data = {
            "model": dev.model,
            "path":  dev.path,
            "size": disksize,
            "type": "unknow",
            "unit": 'GB',
            "table": [],
            }
        if(disks[devpath]):
            disk = disks[devpath]
            dev_data["type"] = disk.type
            dev_data["table"] = print_disk_to_json_format(disk,free)
        data.append(dev_data)

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
    print_disk_helper(parts)

def print_disks(disks,free):
    """Print the stat of disks given."""
    devpaths = disks.keys()
    for devpath in devpaths:
        dev = parted.getDevice(devpath)
        disk = disks[devpath]
        print "dev model: %s" % (dev.model), 
        if disk:
            print ", type: %s" % (disk.type, ),
            print ", primaries: %d" % (disk.primaryPartitionCount, )
            #FIXME: this crashes on gpt device
            #print "maxSupportedPartitionCount: %d" % (disk.maxSupportedPartitionCount, )
            print_disk(disk, free)
        else:
            print ", type: unknown",
            print ", primaries: 0"

def parted_print(disks,isjson = False,free = False):
    """Get all disks,if disks is not given.Return the json data if 
    isjson is true.Get the stat of freepartition if free is true."""
    # disks = {devpath:disks}
    if disks is None:
        disks = {}
        for dev in parted.getAllDevices():
            try:
                disks[dev.path] = parted.disk.Disk(dev)
            except:
                disks[dev.path] = None
                continue
    if isjson:
        return  print_disks_to_json_format(disks,free)
    else:
        print_disks(disks,free)

def DevDisk():
    disks = {}
    for dev in parted.getAllDevices():
        try:
            disks[dev.path] = parted.disk.Disk(dev)
        except:
            disks[dev.path] = None
            continue
    return disks

