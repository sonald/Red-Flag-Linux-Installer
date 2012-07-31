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

    if size > 10:
        start = parted.sizeToSectors(0, "GB", 512)
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
        start = parted.sizeToSectors(0, "GB", 512)
        end = sizeL - 100
        disk = rfparted.mkpart(dev, disk, parttype, start, end, "ext4")
    else:
        raise Exception, "error"
    return disk

def easy_handler(self, dev, disk, parttype, start, end):
    start = parted.sizeToSectors(float(start), "GB", 512)
    end = parted.sizeToSectors(float(end), "GB", 512)
    if parttype == "free":
        if disk.primaryPartitionCount() == 4:
            raise Exception, "Error"
        elif disk.primaryPartitionCount() == 3 and disk.getExtendedPartition() is None:
            disk = rfparted.mkpart(dev, disk, "extended", start, end, fs)
            parttype = "logical"
        elif disk.primaryPartitionCount() < 4:
            parttype = "primary"
    disk = rfparted.mkpart(dev, disk, "primary", start, end, fs)
    return disk



