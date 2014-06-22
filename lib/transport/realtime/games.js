
// node core modules
var url = require('url'),
    util = require('util');

// 3rd-party modules
var debug = require('debug')('adminion:transport:realtime:games'),
    mongoose = require('mongoose'),
    passportSocketio = require('passport.socketio');

module.exports = function gamesNsp (io, data, authOptions) {

    var games = io.of('/games')

    // setup authorization
        .use(passportSocketio.authorize(authOptions))

    // setup connection event
        .on('connect', socketConnect);

    function roster (players) {
        var account,
            i,
            displayName,
            player,
            ready,            
            roster = {},
            seat = {};

        // debug('players', players);

        for ( i in players) {

            // debug('i', i);
            
            player = players[i];

            account = (player) ? data.accounts.byID(player.account) : undefined;

            // debug('account', account);


            displayName = (account) ? account.displayName : '&nbsp;';
            ready = (player) ? player.ready : '&nbsp;';
        
            roster [i] = {
                displayName: displayName,
                ready:  ready
            };

        }

        return roster;
    };

    function socketConnect (socket, next) {

        var accountID = socket.request.user._id,
            displayName = socket.request.user.displayName;

        socket.on('join', onJoin);

        socket.on('watch', onWatch);

        function onJoin () {

            var gameID = url.parse(socket.request.headers.referer).pathname.split('/')[2],
                game,
                openSeats,
                startTimer;

            if (!gameID) {
                return new Error('invalid gameID: ' + gameID);
            }

            // get a working copy of the game
            game = data.games.byID(gameID);

            // if the game is undefined
            if (!game) {
                return new Error('game not found');
            }

            // if the account is not registered
            if (!game.isRegistered(accountID)) {
                
                // if registration is still open
                if (game.registration.state === 'open') {
                    game.register(accountID);
                } 

                // otherwise the account is not registered
                else {
                    // if the account is player one 
                    if (game.isPlayerOne(accountID)) {
                        // register player One
                    }
                }

                socket.gameID = gameID;

                data.games.set(game);

                // tell all clients the new roster
                games.in(gameID).emit('roster', roster(game.playersConnected()));
                
                // tell all the other accounts that the new account entered the lobby
                games.in(gameID).emit('joined', displayName);
                // debug(util.format('%s entered game lobby %s', displayName, gameID));
            };

            // add socket to cache
            data.sockets.add(socket);

            // greet the new socket
            socket.emit('sysMsg', util.format('Welcome, %s!', displayName));

            // send the roster to the new socket
            socket.emit('roster', roster(game.playersConnected()));

            // assign event handler for when the player says "i'm ready!"
            socket.on('player ready', onPlayerReady );

            // if the socket is playerOne, setup these event handlers

            if (game.isPlayerOne(accountID)) {
                socket.on('start', onStart);

                socket.on('kill', onKill);

                socket.on('config', onConfig);
                
            }


            // join the socket to the chat room "gameID"
            socket.join(gameID);

            socket.emit('join', true);

            function onConfig (option, value) {

                // debug('option', option);
                // debug('value', value);

                if (game.config.hasOwnProperty(option)) {

                    game.config[option] = value;

                    data.games.set()(game);

                    games.in(socket.gameID).emit('config', option, value);
                    
                }

                // debug('player one has adjusted the configuration.');
                // debug(option, value);
                    
            }

            function onKill (value) {

                if (value === true) {

                    data.games.remove(socket.gameID, function (err) {
                        if (err) {
                            // notify playerOne of failure
                            socket.emit('kill', false);

                            throw err;
                        } 

                        // otherwise, tell all sockets the game has been killed
                        games.in(socket.gameID).emit('kill', true);

                        data.games.remove(socket.gameID);

                    });
                }
            };

            
            function onPlayerReady (value) {

                var regID,
                    playerOneSockets,
                    readyPlayerSockets;

                debug(util.format('socket ready: %s', value));
                debug('startTimer', startTimer);

                if (startTimer && !value) {
                    clearTimeout(startTimer);
                    startTimer = undefined;
                    games.in(gameID).emit('starting', false, displayName);
                }

                game.playerReady(accountID, value);

                // tell all sockets belonging to this account that they are ready (in case multiple windows are open)
                readyPlayerSockets = data.sockets.byAccount(accountID);
                
                readyPlayerSockets.forEach(function (socket) {
                    socket.emit('player ready', value);
                });

                games.in(gameID).emit('roster', roster(game.playersConnected()));
                
                // debug('game.playerOne', game.playerOne);

                playerOneSockets = data.sockets.byAccount(game.playerOne._id);

                // debug('playerOneSockets', playerOneSockets);

                if (game.ready()) {
                    // debug('all players ready!');
                
                    playerOneSockets.forEach(function (socket) { 
                        socket.emit('ready', true);
                    });

                } else {
                    if (playerOneSockets) {
                        playerOneSockets.forEach(function (socket) { 
                            socket.emit('ready', false);
                        });
                    }
                }
            
            };


            function onStart () {

                var delay = 10000;

                if (game.allReady()) {
                    games.in(socket.gameID).emit('starting', delay);

                    // debug('game', game);
                
                    startTimer = setTimeout(function startTimerCallback () {
                        // close registration and start the game...
                        game.startGame(onceGameStarted);


                    }, delay);

                    debug('start timer', startTimer);
              
                }

            };
            
            return true;
        };


        function onWatch () {

            debug('socket watching games list')
            socket.emit('list', data.games());
        };

        function onceStarted (err, savedGame) {
            if (err) {
                // debug('the game was not saved!');
                throw err;
            }

            // debug('savedGame', savedGame);

            // debug('the game was saved!')

            data.games.set()(savedGame);

            // tell socket clients to redirect to the game ...board...?
            games.in(socket.gameID).emit('start');
            
        }

        // next();

    };

    return games;

}
