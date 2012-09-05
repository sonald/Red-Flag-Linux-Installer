#!/usr/bin/env python
# simple partition tool lib with purpose on pyparted testing 

import parted  
import _pedmodule
import sys
import rfparted

trans_from_mb = 2048 #1024*1024/512
partty_map = {
    'primary': parted.PARTITION_NORMAL,
    'extended': parted.PARTITION_EXTENDED,
    'free': parted.PARTITION_FREESPACE,
    'logical': parted.PARTITION_LOGICAL
}

def fdhandler(dev,mem):
    sizeL = dev.getLength()
    size = dev.getSize('GB')
    disk = parted.disk.Disk(dev)
    parttype = "primary"
    disk.deleteAllPartitions()
    start = parted.sizeToSectors(0, "GB", 512)
    if disk.type == "gpt":
        end = parted.sizeToSectors(1,'MB',512)
        disk = rfparted.mkpart(dev, disk, parttype, start, end, 'bios_grub')
        start = end + 10

    if size > 10:
        end = parted.sizeToSectors(mem,'B',512)
        disk = rfparted.mkpart(dev, disk, parttype, start, end, 'linux-swap(v1)')
        start = end + 100
        if size > 30:
            end = parted.sizeToSectors(30, "GB", 512)
            disk = rfparted.mkpart(dev, disk, parttype, start, end, "ext4")
            start = end + 100;
        end = sizeL - 100
        disk = rfparted.mkpart(dev, disk, parttype, start, end, "ext4")
    elif size >= 6:
        end = sizeL - 100
        disk = rfparted.mkpart(dev, disk, parttype, start, end, "ext4")
    else:
        raise Exception, "Error, select a disk of at least 6 GB ."
    return disk

def gpt_easyhandler(dev, disk, start, end, number):
    fs = "ext4"
    bios_grub = False
    for p in disk.partitions:
        if p.number !== number and p.getFlag(parted.PARTITION_BIOS_GRUB):
            bios_grub = True
            break
    if bios_grub and number > 0:
        return [disk, number]

    if bios_grub == False:
        if number > 0:
            disk = rfparted.rmpart(disk, number)
        tmp_end = parted.sizeToSectors(1, "MB", 512)
        partnumber = [ part.number for part in disk.partitions ]
        disk = rfparted.mkpart(dev, disk, "primary", start, tmp_end, 'bios_grub')
        start = tmp_end + 100

    partnumber = [ part.number for part in disk.partitions ]
    disk = rfparted.mkpart(dev, disk, "primary", start, end, fs)
    number = 0
    for p in disk.partitions:
        if p.number in partnumber:
            continue
        number = p.number
        break;

    return [disk, number]

def msdos_easyhandler(dev, disk, parttype, start, end):
    fs = "ext4"
    start = parted.sizeToSectors(float(start), "GB", 512)
    end = parted.sizeToSectors(float(end), "GB", 512)
    if parttype == "free":
        if disk.primaryPartitionCount == 4:
            raise Exception, "Too many primary partitions."
        elif disk.primaryPartitionCount == 3 and disk.getExtendedPartition() is None:
            disk = rfparted.mkpart(dev, disk, "extended", start, end, fs)
            parttype = "logical"
        elif disk.primaryPartitionCount < 4:
            parttype = "primary"
        ###elif parttype == "logical"
        ### nothing changed
    partnumber = [ part.number for part in disk.partitions ]
    disk = rfparted.mkpart(dev, disk, parttype, start, end, fs)
    number = 0
    for p in disk.partitions:
        if p.number in partnumber:
            continue
        number = p.number
        break;
    return [disk, number]

def easyhandler(dev, disk, parttype, start, end, number):
    if disk.type == "msdos":
        return msdos_easyhandler(dev, disk, parttype, start, end)
    elif disk.type == "gpt":
        return gpt_easyhandler(dev, disk, start, end, number)

def test(str, list):
    result = True
    for x in list:
        if str.startswith(x):
            result = False
            break
    return result;

def DevDisk():
    disks = {}
    disks_tag = {}
    blacklist = ["mapper", "sr"]
    for dev in parted.getAllDevices():
        if test(dev.path.split('/')[2], blacklist) is False:
            continue
        disks_tag[dev.path] = False
        try:
            disks[dev.path] = parted.disk.Disk(dev)
        except:
            if dev.getSize('TB') >= 2:
                disks[dev.path] = parted.freshDisk(dev,'gpt')
            else:
                disks[dev.path] = parted.freshDisk(dev,'msdos')
            continue
    return [disks, disks_tag]

