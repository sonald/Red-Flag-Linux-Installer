/*
 * =====================================================================================
 *
 *       Filename:  hippo.js
 *
 *    Description:  Hippo client
 *
 *        Version:  1.0
 *        Created:  2012年05月10日 16时08分43秒
 *
 *         Author:  Sian Cao
 *        Company:  Red Flag Linux
 *
 * =====================================================================================
*/ 
$(function() {
    console.log('on ready');
    var ws = new io.connect("http://" + location.host);

    function registerServiceSocket(service) {
        sock = new io.connect("http://" + location.host + "/" + service.name),
        sock.on('disconnect', $.proxy(service.ondisconnect, service));
        sock.on('message', $.proxy(service.onmessage, service));
        service.io = sock;
    }

    //TODO: service view may need to delay loading until first display
    //because it may need load some data (e.g partition table)
    function loadServiceView(service) {
        var dfd = new $.Deferred();
        $.get("/service/" + service.name + "?cmd=view")
        .then(
            function(data) { 
                console.log('view: ', data.slice(1, 20)); 
                service.$el = $(data);
                service['onviewload'] && service.onviewload();
                dfd.resolve();
            },
            function() { console.log('get ' + service.name + ' view failed'); }
        );
        return dfd.promise();
    }

    function loadService(service) {
        registerServiceSocket(service); 
        return loadServiceView(service);
    }

    //Hippo stuff

    //these objects are kind of backbone Models and Views
    var partService = {
        name: "partitioning", 
        $el: null, // cached view
        $target: $('#stage'),
        onmessage: function(msg) {
            console.log(this);
            var pack = JSON.parse(msg);
            this.$el.find('#progress > div').css('width', pack['progress']+'%');
        }, 
        ondisconnect: function() {
            console.log(this.name + ' disconncted');
        },
        onviewload: function() {
            this.$target.on('click', 'a', function(ev) {
                if ($(this).text() === 'Commit') {
                    console.log('post commit');
                    $.post("/service/partitioning?cmd=partition", {}, function() {
                        console.log('partition done');
                    });
                }
            });
        },

    };

    var unpackService = {
        name: "unpacking",
        $el: null, 
        $target: $('#stage'),
        onmessage: function(msg) {
            $el.html('<div class="well">' + msg + '</div>');
        },
        ondisconnect: function() {
            console.log(this.name + ' disconncted');
        },
    };

    var services = {
        'partitioning': partService,
        'unpacking': unpackService,
    };

    $.when( Object.getOwnPropertyNames(services).map( function(srv) {
        return loadService(services[srv]);
    }) )
    .done(function() { setupStage(); })
    .fail(function() { console.log('load service failed'); });

    function setupStage() {
        // initial state
        var stage = 0;
        // stage transmission
        var stages = ['welcome', 'partitioning', 'unpacking', 'finish'];

        $('body').on('click', '#previous', function() {
            if (stage === 0) {
                console.log('no prev stage');
                return;
            }

            var prev = --stage;
            console.log('fire ' + stages[prev]);
            $('#stage').html( services[stages[prev]].$el );
            stage = prev;
        });

        $('body').on('click', '#next', function() {
            if (stage === stages.length-1) {
                console.log('no next stage');
                return;
            }

            var next = ++stage;
            console.log('fire ' + stages[next]);
            $('#stage').html( services[stages[next]].$el );
            stage = next;
        });
    }
});
