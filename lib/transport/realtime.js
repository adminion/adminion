
/**
 *	lib/realtime.js
 * 
 * Adminion Realtime Utility
 *  - Extends HTTP server with Socket.io
 *  - Caches sockets by Game and Account
 *  - Provides Real-Time page updates
 *  - Defines Gameplay and Chat APIs
 *  - Delegates and logs Gameplay & Chat Events
 * 
 * @see - https://github.com/LearnBoost/socket.io
 *
 *  
 *
 * Scopes within realtime library:
 *
 *  1.  global scope 
 *      a.  canned server event handlers 
 *      b.  custom server event handlers
 *      c.  library utility functions
 *
 *  2.  socket scope
 *      a.  canned socket event handlers
 *      b.  custom socket event handlers
 *      c.  socket utility functions
 *
 */


// node core modules
var events = require('events'), 
	util = require('util'),
    url = require('url');

// 3rd party modules
var passportSocketIo = require('passport.socketio'), 
    socketio = require('socket.io');

// adminion server modules
var config = require('../config'),
    env = require('../env'),
    SocketStoreage = require('./socket'),
    utils = require('../utils');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

function Adminion_realtime (data, http) {

    var configuration,
        io, 
        socketStore = new SocketStoreage(),
        self = this;

    // create instance attached to http server
    io = socketio(http.server);

    // setup authorization
    io.use(passportSocketIo.authorize({
        cookieParser:   http.cookieParser, 
        key:            'adminion.sid',
        secret:         config.session.secret, 
        store:          data.session()
    }));

    /**
     *  function onConnection(socket)
     *  
     * Called each time a socket connects to the socket server.
     */
    io.sockets.on('connection', initSocket);

    data.on('update', function () {
        io.in('games').emit('games', games);
    });

    function roster (players) {
        var account,
            i,
            displayName,
            player,
            ready,
            roster = {},
            seat = {};

        // debug.emit('val', 'players', players);

        for ( i in players) {

            // debug.emit('val', 'i', i);
            
            player = players[i];

            account = (player) ? data.getAccount(player.account) : undefined;

            // debug.emit('val', 'account', account);


            displayName = (account) ? account.displayName : '&nbsp;';
            ready = (player) ? player.ready : '&nbsp;';
        
            roster [i] = {
                displayName: displayName,
                ready:  ready
            };

        }

        return roster;
    };

    function initSocket (socket) {

        debug.emit('val', 'socket.user', socket.user );

        var accountID = socket.user['_id'], 
            displayName = socket.user.displayName;

        debug.emit('msg', 'initSocket');
        debug.emit('val',  'socketStore', socketStore);

        socket.on('disconnect', onDisconnect);

        socket.on('message', onMessage);

        socket.on('gameJoin', onGameJoin);

        socket.on('watch', onWatch);


        function onDisconnect () {
            // debug.emit('msg', 'socket.disconnect');

            var game,
                gameID,
                sockets;

            // get a working copy of the GameID--if any
            if (socket.gameID) {

                gameID = socket.gameID;
                
                // debug.emit('val', 'gameID', gameID);         
                // get a working copy of the game to which this socket was connected
                game = data.getGame(gameID);

                sockets = socketStore.byGame(gameID);
                
                // say goodbye to the account 
                socket.emit('gameSysMsg', "Fairwell, " + displayName + "!");

                // remove the socket from cache
                socketStore.remove(socket.id);
                
                // if the account has no more sockets and the account was in the game
                if (sockets && sockets.byAccount(accountID).length === 0 && game.exitLobby(accountID)) {
                    // let all the sockets know that the user has left the lobby
                    io.sockets.in('games/' + gameID).emit('gameExited', displayName);

                    // roster event on the client tells whether or not 
                    io.sockets.in('games/' + gameID).emit('gameRoster', roster(game.playersConnected()));

                    // debug.emit('val', 'game', game);
                    msg = util.format('%s left game %s', displayName, gameID);
                    // debug.emit('msg', msg);
                }

                // debug.emit('val', 'socketStore', socketStore);             
            }

            return true;
        };

        function onMessage (msg) {
           // debug.emit('msg', msg);

        };


        function onGameJoin () {

            var gameID = url.parse(socket.request.headers.referer).pathname.split('/')[2],
                game,
                openSeats,
                startTimer;

            // debug.emit('msg', 'gameJoin');

            if (!gameID) {
                return new Error('invalid gameID: ' + gameID);
            }

            // get a working copy of the game
            game = data.getGame(gameID);

            // if the game is undefined
            if (!game) {
                return new Error('game not found');
            }

            switch (game.register(accountID)) {
                case 1: 

                    socket.set('gameID', gameID);

                    data.setGame(game);

                    // tell all clients the new roster
                    io.sockets.in('games/' + gameID).emit('gameRoster', roster( game.playersConnected() ) );
                    
                    // tell all the other accounts that the new account entered the lobby
                    socket.broadcast.emit('gameEntered', displayName);
                    // debug.emit('msg', util.format('%s entered game lobby %s', displayName, gameID));

                break;

                case 0:
                break;
            };

            // add socket to cache
            socketStore.add(socket);

            // greet the new socket
            socket.emit('gameSysMsg', util.format('Welcome, %s!', displayName));

            // send the roster to the new socket
            socket.emit('gameRoster', roster(game.playersConnected()));


            socket.on('gameChat', function onGmeChat (msg) {

                io.sockets.in('games/' + gameID).emit('gameChat', displayName, msg);

                return true;
            });


           // assign event handler for when the player says "i'm ready!"
            socket.on('gameReady', function onGameReady (value) {

                var regID,
                    playerOneSockets,
                    readyPlayerSockets;

                debug.emit('msg', util.format('socket ready: %s', value));
                debug.emit('val', 'startTimer', startTimer);

                if (startTimer && !value) {
                    clearTimeout(startTimer);
                    startTimer = undefined;
                    io.sockets.in('games/' + gameID).emit('gameStarting', false, displayName);
                }

                game.playerReady(accountID, value);

                // tell all other sockets belonging to this account that they are ready (in case multiple windows are open)
                readyPlayerSockets = socketStore.byAccount(accountID);
                
                readyPlayerSockets.forEach(function (socket) {
                    socket.emit('gameReady', value);
                });

                io.sockets.in('games/' + gameID).emit('gameRoster', roster(game.playersConnected()));
                
                // debug.emit('val', 'game.playerOne', game.playerOne);

                playerOneSockets = socketStore.byAccount(game.playerOne['_id']);

                // debug.emit('val', 'playerOneSockets', playerOneSockets);

                if (game.isRegistered(game.playerOne['_id']) >= 0 && game.registeredPlayers.length > 1 && game.allReady()) {
                    // debug.emit('msg', 'all players ready!');
                
                    playerOneSockets.forEach(function (socket) { 
                        socket.emit('gameAllReady', true);
                    });

                } else {
                    if (playerOneSockets) {
                        playerOneSockets.forEach(function (socket) { 
                            socket.emit('gameAllReady', false);
                        });
                    }
                }
            
            });

            // if the socket is is playerOne, setup these event handlers

            if (game.isPlayerOne(accountID)) {
                socket.on('gameStart', function gameStart () {

                    var delay = 10000;

                    if (game.allReady()) {
                        io.sockets.in('games/' + gameID).emit('gameStarting', delay);

                        // debug.emit('val', 'game', game);
                    
                        startTimer = setTimeout(function startTimerCallback () {
                            // close registration and start the game...
                            game.startGame(function gameStarted (err, savedGame) {
                                if (err) {
                                    // debug.emit('msg', 'the game was not saved!');
                                    throw err;
                                }

                                // debug.emit('val', 'savedGame', savedGame);

                                // debug.emit('msg', 'the game was saved!')

                                data.setGame(savedGame);

                                // tell socket clients to redirect to the game ...board...?
                                io.sockets.in('games/' + gameID).emit('gameStart');
                                
                            });


                        }, delay);

                        debug.emit('val', 'startTimer', startTimer);
                  
                    }

                });

                socket.on('gameKill', function onGameKill (value) {

                    if (value === true) {

                        data.removeGame(gameID, function (err) {
                            if (err) {
                                // notify playerOne of failure
                                socket.emit('gameKill', false);

                                throw err;
                            } 

                            // otherwise, tell all sockets the game has been killed
                            io.sockets.in('games/' + gameID).emit('gameKill', true);

                            data.removeGame(gameID);

                        });
                    }
                });

                socket.on('gameConfig', function onGameConfig (option, value) {

                    // debug.emit('val', 'option', option);
                    // debug.emit('val', 'value', value);

                    if (game.config.hasOwnProperty(option)) {

                        game.config[option] = value;

                        data.setGame(game);

                        socket.emit('gameConfig', option, value);
                        socket.broadcast.to('games/' + gameID).emit('gameConfig', option, value);
                        
                    }

                    // debug.emit('msg', 'player one has adjusted the configuration.');
                    // debug.emit('val', option, value);
                        
                });
                
            }


            // join the socket to the chat room "gameID"
            socket.join('games/' + gameID );

            socket.emit('gameJoin', true);

            return true;
            
        };

        function onWatch() {

            var games = data.getGames();
            socket.join('games');

            debug.emit('msg', 'blah!!!!!!!!!!!!!!!!!!!!!!!');

            socket.emit('games', games);


        };

        
    };

};

util.inherits(Adminion_realtime, events.EventEmitter);

module.exports = Adminion_realtime;
