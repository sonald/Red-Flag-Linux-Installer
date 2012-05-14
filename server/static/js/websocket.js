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
        ws.send("welcome");
    };

    ws.onmessage = function(ev) {
        console.log(ev);
        var pack = JSON.parse(ev.data);
        $('#stage').html('<div class="well">' + ev.data + '</div>');
        switch(ev.data) {
            case 'progress':
        }
    };

    $('body').on('click', '#install', function() {
        console.log('fire install');
        $.post("/hippo", 
               { version: 'sony', client: 'webkit' },
               function(data, status) {
                   console.log('fire status: ' + status);
               });
    });
});
