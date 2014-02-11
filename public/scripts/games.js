
var socket = io.connect();

console.log(socket);

$(document).ready(function documentReady () {

    socket.on('connect', onConnect);

    socket.on('games', onGames);

    socket.emit('games');

});

function onConnect () {

    socket.emit('watch');

};

function onGames (games, playerOnes) {

    console.log(games);
    console.log(playerOnes);

    var newGames = '<ol>';

    for (game in games) {
        newGames += '<li><a href="/games/' + games[game]['_id'] + '">' + playerOnes[games[game]['_id']].handle + "s Game</a>";

        if (game.status === 'lobby') {
            newGames += ' [ <a href="/games/' + game['_id'] + '/lobby">Join</a> ] ';
        }

        newGames += '</li>';
    }

    newGames += '</ol>';

    $('#games').html(newGames);

};