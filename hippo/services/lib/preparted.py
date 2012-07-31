#!/usr/bin/env python
# simple partition tool lib with purpose on pyparted testing 

import parted  
import _pedmodule
import sys
import partedprint
import rfparted

_commands = {
        "mkpart" : premkpart,
        "rm" : prermpart,
        "mklabel" : premklabel,
        "reset": prereset,
}

partty_map = {
    'primary': parted.PARTITION_NORMAL,
    'extended': parted.PARTITION_EXTENDED,
    'free': parted.PARTITION_FREESPACE,
    'logical': parted.PARTITION_LOGICAL
}

def premkpart(args, dev, disk):
    """Given args, device and disk needed to make parted. The format 
    of args: args = [part.type, start, end, filesystem.type]. Raise
    Exception given wrong args."""

    parttype = primary
    fstype = None
    if disk.type == 'msdos':
        parttype = args[0]
        del args[0]

    start = parted.sizeToSectors(int(args[0]), "MiB", 512)
    end = parted.sizeToSectors(int(args[1]), "MiB", 512)

    if not (parttype == "extended"):
        fstype = args[2]

    disk = rfparted.mkpart(dev, disk, parttype, start, end, fstype)
    return disk

def prermpart(args, dev, disk):
    """Given args, device and disk needed to remove part specified. 
    The format of args: args = [partition.number]. Raise Exception 
    given wrong args or a valid parttiton.number."""

    disk = rfparted.rmpart(disk, args[0])
    return disk

def premklabel(args, dev, disk):
    """Given args, device and disk needed to remove part specified.
    The format of args: args = [disk.type]. Raise Exception given 
    wrong args or a valid disk.type."""

    disk = rfparted.mklabel(dev, args[0])
    return disk

def prereset(dev,disk):

    disk = rfparted.reset(dev)
    return disk

def dispatch(cmd, args, dev, disk):
    """Return the new disk arrording the given data."""
    cands = [ cand for cand in _commands.keys() if cand.startswith(cmd) ]    
   # if len(cands) > 1:
   #     print "ambiguous cmd %s, possible ones %s " % (cmd, cands)
   #     sys.exit(1)

    new_disk = _commands[cands[0]](args, dev, disk)
    return new_disk

