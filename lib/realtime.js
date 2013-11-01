
/**
 *	lib/realtime.js
 * 
 * Adminion Realtime Utility
 *  - Extends HTTP server with Socket.io
 *  - Caches sockets by Game and Account
 *  - Defines Gameplay and Chat APIs
 *  - Officiates and logs Gameplay & Chat Events
 */


// node core modules
var events = require('events'), 
	util = require('util');

// 3rd party modules
var passportSocketIo = require('passport.socketio'), 
	socketio = require('socket.io');

// adminion server monules
var socketStore = require('./models/socket');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function (tools) {
    var realtime = Object.create(events.EventEmitter.prototype);

    var io,
        sockets  = socketStore();

    function roster (players) {
        var roster = {};

        for ( var playerNo in players ) {
            var accountID = players[playerNo].accountID;
            var account = tools.cache.getAccount(accountID);

            if (!!account) {
                roster [playerNo] = account.handle;
            }
        }

        return roster;
    };

    realtime.init = function () {

        // create server instance
        io = socketio.listen(tools.http.server);

        io.server.on('close', function () {
            realtime.emit('closed');
        });

        // setup socketio server...
        // @see https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO

        // define the authorization scheme
        io.set("authorization", passportSocketIo.authorize({
            cookieParser:   tools.http.cookieParser, 
            key:          'adminion.sid',
            secret:       tools.config.session.secret, 
            store:        tools.http.mongoStore
        }));

        io.set('log level', (tools.config.debug) ? 3 : 0); 
        
        /**
         *  function onConnection(socket)
         *  
         * Called each time a socket connects to the socket server.
         */
        io.sockets.on('connection', function (socket) {
            debug.emit('marker', 'socket connect', 'lib/realtime', 72);
            // debug.emit('val',  'Sockets', Sockets, 'lib/realtime', 71);

            var accountID = socket.handshake.user['_id'], 
            	handle = socket.handshake.user.handle, 
                socketID = socket.id;

            /**
             *  function onJoin(gameID)
             * 
             * When a socket attempts to join a game
             */
            socket.on('joinGame', function () {

                // get the id of the game this socket is attempting to join
                var gameID = tools.util.gameID(socket);

                if (!gameID) { 
                    socket.emit('denied', 'invalid gameID: ' + gameID);
                    return false;
                }

                // get a working copy of the game
                var game = tools.cache.getGame(gameID);

                // if the game is undefined
                if (!game) {
                    
                    debug.emit('val', 'game', game, 'lib/realtime', 103);
                    socket.emit('denied', 'game is false');
                    return false; 
                }

                // get the number of open seats
                var openSeats = game.openSeats();

                // if registration is still open
                if ( openSeats > 0 ) {
                    // in the event that there's only one seat left AND player one is 
                    // NOT registered AND this player is not player one..
                    if (openSeats === 1 
                    && game.playerOneRegistered() === false 
                    && game.isPlayerOne(accountID) === false) {
                        socket.emit('denied', "sorry, we're full!");
                        return false;
                    }

                    // if the account has not registered with the game
                    if ( game.isRegistered(accountID) === false) {
                        
                        // register the account with the game
                        game.register(accountID);

                        // greet the new account 
                        socket.emit('msg', "Welcome, " + handle + "!");

                        // tell all the other accounts that the new account entered the lobby
                        socket.broadcast.emit('entered', handle);

                        // tell all clients the new roster
                        io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));

                        debug.emit('msg', util.format('%s entered game lobby %s', handle, gameID), 'lib/realtime.js', 137);
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
                sockets.add(socket);

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
            socket.on('disconnect', function () {
                debug.emit('marker', 'socket disconnect', 'lib/realtime', 177);

                // get a working copy of the GameID--if any
                var gameID = tools.util.gameID(socket);

                // debug.emit('val', 'gameID', gameID, 'lib/realtime.js', 159);         

                if (!!gameID) {

                    // get a working copy of the game to which this socket was connected
                    var game = tools.cache.getGame(gameID);
                    
                    // say goodbye to the account 
                    socket.emit('msg', "Fairwell, " + handle + "!");

                    // remove the socket from cache
                    sockets.remove(socket.id);
                    
                    // if the account has no more sockets and the account was in a game
                    if (sockets.byGame(gameID).byAccount(accountID).length === 0 && game.exitLobby(accountID)) {
                        // let all the sockets know that the user has left the lobby
                        io.sockets.in('games/' + gameID).emit('exited', handle);

                        // roster event on the client tells whether or not 
                        io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));

                        // debug.emit('val', 'game', game, 'lib/realtime.js', 201);
                        msg = util.format('%s left game %s', handle, gameID);
                        debug.emit('msg', msg, 'lib/realtime.js', 205);
                    }

                    // debug.emit('val', 'Sockets', Sockets, 'lib/realtime.js', 208);             
                }

                return true;
            });

            socket.on('message', function (msg) {
                msg = handle + " - " + new Date() + ": " + msg;

                console.log(msg);

                // get a working copy of the GameID--if any
                var gameID = tools.util.gameID(socket);

                io.sockets.in('games/' + gameID).emit('chat', msg);

                return true;
            });

            

        });

        realtime.emit('ready');
    };

    realtime.stop = function () {
        io.server.close();
    };

    return realtime;

};
