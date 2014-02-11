
var url = window.location.href.split('/'),
    protocol = url[0],
    address = url[2],
    host = url[2].split(':')[0],
    port = url[2].split(':')[1],
    directory = url[3],
    gameId = url[4],
    connectedPlayers = {},
    socket;

console.log(socket);

$(document).ready(function documentReady () {

    $('.config').on('change', function (event) {
        // console.log(event);

        console.log('me: %s -> %s', event.target.id, event.target.value);
        
        socket.emit('gameConfig', event.target.id, event.target.value);
    });

    $('#imReady').on('change', function (event) {
 
        var ready = event.target.checked;

        if (ready) {
            console.log("me: I'm Ready!");
        } else {
            console.log("me: I'm NOT Ready!");
        }
        
        socket.emit('ready', ready);
    });

    $('#startGame').on('click', function (event) {
        socket.emit('startGame', true);
    });

    $('#chat_input').on('keyup', function (event) {
        if (event.keyCode === 13) {
            chat_send();
        }
    });

    $('#chat_submit').on('click', function (event) {
        chat_send();
    });

    

    socket = io.connect();

    socket.on('connecting', onConnecting);

    socket.on('connect', onConnect);

    socket.on('disconnect', onDisconnect);

    socket.on('reconnecting', onReconnecting);

    socket.on('entered', onEntered);

    socket.on('exited', onExited);

    socket.on('roster', onRoster);

    socket.on('gameConfig', onGameConfig);

    socket.on('joinGame', onJoinGame);

    socket.on('config', onConfig);

    socket.on('msg', onMsg);

    socket.on('chat', onChat);

    socket.on('allReady', onAllReady);

    socket.on('starting', onStarting);

    socket.on('startGame', onStartGame);

});

function chat_addToLog (handle, msg) {
    // get the existing message
    var existing = $('#chat_log')[0].value;

    // and set the value to the existing chat content plus the new message at the end
    $('#chat_log')[0].value = existing + '\n' + new Date() + ' [' + handle + ']: ' + msg;

    $('#chat_log')[0].scrollTop =    $('#chat_log')[0].scrollHeight;
    
};

function chat_send () {
    var msg = $('#chat_input')[0].value;
    socket.emit('gameChat', msg);
    $('#chat_input')[0].focus();
    $('#chat_input')[0].select();
};

function enable_chat () {
    $('#chat_input').prop('disabled', false);
    $('#chat_submit').prop('disabled',false);
};

function disable_chat () {
    $('#chat_input').prop('disabled', true);
    $('#chat_submit').prop('disabled', true);
};

function gameUrl () {

    return protocol + '//' + address + '/' + directory + '/' + gameId
};

function onAllReady (value) {

    var msg = 'server: ';

    msg += value ? 'we are ready to start the game!' : 'we are not ready to start the game!';

    console.log(msg);

    $('#startGame').prop('disabled', !value);

};

function onChat (handle, msg) {
    chat_addToLog(handle, msg);
};

function onConfig (option, value) {
    console.log('server: %s -> %s', option, value);

    $('input#' + option)[0].value = value;
};

function onConnect () {
    var msg = 'connection established!';

    console.log(msg); 
    sysMsg(msg);
    socket.emit('joinGame');

};

function onConnecting () {
    var msg = 'connecting to server...';

    console.log(msg);
    sysMsg(msg);
};

function onDisconnect () {
    var msg = 'connection to server lost!';

    console.log(msg)
    sysMsg(msg);
    console.log('disconnect from server - have we disconnected yet? i\'ll try to emit another event...');
    socket.emit('test', {foo:'bar'});

    disable_chat();    
};

function onEntered (newPlayer, players) {
    sysMsg('server: ' + newPlayer + ' joined the game!');

};

function onExited (oldPlayer, players) {
    sysMsg('server: ' + oldPlayer + ' left the game!');

};

function onGameConfig () {
    console.log('server: configuration updated');
};

function onJoinGame (result, reason) {
    if (result) {
        console.log('server: joined!');
        enable_chat();
        $('#chat_input').focus();
    } else {
        console.log('server: unable to join game: ' + reason);
        window.location = '/games/' + gameId;
    }
};

function onMsg (msg) {
    sysMsg(msg);
};

function onReconnecting () {
    sysMsg('trying to reconnect...');
};

function onRoster (roster) {
    connectedPlayers = roster;
    console.log('server: connectedPlayers');
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
};

function onStartGame () {
    var msg = 'server: game starting NOW!';
    console.log(msg);
    sysMsg(msg);
    window.location = gameUrl() + '/play';
};

function onStarting (value) {
    var seconds,
        startTicker;

    if (value) {
        seconds = value/1000;
        startTicker = setInterval(function () {
            var msg = 'server: game starting in ' + seconds + ' seconds...';

            console.log(msg);
            sysMsg(msg);

            seconds -=1;

        }, 1000);
        
    } else {
        console.log('server: start of game postponed!');
        clearInterval(startTicker);
    }

};

function sysMsg (msg) {
    chat_addToLog('SYSTEM', msg);
};