
/**
 *	lib/realtime.js
 * 
 *	The realtime module handles all real-time communications which are primarily handled via socket.io 
 *
 *
 *
 */


// node core modules
var events = require('events'), 
	util = require('util');

// 3rd party modules
var passportSocketIo = require('passport.socketio'), 
	socketio = require('socket.io');

// adminion server monules
var socketStore = require('../models/socket');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function (adminion) {
    var realtime = Object.create(events.EventEmitter.prototype);

    var sockets  = socketStore();

    function roster (players) {
        var roster = {};

        for ( var playerNo in players ) {
            var accountID = players[playerNo].accountID;
            var account = adminion.cache.getAccount(accountID);

            if (!!account) {
                roster [playerNo] = account.handle;
            }
        }

        return roster;
    };

    var io = socketio.listen(adminion.http.server);

    // setup socketio server...
    // @see https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO

    // define the authorization scheme
    io.set("authorization", passportSocketIo.authorize({
        cookieParser:   adminion.http.cookieParser, 
        key:          'adminion.sid',
        secret:       adminion.config.session.secret, 
        store:        adminion.http.mongoStore
    }));

    // set the log level to: 2 - info 
    io.set('log level', 3); 
    
    /**
     *  function onConnection(socket)
     *  
     * Called each time a socket connects to the socket server.
     */
    io.sockets.on('connection', function (socket) {
        debug.msg('------------------------------ socket connect ----------------------------------', 'lib/realtime', 70);
        // debug.val( 'Sockets', Sockets, 'lib/realtime', 71);

        var accountID = socket.handshake.user['_id'], 
        	handle = socket.handshake.user.handle, 
            socketID = socket.id;

        // initialize a store for the account
        Sockets.initAccount(accountID);

        /**
         *  function onJoin(gameID)
         * 
         * When a socket attempts to join a game
         */
        socket.on('joinGame', function () {

            // get the id of the game this socket is attempting to join
            var gameID = socket.handshake.headers.referer.split('/')[4];

            // get a working copy of the game
            var game = adminion.cache.getGame(gameID);

            // if the game is undefined
            if (!game) {
                
                debug.val('game', game, 'lib/realtime', 94);
                socket.emit('denied', 'invalid gameID: ' + gameID);
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

                    debug.msg(util.format('%s entered game lobby %s', handle, gameID), 'lib/realtime.js', 135);
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
            adminion.cache.addSocket(socket);

            // tell the socket who else is connected
            socket.emit('roster', roster(game.playersConnected()));

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
            debug.msg('---------------------------- socket disconnect ---------------------------------', 'lib/realtime', 168);

            // get a working copy of the GameID--if any
            var gameID = adminion.util.gameID(socket);

            // debug.val('gameID', gameID, 'lib/realtime.js', 159);         

            if (!!gameID) {

                // get a working copy of the game to which this socket was connected
                var game = Games[gameID];
                
                // say goodbye to the account 
                socket.emit('msg', "Fairwell, " + handle + "!");

                // remove the socket from cache
                Sockets.remove(socket.id);
                
                // if the account has no more sockets and the account was in a game
                if (Sockets.byGame(gameID).byAccount(accountID).length === 0 && game.exitLobby(accountID)) {
                    // let all the sockets know that the user has left the lobby
                    io.sockets.in('games/' + gameID).emit('exited', handle);

                    // roster event on the client tells whether or not 
                    io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));

                    // debug.val('game', game, 'lib/realtime.js', 201);
                    msg = util.format('%s left game %s', handle, gameID);
                    debug.msg(msg, 'lib/realtime.js', 205);
                }

                // debug.val('Sockets', Sockets, 'lib/realtime.js', 208);
                                
            }
        });

        socket.on('message', function (msg) {
            msg = handle + " - " + new Date() + ": " + msg;

            console.log(msg);

            // get a working copy of the GameID--if any
            var gameID = adminion.util.gameID(socket);

            io.sockets.in('games/' + gameID).emit('chat', msg);
        });

        

    });

 	realtime.addSocket = function (socket) {
        sockets.add(socket);

    };

    realtime.removeSocket = function (socketID) {
        sockets.remove(socketID);
    };

    // debug.val('realtime', realtime, 'lib/realtime', 277);

    process.nextTick(function() {
        realtime.emit('ready');
    });

    return realtime;

};
