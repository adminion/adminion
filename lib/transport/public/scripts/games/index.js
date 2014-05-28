
var socket;

$(document).ready(function documentReady () {

    socket = io('/games');
    console.log('socket:', socket);

    socket.on('data', console.log);

    socket.on('error', errFace);

    socket.io.on('reconnect', errFace);
    socket.io.on('connect_errror', errFace);
    socket.io.on('reconnect_error', errFace);
    socket.io.on('reconnect_failed', errFace);

    socket.on('connect', function () {

        console.log('socket:', socket);
        socket.emit('watch');

    });

    socket.on('message', errFace);

    socket.on('list', function (games) {

        console.log('games:', games);
        
        var game,
            i,
            newGames = '<ol>';

        for (i in games) {

            game = games[i];
            
            console.log('game:', game);

            newGames += '<li><a href="/games/' + game._id + '">' + game.playerOne.displayName + "'s Game</a>";

            if (game.status === 'lobby') {
                newGames += ' [ <a href="/games/' + game._id + '/lobby">Join</a> ] ';
            }

            newGames += '</li>';
        }

        newGames += '</ol>';

        $('#games').html(newGames);

    });

    function errFace (err) {
        console.log('typeof(err):', typeof(err))
        console.log('err:', err)
    }

});
