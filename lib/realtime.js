
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

// adminion server monules
var SocketStoreage = require('./models/socket'),
    utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

function realtime (keyRing) {

    var io, 
        socketStore = new SocketStoreage(),
        self = this;

    this.start = function () {

        // @see https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO
        var configuration = {
            'authorization': passportSocketIo.authorize({
                cookieParser:   keyRing.http.cookieParser, 
                key:            'adminion.sid',
                secret:         keyRing.config.session.secret, 
                store:          keyRing.data.session()
            }),
            'log level': (keyRing.config.debug) ? 3 : 0
        };

        // create server instance
        io = socketio.listen(keyRing.http.server, configuration);

        io.server.on('close', function () {
            self.emit('closed');
        });

        /**
         *  function onConnection(socket)
         *  
         * Called each time a socket connects to the socket server.
         */
        io.sockets.on('connection', initSocket);

        this.emit('ready');
    };

    this.stop = function () {
        io.server.close(function () {
            self.emit('stopped');
        });
    };

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

            account = (player) ? keyRing.data.getAccount(player.account) : undefined;

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

        var accountID = socket.handshake.user['_id'], 
            displayName = socket.handshake.user.displayName,
            pathname = url.parse(socket.handshake.headers.referer).pathname;

        debug.emit('msg', 'initSocket');
        debug.emit('val',  'socketStore', socketStore);

        socket.on('disconnect', onDisconnect);

        socket.on('message', onMessage);

        socket.on('gameJoin', onGameJoin);

        socket.on('watch', onWatch);


        function onDisconnect () {
            // debug.emit('msg', 'socket.disconnect');

            var game,
                sockets;

            // get a working copy of the GameID--if any
            socket.get('gameID', function (err, gameID) {
                if (!err) {
                    // debug.emit('val', 'gameID', gameID);         
                    // get a working copy of the game to which this socket was connected
                    game = keyRing.data.getGame(gameID);

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
            })

            return true;
        };

        function onMessage (msg) {
           // debug.emit('msg', msg);

        };


        function onGameJoin () {


            // get the id of the game this socket is attempting to join
            var gameID = pathname.split('/')[2],
                game,
                openSeats,
                startTimer;

            // debug.emit('msg', 'gameJoin');

            if (!gameID) {
                return new Error('invalid gameID: ' + gameID);
            }

            // get a working copy of the game
            game = keyRing.data.getGame(gameID);

            // if the game is undefined
            if (!game) {
                return new Error('game not found');
            }

            switch (game.register(accountID)) {
                case 1: 

                    socket.set('gameID', gameID);

                    keyRing.data.setGame(game);

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

                                keyRing.data.setGame(savedGame);

                                // tell socket clients to redirect to the game ...board...?
                                io.sockets.in('games/' + gameID).emit('gameStart');
                                
                            });


                        }, delay);

                        debug.emit('val', 'startTimer', startTimer);
                  
                    }

                });

                socket.on('gameKill', function onGameKill (value) {

                    if (value === true) {

                        keyRing.data.removeGame(gameID, function (err) {
                            if (err) {
                                // notify playerOne of failure
                                socket.emit('gameKill', false);

                                throw err;
                            } 

                            // otherwise, tell all sockets the game has been killed
                            io.sockets.in('games/' + gameID).emit('gameKill', true);

                            keyRing.data.removeGame(gameID);

                        });
                    }
                });

                socket.on('gameConfig', function onGameConfig (option, value) {

                    // debug.emit('val', 'option', option);
                    // debug.emit('val', 'value', value);

                    if (game.config.hasOwnProperty(option)) {

                        game.config[option] = value;

                        keyRing.data.setGame(game);

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
            socket.join('games');

            socket.emit('games', keyRing.data.getGames());

            keyRing.data.on('update', function () {

                io.sockets.in('games').emit('games', keyRing.data.getGames());
            });

        };

        
    };

};

util.inherits(realtime, events.EventEmitter);

module.exports = realtime;