#!/usr/bin/env bash 
# tar  --numeric-owner --one-file-system -C src_dir -cSf /root/fifo1 ./
# | dd if=fifo1 of=fifo2 bs=1048576 
# | tar --numeric-owner -C dest_dir -xSf /root/fifo1
# 
# Usage: $0 src_dir dest_dev

echo 'fake installing process'
sleep 10
exit 0

if [[ $# -ne 2 ]]; then 
    echo "Usage: $0 src_dev dest_dev"
    exit 1
fi

if [ $UID -ne 0 ]; then
    exit 1
fi

function check_result() {
    if [ $? -ne 0 ]; then
        exit 1
    fi
}

dest_dir=`mktemp -d`

src_dir=$1
dest_dev=$2
if [ ! -b "$dest_dev" ]; then
    exit 1
fi

#parted /dev/sd* mkfs [num] ext3
mkfs.ext3 -q $dest_dev
check_result

mount -t ext3 $dest_dev $dest_dir
check_result

fifo1=/tmp/cbs_fifo1
fifo2=/tmp/cbs_fifo2

[ -e $fifo1 ] && unlink $fifo1
[ -e $fifo2 ] && unlink $fifo2
mkfifo $fifo1
mkfifo $fifo2
check_result


tar --numeric-owner --one-file-system -C $src_dir -cSf $fifo1 ./ | dd if=$fifo1 of=$fifo2 bs=1048576 | tar --numeric-owner -C $dest_dir -xSf $fifo2 ./

#cp -p -r /dev/* $dest_dir/dev/

sync
check_result

# if we pass copying, the rest is trivial, so we mark installation as success
done=0

unlink $fifo1
unlink $fifo2

umount $dest_dir
rmdir $dest_dir

exit $done



