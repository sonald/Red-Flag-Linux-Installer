define(['jquery', 'system', 'i18n'], function($,_system,i18n){
    'use strict';
    var remote = null;
    function init () {
        remote = remote || window.apis.services.partition;
    };
    var partial = {
        getparts: function (data, reflash_parts) {
            remote.getPartitions(function (disks) {
                reflash_parts (data, disks);
            });
        },

        method: function (action, args, callback) {
            init();
            var func = remote[action];
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
            func.apply(null, args); 
        },
    };
    return partial;
});
