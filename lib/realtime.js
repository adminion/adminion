
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
 * create socket storage container
 * start listening for socket connections
 * define how to initlialize sockets when they connect
 * return the module as a whole
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
// helper functions
//
////////////////////////////////////////////////////////////////////////////////

function initSocket (socket) {
    var accountID = utils.accountID(socket), 
        handle = socket.handshake.user.handle, 
        socketID = socket.id;

    debug.emit('val', 'socket.headers', socket.headers);

    // switch (socket.headers.url)

    function gamesList (offset, count) {

        var offset = offset || 0,
            count = count || 20,
            games = tools.cache.getGames(),
            playerOnes = {},
            numGames = games.length,
            i,
            accountID,
            gameID;

        debug.emit('val', 'games', games);

        for (i=0; i <numGames; i+=1) {
            
            accountID = games[i].playerOne.accountID,
                gameID = games[i]['_id'];

            debug.emit('val', 'accountID', accountID);
            debug.emit('val', 'gameID', gameID);
            
            playerOnes[gameID] = tools.cache.getAccount(accountID);
            
        }

        socket.emit('games', tools.cache.getGames(), playerOnes);
    };

    function joinGame () {
        // get the id of the game this socket is attempting to join
        var gameID = tools.utils.gameID(socket),
            game,
            openSeats;

        debug.emit('msg', 'socket.joinGame');

        if (!gameID) { 
            socket.emit('denied', 'invalid gameID: ' + gameID);
            return false;
        }

        // get a working copy of the game
        game = tools.cache.getGame(gameID);

        // if the game is undefined
        if (!game) {
            
            debug.emit('val', 'game', game);
            socket.emit('denied', 'game is false');
            return false; 
        }

        // get the number of open seats
        openSeats = game.openSeats();

        // if registration is still open
        if ( openSeats > 0 ) {

            // in the event that there's only one seat left AND player one is 
            // NOT registered AND this player is not player one..
            if (openSeats === 1 ) {
                debug.emit('msg', 'openSeats === 1');

                if (game.isRegistered (game.playerOne.accountID) === false) {
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

        // send the roster to the new socket
        socket.emit('roster', roster(game.playersConnected()));

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

            socket.on('config', function configuration (option, value) {

                var gameID = utils.gameID(socket),
                    game = tools.cache.getGame(gameID);

                debug.emit('val', 'option', option);
                debug.emit('val', 'value', value);

                debug.emit('msg', 'player one has adjusted the configuration.');
                debug.emit('val', option, value);

                socket.broadcast.to('games/' + gameID).emit('config', option, value);
                    
            });
            
        }


        // join the socket to the chat room "gameID"
        socket.join('games/' + gameID );

        socket.emit('joined', true);

        return true;
        
    };

    debug.emit('msg', 'sockets.connection');
    // debug.emit('val',  'Sockets', Sockets);

    /**
     *  function onJoin(gameID)
     * 
     * When a socket attempts to join a game
     */
    socket.on('joinGame', joinGame);

    socket.on('joinGames', function onJoinGames () {
        socket.join('games');
    });

    /**
     *  function onDisconnect(socket)
     *
     * When a socket disconnects 
     */
    socket.on('disconnect', function disconnect () {
        debug.emit('msg', 'socket.disconnect');

        // get a working copy of the GameID--if any
        var gameID = tools.utils.gameID(socket),
            game,
            sockets;

        // debug.emit('val', 'gameID', gameID);         

        if (gameID) {

            // get a working copy of the game to which this socket was connected
            game = tools.cache.getGame(gameID);
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

        // get a working copy of the GameID--if any
        var gameID = tools.utils.gameID(socket);

        io.sockets.in('games/' + gameID).emit('chat', handle, msg);

        return true;
    });

    socket.on('gamesList', gamesList);
    
};


////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function (tools) {
    var realtime = Object.create(events.EventEmitter.prototype),
        io,
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
        },

        // create server instance
        io = socketio.listen(tools.http.server, configuration);

        io.server.on('close', function () {
            realtime.emit('closed');
        });

        /**
         *  function onConnection(socket)
         *  
         * Called each time a socket connects to the socket server.
         */
        io.sockets.on('connection', initSocket);

        realtime.emit('ready');
    };

    realtime.stop = function () {
        io.server.close();
    };

    return realtime;

};


