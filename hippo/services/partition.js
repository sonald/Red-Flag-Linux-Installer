var _ = require('underscore');

module.exports = (function() {
    'use strict';

    //TODO: stub is adapter bridging alien partitioning service
    var PartitionStub = {};

    PartitionStub.mkpart = function(devpath, cb) {
        cb("pending")
    };

    var _stubDisks = [
        {
        "model": "ATA HITACHI HTS72321 (scsi)",
        "path": "/dev/sda",
        "size": "160GB",
        "type": "msdos",
        "table": [
            [ 1, "32.3kB", "32.2GB", "32.2GB", "primary", "ext4" ],
            [ 2, "96.7GB", "160GB", "63.4GB", "extended", "" ],
            [ 5, "96.7GB", "129GB", "32.2GB", "logical", "ext4" ],
        ]
    },
    {
        "model": "SSK SFD201 (scsi)",
        "path": "/dev/sdb",
        "size": "15GB",
        "type": "gpt",
        "table": [
            [ 1, "32.3kB", "32.2GB", "32.2GB", "part1", "ext4" ],
            [ 2, "96.7GB", "160GB", "63.4GB", "part2", "" ],
            [ 3, "96.7GB", "129GB", "32.2GB", "part3", "ntfs" ],
        ]
    },
    ];

    PartitionStub.getPartitions = function(devpath, cb) {
        var disk = _stubDisks.filter(function(disk) {
            return disk['path'] === devpath;
        });
        disk = disk && disk.length && disk[0] || null;

        if (!disk) {
            cb('invalid disk');
        } else {
            cb(disk);
        }
    };

    return PartitionStub;
}());
