$(function() {
    var stubs;

    DNode.connect(function (remote) {
        // when DNode is reconnected, remote is assigned.
        window.remote = remote;
        stubs = {
            add: [remote, 'services.demo.add'],
            minus:[remote, 'services.demo.minus'],
            mul:[remote, 'services.demo.mul'],
            div:[remote, 'services.demo.div'],
            model:[remote, 'services.demo.model'],
            squ:[remote, 'services.demo.squ'],
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


    var tmp = true;
    var numberstack = [];
    var methodstack = [];
    var nice = {
        "add" : 1,
        "minus" : 1,
        "mul" : 2,
        "div" : 2,
        "model" : 2,
        "equal" : 0,
    };
    var result = function (res) {
        $('.input-xlarge').text(res);
        numberstack.push(Number(res));
        if (methodstack[methodstack.length-1] === "squ") {
            numberstack.pop();
            methodstack.pop();
        }
        if(methodstack.length === 2){
            handler(numberstack,methodstack);
        };
        if(methodstack.length === 1 && methodstack[0] === "equal"){
            methodstack = [];
            numberstack = [];
        }
    };

    var handler = function(numberstack, methodstack){
        var method, val1, val2;
        if(methodstack.length === 2){
            if(nice[methodstack[0]] >= nice[methodstack[1]]){
                method = methodstack.shift();
                val2 = numberstack.pop();
                val1 = numberstack.pop();
                fire.apply(null, stubs[method].concat([val1, val2, result]));
            };
        }else if(methodstack.length === 3 ){
            method = methodstack[1];
            val2 = numberstack.pop();
            val1 = numberstack.pop();
            methodstack.splice(1,1);
            fire.apply(null, stubs[method].concat([val1, val2, result]));
        };
    }

    $('body').on('click', 'a.btn', function() {
        if (!stubs) return;

        if(tmp === false){
            methodstack = [];
            numberstack = [];
            $('.input-xlarge').text("error");
        };
        var method = $(this).attr("id");

        if (method === "squ") {
            methodstack.push(method);
            var val = Number($('.input-xlarge').text());
            fire.apply(null, stubs[method].concat([val, result]));
        }
        else {
            methodstack.push(method);
            numberstack.push( Number($('.input-xlarge').text()) );
            handler(numberstack,methodstack);
            tmp = false;
        }
    });

    $('body').on('click', 'input.btn', function() {
        var num = $(this).attr("value");
        if(num === " = "){
            if(tmp === false){
                $('.input-xlarge').text('0');
            }else{
                tmp = false;
                numberstack.push( Number($('.input-xlarge').text()) );
                methodstack.push("equal");
                handler(numberstack,methodstack);
            }
        }else{
            num = Number(num);
            if( tmp === true ){
                $('.input-xlarge').text($('.input-xlarge').text()+num);
            }else{
                $('.input-xlarge').text(num);
                tmp = true;
            };
        };
    });
});
