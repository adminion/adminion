
var express = require('express'),
    verify = require('../verify');

module.exports = function (data) {

    var games = express.Router();

    games.use(verify);

    games.param('gameID', paramGameID);

    games.get('/', getGames);

    // GET requests for /games/create will verifySession, then create a game
    games.get('/create', getGamesCreate);

    // GET requests for /games/:gameID will verifySession, then display game stats
    games.get('/:gameID', getGamesGameID);

    // GET requests for /lobby will display the game lobby if authorized
    games.get('/:gameID/lobby', getGamesGameIDLobby);

    // GET requests for /play will check for authorization then display the game
    games.get('/:gameID/play', getGamesGameIDPlay);

    function getGames (request, response) {

        games = data.games(request.query.offset, request.query.count);

        // debug.emit('val', 'games', games);

        response.render('games' , {
            games: games
            , request : request
        });

    };

    function getGamesCreate (request, response) {
        // debug.emit('val',  'request.user', request.user, 'lib/gamesServer.js', 457);

        var newGame = { playerOne : request.user._id };

        // create Game model instance
        data.games.create(newGame, function (err, game) {
            // debug.emit('val', 'game', game);

            response.redirect('/games/' + game.id + '/lobby');

        });

    };

    function getGamesGameID (request, response) {
        
        response.render('games/game', {
            request: request
        });
        
    };

    function getGamesGameIDLobby (request, response) { 

        switch (request.game.status) {
            case 'lobby':
                response.render('games/lobby', { request: request });
            break;

            case 'play':
                response.redirect('games/' + request.params.gameID + '/play');
            break;

            default: 
                response.redirect('games/' + request.params.gameID);
                break;
        } 
        
    };

    function getGamesGameIDPlay (request, response) {
         
        response.render('games/play', {
            request: request
        });
    };

    function paramGameID (request, response, next, gameID) {
    
        request.game = data.games.byID(gameID);
        // debug.emit('val', 'request.game', request.game);

        if (request.game) {
            next();

        } else {      
            response.render('games/404', {
                request: request
            });

            return false;
        }

    };

    return games;

}
