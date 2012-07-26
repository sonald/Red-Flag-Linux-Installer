/*
 * =====================================================================================
 *
 *       Filename:  phantomtest.js
 *
 *    Description:  test backend by using phantomjs
 *
 *        Version:  1.0
 *        Created:  2012年07月20日 17时07分14秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (sonald), yinshuiboy@gmail.com
 *        Company:  Red Flag Linux Co. Ltd
 *
 * =====================================================================================
*/


var sys = require('system');
var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
    console.log('[page]: ', inspect(msg));
};

function inspect(obj) {
    if (!obj || typeof obj != 'object') {
	return obj;
    }
    
    if (typeof obj === 'function') {
	return 'function';
    }

    var res = '';
    if (obj instanceof Array) {
	res += '[';
	for (var i = 0; i < obj.length; i++) {
	    res += inspect(obj[i]) + ', ';
	}
	res += ']';

    } else {
	res = '{ ';
	Object.keys(obj).forEach(function(prop) {
	    res += '  ' + prop + ': "' + inspect(obj[prop]) + '", ';
	});
	res += ' }';
    }
    
    return res;
}

function debug(obj) {
    console.log( inspect(obj) );
}

page.open("http://127.0.0.1:8080", function(status) {
    if (!status) {
	console.log('load failed');
	phantom.exit(1);
    }

    console.log('load phantom');
    setTimeout(function() {
	var apis = page.evaluate(function() {
	    console.log(JSON.stringify(window.apis));
	    return window.apis;
	});

	page.evaluateAsync(function() {
	    apis.services.install.minimalSufficient(function(res) {
		console.log('minimalSufficient: ', JSON.stringify(res));
	    });
	});

	page.evaluateAsync(function() {
	    apis.services.install.meminfo(function(res) {
		console.log('meminfo: ', JSON.stringify(res));
	    });
	});

	var adv_opts = {
            "grubinstall": "/dev/sdb",
            "installmode": "advanced",
            "username": "pangu_test2",
	    "hostname": 'pangu_test2-qomo',
	    "timezone": 'Asia/Shanghai',
	    "keyboard": 'en',
            "disks": [
                {
                    "table": [
                        {
			    "fs": "linux-swap(v1)",
			    "end": 1.003483648,
			    "ty": "primary",
			    "number": 1,
			    "start": 0.000032256,
			    "size": 1.003451392,
			    "dirty": true
                        },
                        {
			    "fs": "ext4",
			    "end": 8.003196928,
			    "ty": "primary",
			    "number": 2,
			    "start": 1.01170944,
			    "size": 6.991487488,
			    "dirty": true,
			    "mountpoint": "/"
                        },
                        {
			    "fs": "ext4",
			    "end": 8.587191808,
			    "ty": "free",
			    "number": 3,
			    "start": 8.00319744,
			    "size": 0.5839943680000008,
			    "dirty": true,
			    "mountpoint": "/opt"
                        }
                    ],
                    "path": "/dev/sdb",
                    "model": "ATA QEMU HARDDISK",
                    "type": "msdos",
                    "unit": "GB",
                    "size": 8.589934592
                },
                {
                    "table": [
                        {
			    "fs": "ext4",
			    "end": 8.388607488,
			    "ty": "primary",
			    "number": 1,
			    "start": 0.000032256,
			    "size": 8.388575231999999
                        }
                    ],
                    "path": "/dev/sda",
                    "model": "ATA QEMU HARDDISK",
                    "type": "msdos",
                    "unit": "GB",
                    "size": 8.388608
                }
            ]
        };

	var fulldisk_opts = {
            "grubinstall": "/dev/sdb",
            "installmode": "fulldisk",
            "username": "pangu_test",
	    "hostname": 'pangu_test-qomo',
	    "timezone": 'Asia/Shanghai',
	    "keyboard": 'en',
            "disks": [
                {
                    "table": [
                        {
			    "fs": "linux-swap(v1)",
			    "end": 1.003483648,
			    "ty": "primary",
			    "number": 1,
			    "start": 0.000032256,
			    "size": 1.003451392,
			    "dirty": true
                        },
                        {
			    "fs": "ext4",
			    "end": 8.003196928,
			    "ty": "primary",
			    "number": 2,
			    "start": 1.01170944,
			    "size": 6.991487488,
			    "dirty": true,
			    "mountpoint": "/"
                        },
                        {
			    "fs": "",
			    "end": 8.587191808,
			    "ty": "free",
			    "number": -1,
			    "start": 8.00319744,
			    "size": 0.5839943680000008
                        }
                    ],
                    "path": "/dev/sdb",
                    "model": "ATA QEMU HARDDISK",
                    "type": "msdos",
                    "unit": "GB",
                    "size": 8.589934592
                },
                {
                    "table": [
                        {
			    "fs": "ext4",
			    "end": 8.388607488,
			    "ty": "primary",
			    "number": 1,
			    "start": 0.000032256,
			    "size": 8.388575231999999
                        }
                    ],
                    "path": "/dev/sda",
                    "model": "ATA QEMU HARDDISK",
                    "type": "msdos",
                    "unit": "GB",
                    "size": 8.388608
                }
            ]
        };

	// full disk installation scheme
	var opts = null;	
	if (sys.args.indexOf('-adv') != -1) {
	    opts = adv_opts;
	    
	} else if (sys.args.indexOf('-easy') != -1) {
	    opts = fulldisk_opts;
	    opts.disks[0].table[0].dirty = false; // simulate existed swap fs
	    
	} else if (sys.args.indexOf('-fulldisk') != -1) {
	    opts = fulldisk_opts;
	    
	} else {
	    phantom.exit(0);
	}
	
	page.evaluateAsync(function(opts) {
	    apis.services.install.packAndUnpack(opts, function(status) {
		console.log('[INSTALL]: ', JSON.stringify(status));
	    });
	});

    }, 1800);

});