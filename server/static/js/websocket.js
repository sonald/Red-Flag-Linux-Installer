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
        log = document.getElementById('log');
        log.innerHTML = ev.data;
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
