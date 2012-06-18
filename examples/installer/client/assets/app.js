require.config({
    baseUrl: 'js',
});

var app = {
    name: 'Pangu Installer',

};

require(['jquery', 'license'], function($) {
    console.log('load done!');

    DNode.connect(function (remote) {
        // when DNode is reconnected, remote is assigned.
        window.apis = remote;

        remote.expose(function(apis) {
            console.log(apis);
        });
    });
});

