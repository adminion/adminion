
/**
 *	lib/realtime.js
 * 
 * Adminion Realtime Utility
 *  - Extends HTTP server with Socket.io
 *  - Caches sockets by Game and Account
 *  - Defines Gameplay and Chat APIs
 *  - Officiates and logs Gameplay & Chat Events
 * 
 * @see - https://github.com/LearnBoost/socket.io
 * 
 */


// node core modules
var events = require('events'), 
	util = require('util');

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

module.exports = function (tools) {
    var realtime = Object.create(events.EventEmitter.prototype);

    var io,
        socketStore  = socketStoreage();

    function roster (players) {
        var account,
            accountID,
            playerNo,
            roster = {};

        // for ( var i = 0; i)
        for (playerNo in players ) {

            if (players[playerNo]) {
                accountID = players[playerNo].accountID;
                account = tools.cache.getAccount(accountID);
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

    realtime.init = function () {

        // @see https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO
         var configuration = {
            'authorization' : passportSocketIo.authorize({
                cookieParser:   tools.http.cookieParser, 
                key:          'adminion.sid',
                secret:       tools.config.session.secret, 
                store:        tools.http.mongoStore
            }),
            'log level': (tools.config.debug) ? 3 : 0
        };

        // create server instance
        var io = socketio.listen(tools.http.server, configuration);

        io.server.on('close', function () {
            realtime.emit('closed');
        });

        // setup socketio server...
        /**
         *  function onConnection(socket)
         *  
         * Called each time a socket connects to the socket server.
         */
        io.sockets.on('connection', function connection (socket) {
            debug.emit('msg', 'sockets.connection');
            // debug.emit('val',  'Sockets', Sockets);

            var accountID = socket.handshake.user['_id'], 
            	handle = socket.handshake.user.handle, 
                socketID = socket.id;

            /**
             *  function onJoin(gameID)
             * 
             * When a socket attempts to join a game
             */
            socket.on('joinGame', function joinGame () {
                debug.emit('msg', 'socket.joinGame');


                // get the id of the game this socket is attempting to join
                var gameID = tools.utils.gameID(socket);

                if (!gameID) { 
                    socket.emit('denied', 'invalid gameID: ' + gameID);
                    return false;
                }

                // get a working copy of the game
                var game = tools.cache.getGame(gameID);

                // if the game is undefined
                if (!game) {
                    
                    debug.emit('val', 'game', game);
                    socket.emit('denied', 'game is false');
                    return false; 
                }

                // get the number of open seats
                var openSeats = game.openSeats();

                // if registration is still open
                if ( openSeats > 0 ) {

                    // in the event that there's only one seat left AND player one is 
                    // NOT registered AND this player is not player one..
                    if (openSeats === 1 ) {
                        debug.emit('msg', 'openSeats === 1');

                        if (game.playerOneRegistered === false) {
                            debug.emit('msg', 'game.playerOneRegistered === false');

                            if (game.isPlayerOne(accountID) === false) {
                                debug.emit('msg', 'game.isPlayerOne(accountID) === false');

                                socket.emit('denied', "sorry, we're full!");
                                return false;
                            }                       
                        }
                    }

                    // if the account has not registered with the game
                    if ( game.isRegistered(accountID) === false) {
                        
                        // register the account with the game
                        game.register(accountID);

                        tools.cache.setGame(game);

                        // tell all clients the new roster
                        io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));
                        
                        // tell all the other accounts that the new account entered the lobby
                        socket.broadcast.emit('entered', handle);

                        debug.emit('msg', util.format('%s entered game lobby %s', handle, gameID));
                    }
                // however, if registration is closed
                } else {
                    // and if this player isn't registered
                    if ( game.isRegistered(accountID) === false) {
        
                        // deny them access because registration is closed.
                        console.log("sorry, we're full!");
                        return false;
                    }

                }

                // add socket to cache
                socketStore.add(socket);

                // greet the new socket
                socket.emit('msg', "Welcome, " + handle + "!");

                // tell the socket who is connected
                socket.emit('roster', roster( game.playersConnected() ) );

                // assign event handler for "ready!" event
                socket.on('ready!', function (value) {
                    game.accountReady(accountID, value);
                });

                // join the socket to the chat room "gameID"
                socket.join('games/' + gameID );

                socket.emit('joined', true);

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
                var gameID = tools.utils.gameID(socket);

                // debug.emit('val', 'gameID', gameID);         

                if (gameID) {

                    // get a working copy of the game to which this socket was connected
                    var game = tools.cache.getGame(gameID);
                    var sockets = socketStore.byGame(gameID);
                    
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

                // get a working copy of the GameID--if any
                var gameID = tools.utils.gameID(socket);

                io.sockets.in('games/' + gameID).emit('chat', handle, msg);

                return true;
            });

            socket.on('config', function configuration (adjustment) {

                var gameID = tools.utils.gameID(socket);

                console.log('client wants to change the configuration.');
                console.log(adjustment);

                socket.broadcast.to('games/' + gameID).emit('config', adjustment);
            });

            

        });

        realtime.emit('ready');
    };

    realtime.stop = function () {
        io.server.close();
    };

    return realtime;

};
