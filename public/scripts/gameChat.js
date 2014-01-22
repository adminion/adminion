
var url = window.location.href.split('/');

var protocol = url[0];
var address = url[2];
var host = url[2].split(':')[0];
var port = url[2].split(':')[1];
var directory = url[3];
var gameId = url[4];

var socket = io.connect();

var connectedPlayers = {};

function chat_addToLog (handle, msg) {
    // get the existing message
    var existing = $('#chat_log')[0].value;

    // and set the value to the existing chat content plus the new message at the end
    $('#chat_log')[0].value = existing + '\n' + new Date() + ' [' + handle + ']: ' + msg;

    $('#chat_log')[0].scrollTop =    $('#chat_log')[0].scrollHeight;
    
};

function chat_send () {
    var msg = $('#chat_input')[0].value;
    socket.send(msg);
    $('#chat_input')[0].focus();
    $('#chat_input')[0].select();
};

function enable_chat () {
    $('#chat_input')[0].disabled = '';
    $('#chat_submit')[0].disabled = '';
};

function disable_chat () {
    $('#chat_input')[0].disabled = 'disabled';
    $('#chat_submit')[0].disabled = 'disabled';
};

function sysMsg (msg) {
    chat_addToLog('SYSTEM', msg);
};

$(document).ready(function documentReady () {

    $('.config').on('change', function (event) {
        console.log(event);
        var adjustments = {};

        adjustments[event.target.id] = event.target.value
        socket.emit('config', adjustments);
    });

    $('#chat_input').on('keyup', function (event) {
        if (event.keyCode === 13) {
            chat_send();
        }
    });

    $('#chat_submit').on('click', function (event) {
        chat_send();
    });

    socket.on('connecting', function () {
        sysMsg('connecting to server...');
    });

    socket.once('connect', function () {
        sysMsg('connected!');
        socket.emit('joinGame', gameId);
    });

    socket.on('disconnect', function () {
        sysMsg('connection to server lost!');
        console.log('disconnect from server - have we disconnected yet? i\'ll try to emit another event...');
        socket.emit('test', {foo:'bar'});

        disable_chat();
    });

    socket.on('reconnecting', function () {
        sysMsg('trying to reconnect...');
    });

    socket.on('reconnect', function () {
        sysMsg('reconnected!');
        enable_chat();
    });

    socket.on('entered', function (newPlayer, players) {
        sysMsg(newPlayer + ' joined the game!');

    });

    socket.on('exited', function (oldPlayer, players) {
        sysMsg(oldPlayer + ' left the game');

    });

    socket.on('roster', function (roster) {
        connectedPlayers = roster;
        console.log('connectedPlayers');
        console.log(connectedPlayers);

        $("#PlayersList").replaceWith(function () {
            var updatedPlayersList = '<div id="PlayersList"><table>';
            updatedPlayersList += '<tr><th>Player No.</th><th>Handle</th></tr>';

            for (var playerNo in roster) {

                updatedPlayersList += '<tr><td>' + (playerNo) + '</td><td>' + roster[playerNo] + '</td></tr>\n';
            };

            updatedPlayersList += '</table></div>';
            return updatedPlayersList;
        });
    });

    socket.on('joined', function (result, reason) {
        if (result) {
            console.log('joined!');
            enable_chat();
            $('#chat_input').focus();
        } else {
            console.log('denied: ' + reason);
            window.location = '/games/' + gameId;
        }
    });

    socket.on('config', function (adjustments) {
        console.log(adjustments);
        for (option in adjustments) {
            console.log('adjustments[' + option + ']');
            console.log(adjustments[option]);
            $('input#' + option)[0].value = adjustments[option];
        }
    });

    socket.on('msg', function (msg) {
        sysMsg(msg);
    });

    socket.on('chat', function (handle, msg) {
        chat_addToLog(handle, msg);
    });
});

