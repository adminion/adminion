
var socket = io.connect();

console.log(socket);

$(document).ready(function documentReady () {

    socket.on('connect', function () {

        socket.emit('games watch');

    });

    socket.on('games list', function (games) {

        console.log(games);
        
        var game,
            i,
            newGames = '<ol>';

        for (i in games) {

            game = games[i];
            
            console.log(game);

            newGames += '<li><a href="/games/' + game._id + '">' + game.playerOne.displayName + "'s Game</a>";

            if (game.status === 'lobby') {
                newGames += ' [ <a href="/games/' + game._id + '/lobby">Join</a> ] ';
            }

            newGames += '</li>';
        }

        newGames += '</ol>';

        $('#games').html(newGames);

    });

});
