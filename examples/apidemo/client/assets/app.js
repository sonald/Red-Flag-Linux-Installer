$(function() {
    var stubs;

    DNode.connect(function (remote) {
        window.remote = remote;
        stubs = {
            mkpart: [remote, "services.partition.mkpart", present],
            getPartitions: [remote, 'services.partition.getPartitions', '/dev/sda', presentList],
            mul: [remote, 'services.base.mul', 5, 12, present],
            plus: [remote, 'services.base.plus', 5, 12, present, 4, 5],
            expose: [remote, 'expose', present],
            getEnv: [remote, 'services.info.getEnv', presentList],
            listUsers: [remote, 'services.admin.user.listUsers', presentList],
            rmpart:[remote, 'services.partition.rmpart', '/dev/sda', 1 , presentList],
            reset:[remote, 'services.partition.reset', '/dev/sda', presentList],
            commitdisk:[remote, 'services.partition.commitdisk', process],
        };

    });

    function fire(remote, proto) {
        var func = _.reduce(proto.split('.'), function(memo, item) {
            if (typeof memo[item] === 'object')
                return memo[item];

            else if (typeof memo[item] === 'function') {
                return _.bind(memo[item], memo);

            } else
                throw { reason: 'memo[item] invalid' };

        }, remote);

        func.apply(null, Array.prototype.slice.call(arguments, 2));
    }

    var present = function (res) {
        if (Array.isArray(res)) {
            var inner = '<ul>';
            res.forEach(function(v) {
                inner += '<li>' + v + '</li>';
            });
            inner += '</ul>';
            $('#result').html(inner);

        } else {
            $('#result').text(res);
        }
    };

    var presentList = function (list) {
        if(typeof list === 'string'){
            $('#result').html(list); //fixme~~~
        }else{
            $('#result').html('<pre><code>'+ JSON.stringify(list) +'</code></pre>'); //fixme~~~
        };
    };

    var process = function(data) {
        var num = data*100/9;
        $('#process').attr("style", "width:" + num + "%;");
    };

    $('body').on('click', 'a.btn', function() {
        if (!stubs) return;

        var method = $(this).text();
        console.log(method);
        fire.apply(null, stubs[method]);
    });
});
