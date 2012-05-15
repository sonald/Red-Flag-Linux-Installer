/*
 * =====================================================================================
 *
 *       Filename:  websocket.js
 *
 *    Description:  ws service
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
    var ws = new WebSocket("ws://localhost:8080/ws");
    ws.onopen = function() {
        //ws.send(JSON.stringify({
            //cmd: 'connect', 
            //stage: window.serviceName
        //}));
    };

    ws.onmessage = function(ev) {
        console.log(ev);
        var pack = JSON.parse(ev.data);
        $('#stage').html('<div class="well">' + ev.data + '</div>');
    };

    stage = 'welcome';
    // stage transmission
    states = {
        'welcome': 'partitioning',
        'partitioning': 'unpacking'
    };

    $('#stage').on('click', 'a', function(ev) {
        console.log($(this));
        console.log($(this).text());
        if ($(this).text() === 'Commit') {
            console.log('post commit');
            $.post("/service/partitioning?cmd=partition", {}, function() {
                console.log('partition done');
            });
        }
    });

    $('body').on('click', '#previous', function() {
    });

    $('body').on('click', '#next', function() {
        var next = states[stage];
        console.log('fire ' + next);
        $.get("/service/" + next + "?cmd=view", function(data) {
            $('#stage').html( data );
        });
    });
});
