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

def find_swap(disks):
    has_swap = False
    for disk in disks.values():
        for p in disk.partitions:
            if p.fileSystem and p.fileSystem.type.find("swap") > -1:
                has_swap = True
                break
        if has_swap:
            break
    return has_swap

def fdhandler(dev,mem, disks, sysflag):
    DevEndSector = dev.getLength()##the last sector of the device
    Dsize = dev.getLength('GB')
    parttype = "primary"
    fs='ext4'
    number = 0 ##record the number of the part created
    boot_number = 0 ##record the number of boot part

    disk = disks[dev.path]
    disk.deleteAllPartitions()
    disks[dev.path] = disk

    start = parted.sizeToSectors(0, "GB", 512)
    end = 0
    if disk.type == "gpt":
        number = number + 1
        size = parted.sizeToSectors(1,'MB',512)
        disk = rfparted.mkpart(dev, disk, parttype, start, size, end, 'bios_grub')
        start = start + size + 1

    if sysflag == "sony":
        number = number + 1
        fs = 'ext3'
        size = parted.sizeToSectors(10, "GB", 512)
        disk = rfparted.mkpart(dev, disk, parttype, start, size , end, fs)
        start = start + size + 1

    if Dsize > 54:
        number = number +1
        boot_number = number
        size = parted.sizeToSectors(50, "GB", 512)
        disk = rfparted.mkpart(dev, disk, parttype, start, size, end, fs)
        rfparted.setFlag(disk, number, 'boot', True)
        start = start + size + 1
        number = number + 1
        size = parted.sizeToSectors(4, "GB", 512)
        disk = rfparted.mkpart(dev, disk, parttype, start, size, end, 'linux-swap(v1)')
    elif Dsize > 10:
        if find_swap(disks) is False:
            number = number + 1
            size = parted.sizeToSectors(mem,'B',512)
            disk = rfparted.mkpart(dev, disk, parttype, start, size, end, 'linux-swap(v1)')
            start = start + size  + 1
        if Dsize > 30:
            number = number + 1
            boot_number = number
            end = parted.sizeToSectors(30, "GB", 512) ##rootsize = 30 - swap
            disk = rfparted.mkpart(dev, disk, parttype, start, 0, end, fs)
            start = end + 1
        number = number + 1
        if boot_number == 0:
            boot_number = number
        end = DevEndSector
        disk = rfparted.mkpart(dev, disk, parttype, start, 0, end, fs)
    elif Dsize >= 6:
        number = number + 1
        boot_number = number 
        end = DevEndSector
        disk = rfparted.mkpart(dev, disk, parttype, start, 0, end, fs)
    else:
        raise Exception, "Error, select a disk of at least 6 GB ."
    return [disk, boot_number]

def gpt_easyhandler(dev, disk, start, end, number):
    fs = "ext4"
    bios_grub = False
    for p in disk.partitions:
        if p.number != number and p.getFlag(parted.PARTITION_BIOS_GRUB):
            bios_grub = True
            break
    if bios_grub and number > 0:
        return [disk, number]

    if bios_grub == False:
        if number > 0:
            disk = rfparted.rmpart(disk, number)
        size = parted.sizeToSectors(1, "MB", 512)
        disk = rfparted.mkpart(dev, disk, "primary", start, size, end, 'bios_grub')
        start = start + size + 1

    partnumber = [ part.number for part in disk.partitions ]
    disk = rfparted.mkpart(dev, disk, "primary", start, 0, end, fs)
    number = 0
    for p in disk.partitions:
        if p.number in partnumber:
            continue
        number = p.number
        break;

    return [disk, number]

def msdos_easyhandler(dev, disk, parttype, start, end):
    # in this function, parttype must be free
    fs = "ext4"
    if disk.primaryPartitionCount == 4:
        raise Exception, "Too many primary partitions."
    elif disk.primaryPartitionCount == 3 and disk.getExtendedPartition() is None:
        disk = rfparted.mkpart(dev, disk, "extended", start, 0, end, fs)
        parttype = "logical"
    elif disk.primaryPartitionCount < 4:
        parttype = "primary"
    ###elif parttype == "logical"
    ### nothing changed
    partnumber = [ part.number for part in disk.partitions ]
    disk = rfparted.mkpart(dev, disk, parttype, start, 0, end, fs)
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
    blacklist = ["mapper", "sr"] ##the device type not supported
    for dev in parted.getAllDevices():
        if test(dev.path.split('/')[2], blacklist) is False:
            continue
        disks_tag[dev.path] = False
        try:
            disks[dev.path] = parted.disk.Disk(dev)
        except:
            if dev.getSize('TB') >= 2:##larger than 2TiB
                disks[dev.path] = parted.freshDisk(dev,'gpt')
            else:
                disks[dev.path] = parted.freshDisk(dev,'msdos')
            continue
    return [disks, disks_tag]

