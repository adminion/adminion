
// node core modules
var events = require('events')
    , util = require('util');



////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function (adminion) {
    var cache = Object.create(events.EventEmitter.prototype);

    cache.getAccount = function (accountID) {
        return Accounts[accountID] || false;
    };

    cache.getAccounts = function (offset, count) {
        offset = Number(offset) || 0;
        count = Number(count) || 20;

        var keys = Object.keys(Accounts);
        var accounts = [];
        var account;

        debug.val('keys', keys, 'lib/cache', 231);

        for (var i = offset; i < offset + count; i += 1) {

            // which account?
            account = Accounts[keys[i]];

            if (!!account) {
                // add to the accounts array the Account whose key is at index i
                accounts.push(account);
                debug.val('accounts', accounts, 'lib/cache', 236);
            }
        }

        return accounts;
    };

    cache.getGame = function (gameID) {
        return Games[gameID] || false;
    };

    cache.getGames = function (offset, count) {
        offset = Number(offset) || 0;
        count = Number(count) || 20;

        var keys = Object.keys(Games);
        var games = [];
        var game;

        debug.val('keys', keys, 'lib/cache', 231);

        for (var i = offset; i < offset + count; i += 1) {

            // which game?
            game = Games[keys[i]];

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game);
                debug.val('games', games, 'lib/cache', 236);
            }
        }

        return games;

    }

    cache.logon = function (account) {

        Accounts[account['_id']] = account;

        debug.val('Accounts', Accounts, 'lib/cache.js', 224);
    });

    cache.logoff = function (account) {
        delete Accounts[account['_id']];
        debug.val('Accounts', Accounts, 'lib/cache.js', 229);
    });

    cache.createGame = function (game) { 
        Games[game['_id']] = game;

        debug.val('Games', Games, 'lib/cache.js', 252);
    });

    cache.deleteGame = function (gameID) {
        delete (Games[gameID]);
        debug.val('Games', Games, 'lib/cache.js', 257);
    });

    cache.addSocket = function (socket) {
        Sockets.add(socket)

    });

    // fill the cache with all active games when the server starts
    // load all the games with status 'lobby' or 'play' into memory
    adminion.db.games.find( { $or: [{'status' : 'lobby'}, {'status': 'play'} ]}, function (err, games) {

        if (err) {
            throw err;
        }

        debug.val('games', games, 'lib/cache', 239);

        var game
            , gameID
            , index;

        for (index in games) {
            game = games[index];
            gameID = game['_id'];
            Games[gameID] = game;
            Sockets.initGame(gameID);
        }

        // debug.val('Games', Games, 'lib/cache.js', 252);

        adminion.db.accounts.find( null, function (err, accounts) {

            if (err) {
                throw err;
            }

            var account
                , accountID
                , index;

            for (index in accounts) {
                account = accounts[index];
                accountID = account['_id'];
                Accounts[accountID] = account;
                Sockets.initAccount(accountID);
            }

            // debug.val('Accounts', Accounts, 'lib/cache.js', 272);

            cache.emit('ready');
        });
    });  

    return cache;

};