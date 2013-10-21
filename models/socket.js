
var util = require('../lib/util');

module.exports = function () {
    var sockets = Object.create(null);

    // the raw list of sockets
    var raw = [];

    // quick reference arrays
    var byID        = {}
        , byGame    = {}
        , byAccount     = {}

    Object.defineProperty(byGame, 'length', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function () {
            var count = 0;

            for ( i in this ) {
                if (this[i] !== undefined) {
                    count +=1;
                }
            }

            return count;
        }
    });

    Object.defineProperty(byAccount, 'length', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function () {
            var count = 0;

            for ( i in this ) {
                if (this[i] !== undefined) {
                    count +=1;
                }
            }

            return count;
        }
    });

    sockets.initAccount = function (accountID) {
        if (byAccount[accountID] === undefined) {
            byAccount[accountID] = [];

            Object.defineProperty(byAccount[accountID], 'byGame', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: function (gameID) {
                    var inGame = [];
                    var socket;

                    for ( var i = 0; i < byAccount[accountID].length; i +=1) {
                        socket = byAccount[accountID][i];

                        if (util.gameID(socket).toString() === gameID.toString()) {
                            inGame.push(socket); 
                        }
                    }

                    return inGame;
                }
            });
        }
    };

    sockets.initGame = function (gameID) {
        if (byGame[gameID] === undefined) {
            byGame[gameID] = [];

            // declare byAccount method to get sockets belonging to one player
            Object.defineProperty(byGame[gameID], 'byAccount', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: function (accountID) {
                    var belongToAccount = [];
                    var socket;

                    for ( var i = 0; i < byGame[gameID].length; i+=1) {
                        socket = byGame[gameID][i];

                        if (util.accountID(socket).toString() === accountID.toString()) {
                            belongToAccount.push(socket);
                        }
                    }

                    return belongToAccount;
                }
            });
        }   
    };

    // public method for caching a socket
    sockets.add = function (socket) {

        debug.msg('adding socket ' + socket.id, 'models/socket.js', 50);

        // add the socket to the list and make note of its current index
        var which = raw.push(socket) -1;
        var gameID = util.gameID(socket);
        var accountID = util.accountID(socket);

        // create references to the stored socket
        byID[socket.id] = raw[which];

        if (byGame[gameID] === undefined ) {
            sockets.initGame(gameID);
        }

        byGame[gameID].push(raw[which]);
        byAccount[accountID].push(raw[which]);

        debug.val('raw', raw, 'models/socket.js', 49);
        debug.val('byID', byID, 'models/socket.js', 50);
        debug.val('byGame', byGame, 'models/socket.js', 51);
        debug.val('byAccount', byAccount, 'models/socket.js', 52);

        return raw.length;

    };

    // public method for removing a socket from cache
    sockets.remove = function (socketID) {

        debug.val('raw', raw, 'models/socket.js', 85);
        debug.val('byID', byID, 'models/socket.js', 86);
        debug.val('byGame', byGame, 'models/socket.js', 87);
        debug.val('byAccount', byAccount, 'models/socket.js', 88);

        debug.msg('removing socket ' + socketID, 'models/socket.js', 90);

        var socket; 
        var which;
        
        debug.msg(raw.length + (raw.length === 1) ? " socket" : " sockets", 'models/socket.js', 95);

        // determine at which index this socket is hanging out
        for (var i = 0; i < raw.length; i+=1) {
            console.log(i)
            // when we find it
            if (raw[i].id === socketID) {
                // save the index and stop searching
                which = i;
                socket = raw[i];
                console.log('socket stored at index ' + i);
                break;
            }
        }

        if (socket === undefined) {
            return false;
        }

        // get details for readability
        var socketID = socket.id;
        var gameID = util.gameID(socket);
        var accountID = util.accountID(socket);

        // delete references to the stored socket...
        delete byID[socketID];

        // search for this socket in the byGame array
        for (var i = 0; i < byGame[gameID].length; i+=1) {
            // when we find it
            if (byGame[gameID][i].id === socketID) {
                // remove the socket from the list and stop searching
                byGame[gameID].splice(i,1);
                break;
            }
        }

        // for this socket in the byAccount array
        for (var i = 0; i < byAccount[accountID].length; i+=1) {

            debug.val('byAccount[accountID]', byAccount[accountID], 'models/sockets.js', 140);

            // when we find it
            if (byAccount[accountID][i].id === socketID) {
                // delete the index and stop searching
                byAccount[accountID].splice(i,1);;
                break;
            }
        }

        // if there are no more sockets in this game, delete the list 
        if (byAccount[accountID].length === 0) {
            delete byAccount[accountID];
        }       

        // now finally delete the socket itself
        raw.splice(which,1);

        debug.val('raw', raw, 'models/socket.js', 153);
        debug.val('byID', byID, 'models/socket.js', 154);
        debug.val('byGame', byGame, 'models/socket.js', 155);
        debug.val('byAccount', byAccount, 'models/socket.js', 156);

        return raw.length;
    };


    // public method for returning sockets indexed by their ID
    sockets.byID = function (socketID) {
        return byID[socketID];
    };

    // public method for returning all sockets belonging to the specified Account
    sockets.byAccount = function (accountID) {
        
        return byAccount[accountID] || false;
    };

    // public method for returning sockets connected to the Game with the given id
    sockets.byGame = function (gameID) {
        
        return byGame[gameID] || false;
    };

    // debug.val('raw', Sockets, 'models/socket.js', 236);
    // debug.val('byID', byID, 'models/socket.js', 237);
    // debug.val('byGame', byGame, 'models/socket.js', 238);
    // debug.val('byAccount', byAccount, 'models/socket.js', 239);

    return sockets

};