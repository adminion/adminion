
/**
 *	lib/realtime.js
 * 
 * Adminion Realtime Utility
 *  - Extends HTTP server with Socket.io
 *  - Caches sockets by Game and Account
 *  - Provides Real-Time page 
 *  - Defines Gameplay and Chat APIs
 *  - Officiates and logs Gameplay & Chat Events
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
var socketStoreage = require('./models/socket'),
    utils = require('./utils');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

function realtime (tools) {

    var io, 
        socketStore = socketStoreage(),
        self = this;

    function gamesList (offset, count) {

        var offset = offset || 0,
            count = count || 20,
            games = tools.modules.cache.getGames(),
            playerOne,
            list = {},
            numGames = games.length,
            i,
            accountID;


        debug.emit('val', 'games', games);

        for (i=0; i <numGames; i+=1) {

            accountID = games[i].playerOne.accountID,
            playerOne = tools.modules.cache.getAccount(accountID);
            
            list[i] = [games[i], playerOne];

        }

        return list; 
    };

    function initSocket (socket) {
        var accountID = socket.handshake.user['_id'], 
            handle = socket.handshake.user.handle,
            pathname = url.parse(socket.handshake.headers.referer).pathname;

        debug.emit('msg', 'sockets.connection');
        // debug.emit('val',  'Sockets', Sockets);

        /**
         *  function onJoin(gameID)
         * 
         * When a socket attempts to join a game
         */
        socket.on('joinGame', function joinGame () {
            // get the id of the game this socket is attempting to join
            var gameID = pathname.split('/')[2],
                game,
                openSeats;

            debug.emit('msg', 'socket.join');

            if (!gameID) {
                throw('invalid gameID: ' + gameID);
                return false;
            }

            // get a working copy of the game
            game = tools.modules.cache.getGame(gameID);

            // if the game is undefined
            if (!game) {
                throw('game not found');
                return false;
            }

            try {
                switch (game.register(accountID)) {
                    case 1: 

                        tools.modules.cache.setGame(game);

                        // tell all clients the new roster
                        io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));
                        
                        // tell all the other accounts that the new account entered the lobby
                        socket.broadcast.emit('entered', handle);
                        debug.emit('msg', util.format('%s entered game lobby %s', handle, gameID));

                    break;

                    case 0:
                    break;
                };
                
            } catch (err) {
                socket.emit('join', false, err.message);

                throw err;

                return false;
            }

            // add socket to cache
            socketStore.add(socket);

            // greet the new socket
            socket.emit('msg', "Welcome, " + handle + "!");

            // send the roster to the new socket
            socket.emit('roster', roster(game.playersConnected()));


            socket.on('gameChat', function gameChat (msg) {

                io.sockets.in('games/' + gameID).emit('chat', handle, msg);

                return true;
            });


           // assign event handler for when the player says "i'm ready!"
            socket.on('ready', function (value) {

                var regID,
                    playerOneSockets;

                debug.emit('msg', 'socket ready: ' + value);

                regID = game.isRegistered(accountID);
                
                game.registeredPlayers[regID].ready = value;
                
                playerOneSockets = socketStore.byAccount(game.playerOne.accountID);

                // debug.emit('val', 'playerOneSockets', playerOneSockets);
                
                if (game.isRegistered(game.playerOne.accountID) >= 0 && game.registeredPlayers.length > 1 && game.allReady()) {
                    debug.emit('msg', 'all players ready!');

                    playerOneSockets.forEach(function (s) { 
                        s.emit('allReady', true);
                    });

                } else {
                    if (playerOneSockets) {
                        playerOneSockets.forEach(function (s) { 
                            s.emit('allReady', false);
                        });
                    }
                }
            
            });

            // if the socket is is playerOne, setup these event handlers

            if (game.isPlayerOne(accountID)) {
                socket.on('startGame', function (value) {

                    var delay = 10000,
                        startTimer;

                    if ( value && game.allReady() ) {
                        io.sockets.in('games/' + gameID).emit('starting', delay);
                    
                        startTimer = setTimeout(function () {
                            // close registration and start the game...
                            game.startGame(function gameStarted (err) {
                                if (err) {
                                    debug.emit('msg', 'the game was not saved!');
                                    debug.emit('val', 'err', err);
                                }

                                debug.emit('msg', 'the game was saved!')

                                // tell socket clients to redirect to the game ...board...?
                                io.sockets.in('games/' + gameID).emit('startGame');
                                
                            });


                        }, delay);
                  
                    }

                });

                socket.on('gameConfig', function gameConfig (option, value) {

                    // debug.emit('val', 'option', option);
                    // debug.emit('val', 'value', value);

                    socket.emit('gameConfig');
                    socket.broadcast.to('games/' + gameID).emit('config', option, value);

                    // debug.emit('msg', 'player one has adjusted the configuration.');
                    // debug.emit('val', option, value);
                        
                });
                
            }


            // join the socket to the chat room "gameID"
            socket.join('games/' + gameID );

            socket.emit('joinGame', true);

            return true;
            
        });

        /**
         *  function onDisconnect(socket)
         *
         * When a socket disconnects 
         */
        socket.on('disconnect', function disconnect () {
            debug.emit('msg', 'socket.disconnect');

            // get a working copy of the GameID--if any
            var gameID = pathname.split('/')[2],
                game,
                sockets;

            // debug.emit('val', 'gameID', gameID);         

            if (gameID) {

                // get a working copy of the game to which this socket was connected
                game = tools.modules.cache.getGame(gameID);
                sockets = socketStore.byGame(gameID);
                
                // say goodbye to the account 
                socket.emit('msg', "Fairwell, " + handle + "!");

                // remove the socket from cache
                socketStore.remove(socket.id);
                
                // if the account has no more sockets and the account was in a game
                if (sockets && sockets.byAccount(accountID).length === 0 && game.exitLobby(accountID)) {
                    // let all the sockets know that the user has left the lobby
                    io.sockets.in('games/' + gameID).emit('exited', handle);

                    // roster event on the client tells whether or not 
                    io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));

                    // debug.emit('val', 'game', game);
                    msg = util.format('%s left game %s', handle, gameID);
                    debug.emit('msg', msg);
                }

                // debug.emit('val', 'Sockets', Sockets);             
            }

            return true;
        });

        socket.on('message', function message (msg) {
           // debug.emit('msg', msg);

        });

        socket.on('gamesList', function () {
            var list = gamesList();

            socket.emit('games', list);

        });
        
    };

    function roster (players) {
        var account,
            accountID,
            playerNo,
            roster = {};

        // for ( var i = 0; i)
        for (playerNo in players ) {

            if (players[playerNo]) {
                accountID = players[playerNo].accountID;
                account = tools.modules.cache.getAccount(accountID);
            } else {
                account = undefined;
            }

            if (account) {
                roster [playerNo] = account.handle;
            } else {
                roster [playerNo] = '';
            }
        }

        return roster;
    };

    this.start = function () {

        // @see https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO
        var configuration = {
            'authorization' : passportSocketIo.authorize({
                cookieParser:   tools.modules.http.cookieParser, 
                key:          'adminion.sid',
                secret:       tools.config.session.secret, 
                store:        tools.modules.http.mongoStore
            }),
            'log level': (tools.config.debug) ? 3 : 0
        };

        // create server instance
        io = socketio.listen(tools.modules.http.server, configuration);

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
        io.server.close();
    };

};

util.inherits(realtime, events.EventEmitter);

module.exports = realtime;