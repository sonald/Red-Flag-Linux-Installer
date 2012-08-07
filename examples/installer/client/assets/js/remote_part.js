define(['jquery', 'system', 'i18n'], function($,_system,i18n){
    'use strict';
    var remote = null;
    function init () {
        remote = window.apis.services.partition;
    };
    var partial = {
        getparts: function (data, reflash_parts) {
            remote.getPartitions(function (disks) {
                reflash_parts (data, disks);
            });
        },

        method: function (args, callback) {
            init();
            var func = remote[args[0]];
            var that = this;
            var test = function (result) {
                if (result.status && result.status === "success") {
                    that.getparts(result, callback);
                }else {
                    alert(i18n.gettext('System Error!'));
                    console.log(result);
                }
            };
            args.push(test);
            func.apply(null, Array.prototype.slice.call(args, 1)); 
        },
    };
    return partial;
});
