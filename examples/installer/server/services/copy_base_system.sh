#!/usr/bin/env bash
# tar  --numeric-owner --one-file-system -C src_dir -cSf /root/fifo1 ./
# | dd if=fifo1 of=fifo2 bs=1048576
# | tar --numeric-owner -C dest_dir -xSf /root/fifo1
#
# Usage: $0 src_dir dest_dir
# precondition: dest_dir is for mounted dest dev

exec &>/tmp/copy_base_system.log

function handle_exit() {
    unlink $fifo1
    unlink $fifo2
    echo 'clean up fifo'
    exit
}

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

src_dir=$1
dest_dir=$2

fifo1=/tmp/cbs_fifo1
fifo2=/tmp/cbs_fifo2

[ -e $fifo1 ] && unlink $fifo1
[ -e $fifo2 ] && unlink $fifo2
mkfifo $fifo1
mkfifo $fifo2
check_result

trap handle_exit SIGHUP SIGTERM SIGINT
echo "star copying"

tar --numeric-owner --one-file-system -C $src_dir -cSf $fifo1 ./ | dd if=$fifo1 of=$fifo2 bs=1048576 | tar --numeric-owner -C $dest_dir -xSf $fifo2 ./

sync
check_result
echo "copying finished"

handle_exit
