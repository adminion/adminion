
/**
 *  lib/realtime.js
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
var debug = require('debug')('adminion:transport:realtime'),
    passportSocketIo = require('passport.socketio'), 
    socketio = require('socket.io');

// adminion server modules
var config = require('../../config'),
    env = require('../../env'),
    chatNsp = require('./chat'),
    gamesNsp = require('./games'),
    utils = require('../../utils');

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
        io = socketio(http.server),
        self = this;

    io.sockets.use(passportSocketIo.authorize(authOptions))
        
    io.sockets.on('connect', socketConnect);

    games = gamesNsp(io, data, authOptions);
    chat = chatNsp(io, data, authOptions);

    data.on('update', function () {
        games.emit('list', data.games());
    });

    function socketConnect (socket) {

        var accountID = socket.request.user._id, 
            displayName = socket.request.user.displayName;

        // debug( 'socketStore', socketStore);

        socket.on('disconnect', onDisconnect);

        socket.on('message', onMessage);

        function onDisconnect () {
            // debug('socket.disconnect');

            var game,
                gameID,
                sockets;

            // get a working copy of the GameID--if any
            if (socket.gameID) {

                gameID = socket.gameID;
                
                // debug('gameID', gameID);         
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

                    // debug('game', game);
                    // msg = util.format('%s left game %s', displayName, gameID);
                    // debug(msg);
                }

                // debug('socketStore', socketStore);             
            }

            return true;
        };

        function onMessage (msg) {
           // debug(msg);

        };


    };
};

util.inherits(Adminion_realtime, events.EventEmitter);

module.exports = Adminion_realtime;
