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

        var result = function (res) {
            $('#result').text(res);
        };

        var val1, val2;

        var stubs = {
            add: [remote, 'services.demo.add', val1, val2, result],
            minus:[remote, 'services.demo.minus', val1, val2, result],
            mul:[remote, 'services.demo.mul', val1, val2, result],
            div:[remote, 'services.demo.div', val1, val2, result],
        };

        $('body').on('click', 'a.btn', function() {
            var method = $(this).attr("id");
            val1 = $('input[name=val1]').attr("value");
            val2 = $('input[name=val2]').attr("value");
            console.log(method);
            fire.apply(null, stubs[method]);
        });
    });
});
