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
    };

    ws.onmessage = function(ev) {
        var pack = JSON.parse(ev.data);
        //console.log(pack);
        if (stage === "partitioning") {
            $('#stage').find('#progress > div').css('width', pack['progress']+'%');

        } else {
            $('#stage').html('<div class="well">' + ev.data + '</div>');
        }
    };

    // initial state
    stage = 'welcome';
    // stage transmission
    states = {
        'welcome': 'partitioning',
        'partitioning': 'unpacking'
    };

    $('#stage').on('click', 'a', function(ev) {
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
            stage = next;
            $('#stage').html( data );
        });
    });
});
