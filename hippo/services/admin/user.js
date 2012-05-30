module.exports = (function() {
    'use strict';

    //TODO: UserStub need to be implemented
    var UserStub = {};

    var _stubUsers = [
        {
        "name": "sonald",
        "home": "/home/sonald"
    },
    {
        "name": "ssw",
        "home": "/home/ssw"
    }
    ];

    UserStub.listUsers = function(cb) {
        cb(_stubUsers);
    };

    return UserStub;
}());
