
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
var mongoose = require('mongoose'),
    passportSocketIo = require('passport.socketio'), 
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

    var authOptions = {
            cookieParser:   http.cookieParser, 
            key:            config.session.key,
            secret:         config.session.secret, 
            store:          data.session()
        },
        games,
        io = socketio(http.server);
        socketStore = new SocketStoreage(),
        self = this;

    io.sockets.use(passportSocketIo.authorize(authOptions))
        
    io.sockets.on('connect', initSocket);

    games = io.of('/games')
    
    // setup authorization
    games.use(passportSocketIo.authorize(authOptions));

    // setup connection event
    games.on('connect', initGames);

    data.on('update', function () {
        games.emit('list', data.getGames());
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

    function initGames (socket, next) {

        debug.emit('msg', 'here I am!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

        socket.on('join', onGameJoin);

        socket.on('watch', onGamesWatch);

        function onGameChat (msg) {

            games.in(gameID).emit('chat', displayName, msg);

            return true;
        };

        

        function onGameJoin () {

            var gameID = url.parse(socket.request.headers.referer).pathname.split('/')[2],
                game,
                openSeats,
                startTimer;

            if (!gameID) {
                return new Error('invalid gameID: ' + gameID);
            }

            // get a working copy of the game
            game = data.getGame(gameID);

            // if the game is undefined
            if (!game) {
                return new Error('game not found');
            }

            if (game.register(accountID)) {
                
                socket.gameID = gameID;

                data.setGame(game);

                // tell all clients the new roster
                games.in(gameID).emit('roster', roster( game.playersConnected() ) );
                
                // tell all the other accounts that the new account entered the lobby
                games.in(gameID).emit('joined', displayName);
                // debug.emit('msg', util.format('%s entered game lobby %s', displayName, gameID));
            };

            // add socket to cache
            socketStore.add(socket);

            // greet the new socket
            socket.emit('sysMsg', util.format('Welcome, %s!', displayName));

            // send the roster to the new socket
            socket.emit('roster', roster(game.playersConnected()));


            socket.on('chat', onGameChat);


            // assign event handler for when the player says "i'm ready!"
            socket.on('player ready', onGamePlayerReady );

            // if the socket is playerOne, setup these event handlers

            if (game.isPlayerOne(accountID)) {
                socket.on('start', onGameStart);

                socket.on('kill', onGameKill);

                socket.on('config', onGameConfig);
                
            }


            // join the socket to the chat room "gameID"
            socket.join(gameID);

            socket.emit('join', true);

            function onGameConfig (option, value) {

                // debug.emit('val', 'option', option);
                // debug.emit('val', 'value', value);

                if (game.config.hasOwnProperty(option)) {

                    game.config[option] = value;

                    data.setGame(game);

                    games.in(socket.gameID).emit('config', option, value);
                    
                }

                // debug.emit('msg', 'player one has adjusted the configuration.');
                // debug.emit('val', option, value);
                    
            }

            function onGameKill (value) {

                if (value === true) {

                    data.removeGame(socket.gameID, function (err) {
                        if (err) {
                            // notify playerOne of failure
                            socket.emit('kill', false);

                            throw err;
                        } 

                        // otherwise, tell all sockets the game has been killed
                        games.in(socket.gameID).emit('kill', true);

                        data.removeGame(socket.gameID);

                    });
                }
            };

            
            function onGamePlayerReady (value) {

                var regID,
                    playerOneSockets,
                    readyPlayerSockets;

                debug.emit('msg', util.format('socket ready: %s', value));
                debug.emit('val', 'startTimer', startTimer);

                if (startTimer && !value) {
                    clearTimeout(startTimer);
                    startTimer = undefined;
                    games.in(gameID).emit('starting', false, displayName);
                }

                game.playerReady(accountID, value);

                // tell all sockets belonging to this account that they are ready (in case multiple windows are open)
                readyPlayerSockets = socketStore.byAccount(accountID);
                
                readyPlayerSockets.forEach(function (socket) {
                    socket.emit('player ready', value);
                });

                games.in(gameID).emit('roster', roster(game.playersConnected()));
                
                // debug.emit('val', 'game.playerOne', game.playerOne);

                playerOneSockets = socketStore.byAccount(game.playerOne._id);

                // debug.emit('val', 'playerOneSockets', playerOneSockets);

                if (game.ready()) {
                    // debug.emit('msg', 'all players ready!');
                
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


            function onGameStart () {

                var delay = 10000;

                if (game.allReady()) {
                    games.in(socket.gameID).emit('starting', delay);

                    // debug.emit('val', 'game', game);
                
                    startTimer = setTimeout(function startTimerCallback () {
                        // close registration and start the game...
                        game.startGame(onceGameStarted);


                    }, delay);

                    debug.emit('val', 'start timer', startTimer);
              
                }

            };
            
            return true;
        };


        function onGamesWatch () {

            debug.emit('msg', 'here I am!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            socket.emit('list', data.getGames());
        };

        function onceGameStarted (err, savedGame) {
            if (err) {
                // debug.emit('msg', 'the game was not saved!');
                throw err;
            }

            // debug.emit('val', 'savedGame', savedGame);

            // debug.emit('msg', 'the game was saved!')

            data.setGame(savedGame);

            // tell socket clients to redirect to the game ...board...?
            games.in(socket.gameID).emit('start');
            
        }

        // next();

    };


    function initSocket (socket) {

        // debug.emit('val', 'socket.user', socket.user );

        var accountID = socket.user._id, 
            displayName = socket.user.displayName;

        debug.emit('msg', 'initSocket');
        // debug.emit('val',  'socketStore', socketStore);

        socket.on('disconnect', onDisconnect);

        socket.on('message', onMessage);

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
                socket.emit('SysMsg', "Fairwell, " + displayName + "!");

                // remove the socket from cache
                socketStore.remove(socket.id);
                
                // if the account has no more sockets and the account was in the game
                if (sockets && sockets.byAccount(accountID).length === 0 && game.exitLobby(accountID)) {
                    // let all the sockets know that the user has left the lobby
                    games.in(gameID).emit('exit', displayName);

                    // roster event on the client tells whether or not 
                    games.in(gameID).emit('roster', roster(game.playersConnected()));

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


    };
};

util.inherits(Adminion_realtime, events.EventEmitter);

module.exports = Adminion_realtime;
