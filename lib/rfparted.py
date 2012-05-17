#!/usr/bin/env python
# simple partition tool lib with purpose on pyparted testing 

import parted  
import _pedmodule
import sys
import json

trans_from_mb = 2048 #1024*1024/512

partty_map = {
    'primary': parted.PARTITION_NORMAL,
    'extended': parted.PARTITION_EXTENDED,
    'free': parted.PARTITION_FREESPACE,
    'logical': parted.PARTITION_LOGICAL
}


def print_disk_helper(disk):
    parts = disk.partitions
    print "dev model: %s" % (disk.device.model, ), 
    print ", type: %s" % (disk.type, ), 
    print ", primaries: %d" % (disk.primaryPartitionCount, )
    #FIXME: this crashes on gpt device
    #print "maxSupportedPartitionCount: %d" % (disk.maxSupportedPartitionCount, )
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
                 '  ' + (part.fileSystem and part.fileSystem.type or "[  ]"), part.getSize())

def print_part_to_json_format(part):
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


def print_dev_to_json_format(dev):
    disk = parted.disk.Disk(dev)
    size = dev.getSize()
    data = {
        "model": dev.model,
        "path": dev.path,
        "size":str(size)+'MB',
        "type":disk.type,
        "unit":'KB',
        "table":[],
        }

    for part in disk.partitions:
        table = print_part_to_json_format(part)
        data['table'].append(table)

    return data

def print_to_json_format():
    data = []
    for dev in parted.getAllDevices():
        data.append(print_dev_to_json_format(dev))

    return json.dumps(data)
    
def print_disks():
    # list devices
    disks = [ parted.disk.Disk(dev) for dev in parted.getAllDevices() ]
    for disk in disks:
        print_disk_helper(disk)

def msdos_validate_type(ty, disk):
    if (ty == parted.PARTITION_NORMAL or ty & parted.PARTITION_EXTENDED) \
        and disk.primaryPartitionCount == 4:
        raise Exception, "Too many primary partitions."

    if ty & parted.PARTITION_EXTENDED and disk.getExtendedPartition():
        raise Exception, "Too many extended partitions."

    if ty & parted.PARTITION_LOGICAL and disk.getExtendedPartition() == None:
        raise Exception, "create extended partition first"

def adjust_geometry(disk,ty,new_geometry):
    new_geo = None

    if not (ty & parted.PARTITION_LOGICAL):
        for geo in disk.getFreeSpaceRegions():
            if disk.type == 'msdos' and disk.getExtendedPartition() \
                    and disk.getExtendedPartition().geometry.contains(geo):
                continue

            if geo.overlapsWith(new_geometry):
                new_geo = geo.intersect(new_geometry)
                break

    elif disk.type == 'msdos' and (ty & parted.PARTITION_LOGICAL):
        tmp = disk.getExtendedPartition().geometry
        for geo in disk.getFreeSpaceRegions():
            if tmp.contains(geo) and geo.overlapsWith(new_geometry):
                new_geo = geo.intersect(new_geometry)
                break

    if new_geo == None:
        raise Exception, "Can't have overlapping partitions."

    return new_geo

def print_disk(args, dev ,disk):
    print_disk_helper(disk)
    return None

def mkpart(args, dev, disk):
    cons = dev.getConstraint()
    ty = parted.PARTITION_NORMAL
    if disk.type == 'msdos':
        ty = partty_map[args[0]]
        del args[0]
        try:
            msdos_validate_type(ty, disk)
        except Exception, e:
            raise Exception, e
        
    fs = None
    start = parted.sizeToSectors(int(args[0]), "MiB", 512)
    end = parted.sizeToSectors(int(args[1]), "MiB", 512)

    new_geometry = parted.geometry.Geometry(dev,start,None,end)
    try:
        new_geo = adjust_geometry(disk,ty,new_geometry)
    except Exception, e:
        raise Exception, e

    if not (ty & parted.PARTITION_EXTENDED):
        fstype = args[2]
        fs = parted.filesystem.FileSystem(fstype,new_geo)
        
    new_partition = parted.partition.Partition(disk,ty,fs,new_geo)
    disk.addPartition(new_partition, cons)

    return disk

def rmpart(args, dev, disk):
    parts = disk.partitions
    n = 0
    for p in parts:
        if p.number == int(args[0]):
            break;
        n = n + 1

    if n == len(parts):
        raise Exception, "there is no such partition"

    part = parts[n]
    if disk.type == 'msdos' and part.type & parted.PARTITION_EXTENDED:
        for p in parts:
            if (p.type & parted.PARTITION_LOGICAL) and part.geometry.contains(p.geometry):
                disk.deletePartition(p)

    disk.deletePartition(part)
    return disk

def mklabel(args, dev, disk):
    return parted.freshDisk(dev,str(args[0]))

_commands = {
        "print" : print_disk,
        "mkpart" : mkpart,
        "rm" : rmpart,
        "mklabel" : mklabel,
        }
def dispatch(cmd, args, dev, disk):
    """args:[part.type,fs,start,end]"""
    cands = [ cand for cand in _commands.keys() if cand.startswith(cmd) ]    
   # if len(cands) > 1:
   #     print "ambiguous cmd %s, possible ones %s " % (cmd, cands)
   #     sys.exit(1)

    new_disk = _commands[cands[0]](args, dev, disk)
    return new_disk


