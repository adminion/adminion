
var url = window.location.href.split('/'),
    protocol = url[0],
    address = url[2],
    host = url[2].split(':')[0],
    port = url[2].split(':')[1],
    directory = url[3],
    gameId = url[4],
    connectedPlayers = {},
    game,
    startTicker;

console.log(game);

$(document).ready(function documentReady () {

    game = io.connect();

    game.on('connecting',           onConnecting        );
    game.on('connect',              onConnect           );
    game.on('disconnect',           onDisconnect        );
    game.on('reconnecting',         onReconnecting      );

    game.on('game ready',           onGameReady         );
    game.on('game chat',            onGameChat          );
    game.on('game config',          onGameConfig        );
    game.on('game enter',           onGameEnter         );
    game.on('game leave',           onGameExit          );
    game.on('game join',            onGameJoin          );
    game.on('game kill',            onGameKill          );
    game.on('game player ready',    onGamePlayerReady   );
    game.on('game roster',          onGameRoster        );
    game.on('game start',           onGameStart         );
    game.on('game starting',        onGameStarting      );
    game.on('game sysMsg',          onGameSysMsg        );
    

    $('input.config').on('change', function (event) {
        console.log(event);

        console.log('me: %s -> %s', event.target.name, event.target.value);
        
        game.emit('game config', event.target.name, event.target.value);
    });

    $('#imReady').on('change', function (event) {
 
        var ready = event.target.checked;

        if (ready) {
            console.log("me: I'm Ready!");
        } else {
            console.log("me: I'm NOT Ready!");
        }
        
        game.emit('game player ready', ready);
    });

    $('#killGame').on('click', function (event) {
        if (window.confirm('are you SURE you want to kill the game?')) {
            game.emit('game kill', true);
            return true;
        } else {
            return false;
        }
    });

    $('#startGame').on('click', function (event) {
        game.emit('game start');
    });

    $('#chat_input').on('keyup', function (event) {
        if (event.keyCode === 13) {
            chat_send();
        }
    });

    $('#chat_submit').on('click', function (event) {
        chat_send();
    });


});

////////////////////////////////////////////////////////////////////////////////
// utilities
////////////////////////////////////////////////////////////////////////////////

function chat_addToLog (displayName, msg) {
    // get the existing message
    var existing = $('#chat_log')[0].value;

    // and set the value to the existing chat content plus the new message at the end
    $('#chat_log')[0].value = existing + '\n' + new Date() + ' [' + displayName + ']: ' + msg;

    $('#chat_log')[0].scrollTop =    $('#chat_log')[0].scrollHeight;
    
};

function sysMsg (msg) {
    chat_addToLog('SYSTEM', msg);
};

function chat_send () {
    var msg = $('#chat_input')[0].value;
    game.emit('game chat', msg);
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

    // diliberately adding the extra comma to add two forward-slashes
    var items = [protocol,, address, directory, gameId];

    return items.join('/');;
};

////////////////////////////////////////////////////////////////////////////////
// game event handlers
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// canned socket events
////////////////////////////////////////////////////////////////////////////////

function onConnect () {
    var msg = 'connection established!';

    console.log(msg); 
    sysMsg(msg);
    game.emit('game join');

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
    console.log('disconnect event - is this handler run pre or post disconnect? i\'ll try to emit another event...');
    game.emit('test', {foo:'bar'});

    disable_chat();    
};

function onReconnecting () {
    sysMsg('trying to reconnect...');
};


////////////////////////////////////////////////////////////////////////////////
// game and chat related events
////////////////////////////////////////////////////////////////////////////////

function onGameReady (value) {

    var msg = 'server: we are ';

    msg += value ? '' : 'not ';

    msg += 'ready to start the game!';
    
    console.log(msg);

    $('#startGame').prop('disabled', !value);

};

function onGameChat (displayName, msg) {
    chat_addToLog(displayName, msg);
};

function onGameConfig (option, value) {

    var element,
        min;

    console.log('server: %s -> %s', option, value);

    $('#' + option)[0].value = value;

    if (option === 'maxPlayers') {

        min = (value > 2 && value <= 8) ? value : 2;
        
        $('#' + option)[0].prop('min', min);
    }

    console.log('server: configuration updated');

};

function onGameEnter (newPlayer, players) {
    sysMsg(newPlayer + ' joined the game!');

};

function onGameExit (oldPlayer, players) {
    sysMsg(oldPlayer + ' left the game!');

};

function onGameJoin (result, reason) {
    if (result) {
        console.log('server: joined!');
        enable_chat();
        $('#chat_input').focus();
    } else {
        console.log('server: unable to join game: ' + reason);
        window.location = '/games/' + gameId;
    }
};

function onGameKill (value) {

    console.log ('gameKill', value);

    if (value === true)  {
        window.location = '/games';
    }
};

function onGamePlayerReady (value) {
    $('#imReady').prop('checked', value);
};

function onGameRoster (roster) {

    console.log('server: roster ->');
    console.log(roster);

    $("#PlayersList").replaceWith(function () {

        var pieces,
            updatedPlayersList = '<div id="PlayersList"><table>' +
                '<tr><th>Seat</th><th>Handle</th><th>Ready</th></tr>';

        for (var playerNo in roster) {

            pieces = [
                playerNo, 
                roster[playerNo].displayName, 
                (roster[playerNo].ready === true) ? '&#10004;' : '&nbsp;'];

            updatedPlayersList += '<tr><td>' + pieces.join('</td><td>') + '</td></tr>\n';

        };

        updatedPlayersList += '</table></div>';

        console.log(updatedPlayersList);

        return updatedPlayersList;
    });
};

function onGameStart () {
    var msg = 'server: game starting NOW!',
        newLocation;

    console.log(msg);
    sysMsg(msg);

    newLocation = gameUrl() + '/play';

    console.log('gameUrl(): ', newLocation);

    window.location = newLocation;
};

function onGameStarting (value, player) {

    var msg,
        seconds;

    if (value) {

        $('#startGame')
            .prop('disabled', true)
            .text('Starting...');


        seconds = value/1000;
        startTicker = setInterval(function () {

            if (seconds > 0) {
                msg = 'game starting in ' + seconds + ' seconds...';

                console.log(msg);
                sysMsg(msg);

                seconds -=1;
                
            } else {
                clearInterval(startTicker);
            }

        }, 1000);
        
    } else {
        clearInterval(startTicker);

        msg = player + ' isn\'t ready! Start of game postponed!';

        $('#startGame').text('Start the game!')

        console.log(msg);
        sysMsg(msg);

    }

};

function onGameSysMsg (msg) {
    sysMsg(msg);
};

