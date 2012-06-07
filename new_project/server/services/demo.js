module.exports = (function(){
    'use strict';

    var CalStub = {};
    CalSub.add = function(val1, val2 ,cb){
        cb(val1 + val2);
    };

    CalStub.minus = function(val1, val2, cb){
        cb(val1 - val2);
    };

    CalStub.mul = function(val1, val2, cb){
        cb(val1 * val2);
    };

    CalStub.div = function(val1, val2, cb){
        if(val2 === 0){
            cb("error");
        }else{
            cb(val1 / val2);
        };
    };
    return CalStub;

}());
