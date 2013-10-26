
var util = require('../util');

module.exports = function () {
    var sockets = Object.create(null);

    // quick reference arrays
    var byID        = {}, 
        byGame    = {}, 
        byAccount     = {};

    function length () {
        var count = 0;

        for ( i in this ) {
            if (this[i] !== undefined) {
                count +=1;
            }
        }

        return count;
    };

    Object.defineProperty(byID, 'length', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: length
    });

    Object.defineProperty(byGame, 'length', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: length
    });

    Object.defineProperty(byAccount, 'length', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: length
    });

    function initAccount (accountID) {
        if (byAccount[accountID] === undefined) {
            byAccount[accountID] = [];

            Object.defineProperty(byAccount[accountID], 'byGame', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: function (gameID) {
                    var inGame = [];
                    var socket;

                    for ( var i = 0; i < this.length; i +=1) {
                        socket = this[i];

                        if (util.gameID(socket).toString() === gameID.toString()) {
                            inGame.push(socket); 
                        }
                    }

                    return inGame;
                }
            });
        }
    };

    function initGame (gameID) {
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

                    for ( var i = 0; i < this.length; i+=1) {
                        socket = this[i];

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

        debug.emit('msg', 'adding socket ' + socket.id, 'models/socket.js', 50);

        var accountID = util.accountID(socket);
        var gameID = util.gameID(socket);

        // create references to the stored socket
        byID[socket.id] = socket;

        if (byGame[gameID] === undefined ) {
            initGame(gameID);
        }

        if (byAccount[accountID] === undefined ) {
            initAccount(accountID);
        }

        byAccount[accountID].push(socket);
        byGame[gameID].push(socket);

        debug.emit('val', 'byID', byID, 'models/socket.js', 50);
        debug.emit('val', 'byGame', byGame, 'models/socket.js', 51);
        debug.emit('val', 'byAccount', byAccount, 'models/socket.js', 52);

        return byID.length;

    };

    // public method for removing a socket from cache
    sockets.remove = function (socketID) {

        debug.emit('val', 'byID', byID, 'models/socket.js', 86);
        debug.emit('val', 'byGame', byGame, 'models/socket.js', 87);
        debug.emit('val', 'byAccount', byAccount, 'models/socket.js', 88);

        debug.emit('msg', 'removing socket ' + socketID, 'models/socket.js', 90);

        var socket = byID[socketID];

        if (socket === undefined) {
            return false;
        }

        // get details for readability
        var socketID = socket.id;
        var gameID = util.gameID(socket);
        var accountID = util.accountID(socket);

        // delete references to the stored socket...
        delete byID[socketID];

        // for this socket in the byAccount array
        for (var i = 0; i < byAccount[accountID].length; i+=1) {

            debug.emit('val', 'byAccount[accountID]', byAccount[accountID], 'models/sockets.js', 140);

            // when we find it
            if (byAccount[accountID][i].id === socketID) {
                // delete the index and stop searching
                byAccount[accountID].splice(i,1);;
                break;
            }
        }

        // if this user has no more sockets in this game, delete their list 
        if (byAccount[accountID].length === 0) {
            delete byAccount[accountID];
        }

        // search for this socket in the byGame array
        for (var i = 0; i < byGame[gameID].length; i+=1) {
            // when we find it
            if (byGame[gameID][i].id === socketID) {
                // remove the socket from the list and stop searching
                byGame[gameID].splice(i,1);
                break;
            }
        }

        // if there are no more sockets connected to this game, delete the list
        //if (byGame[gameID].length === 0) {
        //    delete byGame[gameID];
        //}

        debug.emit('val', 'byID', byID, 'models/socket.js', 154);
        debug.emit('val', 'byAccount', byAccount, 'models/socket.js', 156);
        debug.emit('val', 'byGame', byGame, 'models/socket.js', 155);

        return byID.length;
    };


    // public method for returning sockets indexed by their ID
    sockets.byID = function (socketID) {
        return byID[socketID] || false;
    };

    // public method for returning all sockets belonging to the specified Account
    sockets.byAccount = function (accountID) {
        
        return byAccount[accountID] || false;
    };

    // public method for returning sockets connected to the Game with the given id
    sockets.byGame = function (gameID) {
        
        return byGame[gameID] || false;
    };

    // debug.emit('val', 'byID', byID, 'models/socket.js', 237);
    // debug.emit('val', 'byGame', byGame, 'models/socket.js', 238);
    // debug.emit('val', 'byAccount', byAccount, 'models/socket.js', 239);

    return sockets

};