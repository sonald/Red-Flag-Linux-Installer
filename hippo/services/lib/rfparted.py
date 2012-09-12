#!/usr/bin/env python
# simple partition tool lib with purpose on pyparted testing 

import parted  
import _pedmodule
import sys
import partedprint

trans_from_mb = 2048 #1024*1024/512
partty_map = {
    'primary': parted.PARTITION_NORMAL,
    'extended': parted.PARTITION_EXTENDED,
    'free': parted.PARTITION_FREESPACE,
    'logical': parted.PARTITION_LOGICAL
}

flag_map = {
    'bios_grub': parted.PARTITION_BIOS_GRUB,
    'boot': parted.PARTITION_BOOT,
}

def msdos_validate_type(ty, disk):
    """Given the disk and the partiton type. Raise exception
    if a wrong partition type is given."""

    if (ty == parted.PARTITION_NORMAL or ty & parted.PARTITION_EXTENDED) \
        and disk.primaryPartitionCount == 4:
            raise Exception, "1@Too many primary partitions."

    if ty & parted.PARTITION_EXTENDED and disk.getExtendedPartition():
        raise Exception, "2@Too many extended partitions."

    if ty & parted.PARTITION_LOGICAL and disk.getExtendedPartition() == None:
        raise Exception, "Create extended partition first."

def adjust_geometry(disk,ty,new_geometry):
    """Given the disk,partiton type and the geomery,return the suitable
    geometry for the disk condition.Raise Exception if a valid geometry
    is given."""

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

def mkpart(dev, disk, parttype, start, end, fstype):
    parttype = partty_map[parttype]
    if disk.type == 'msdos':
        msdos_validate_type(parttype, disk)
        
    new_geometry = parted.geometry.Geometry(dev, start, None, end)
    new_geo = adjust_geometry(disk,parttype,new_geometry)

    fs = None
    if not (parttype & parted.PARTITION_EXTENDED) and fstype != "bios_grub":
        fs = parted.filesystem.FileSystem(fstype,new_geo)
        
    new_part = parted.partition.Partition(disk,parttype,fs,new_geo)
    if fstype == "bios_grub":
        new_part.setFlag(parted.PARTITION_BIOS_GRUB)
    cons = dev.getConstraint()
    disk.addPartition(new_part, cons)
    return disk

def rmpart(disk, number):
    parts = disk.partitions
    n = 0
    for p in parts:
        if p.number == int(number):
            break;
        n = n + 1

    if n == len(parts):
        raise Exception, "Error arguments, no partition specified."

    part = parts[n]
    if disk.type == 'msdos' and part.type & parted.PARTITION_EXTENDED:
        for p in parts:
            if (p.type & parted.PARTITION_LOGICAL) and part.geometry.contains(p.geometry):
                disk.deletePartition(p)

    disk.deletePartition(part)
    return disk

def setFlag(disk, number, name, status):
    parts = disk.partitions
    n = 0
    for p in parts:
        if p.number == int(number):
            break;
        n = n + 1
    if n == len(parts):
        raise Exception, "Error arguments, no partition specified."

    part = parts[n]
    flagname = flag_map[name]
    if status == True:
        part.setFlag(flagname)
    else:
        part.unsetFlag(flagname)
    return disk

def mklabel(dev, disktype):
    return parted.freshDisk(dev,str(disktype))

def reset(dev):
    """
    """
    try:
        disk = parted.disk.Disk(dev)
    except:
        disk = None
    return disk

