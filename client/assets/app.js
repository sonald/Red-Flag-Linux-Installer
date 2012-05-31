$(function() {
    DNode.connect(function (remote) {
        function fire(remote, proto) {
            var func = _.reduce(proto.split('.'), function(memo, item) {
                console.log('memo: ', memo, 'item', item);
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
            $('#result').text(res);
        };

        var presentList = function (list) {
            $('#result').html('<pre><code>' + JSON.stringify(list) + '</code></pre>');
        };

        var stubs = {
            mkpart: [remote, "services.partition.mkpart", present],
            getPartitions: [remote, 'services.partition.getPartitions', '/dev/sda', presentList],
            mul: [remote, 'services.base.mul', 5, 12, present],
            expose: [remote, 'expose', present],
            getEnv: [remote, 'services.info.getEnv', presentList],
            listUsers: [remote, 'services.admin.user.listUsers', presentList],
        };

        $('body').on('click', 'a.btn', function() {
            var method = $(this).text();
            console.log(method);
            fire.apply(null, stubs[method]);
        });
    });
});
