
// node core modules
var events = require('events')
    , util = require('util');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function (tools) {
    var cache = Object.create(events.EventEmitter.prototype);

    var Accounts,
        Games;

    // 5 minutes
    var UPDATE_INTERVAL = tools.config.cacheUpdateInterval,
        updateIntervalID;

    function updateCache (callback) {

        // debug.emit('marker', 'updating cache...', 'lib/cache', 25);

        Accounts = { 
            byID : {},
            byEmail :{}
        };

        Games = {
            byID : {},
            byPlayerOne : {}
        };

        // fill the cache with all active games when the server starts
        // load all the games with status 'lobby' or 'play' into memory
        tools.db.getGames( { $or: [{'status' : 'lobby'}, {'status': 'play'} ]}, null,  function (err, games) {

            if (err) {
                throw err;
            }

            //debug.emit('val', 'games', games, 'lib/cache', 44);

            var game
                , index;

            for (index in games) {
                game = games[index];

                cache.setGame(game);
            }

            // debug.emit('val', 'Games', Games, 'lib/cache.js', 55);

            tools.db.getAccounts( null, null, function (err, accounts) {

                if (err) {
                    throw err;
                }

                // debug.emit('val', 'accounts', accounts, 'lib/cache', 63);

                var account
                    , accountID
                    , index;

                for (index in accounts) {
                    account = accounts[index];
                    
                    cache.setAccount(account);
                }

                // debug.emit('val', 'Accounts', Accounts, 'lib/cache.js', 75);

                // debug.emit('marker', '...cache updated', 'lib/cache', 77);

                callback();

            });
        });  

        return true;

    };

    cache.setAccount = function (account) {

        var accountID = account['_id'],
            email = account.email;

        Accounts.byID[accountID] = account;
        Accounts.byEmail[email] = account;

        //debug.emit('val', 'Accounts', Accounts, 'lib/cache', 97);

        return true;

    };

    cache.getAccount = function (accountID) {

        // debug.emit('val', 'Accounts.byID', Accounts.byID, 'lib/cache', 104);

        return Accounts.byID[accountID] || false;
    };

    cache.getAccountByEmail = function (email) {
        return Accounts.byEmail[email] || false;
    }

    cache.getAccounts = function () {
        var keys = Object.keys(Accounts.byID);
        var accounts = [];
        var account;

        //debug.emit('val', 'keys', keys, 'lib/cache', 121);

        for (var i = 0; i < keys.length; i += 1) {

            // which account?
            account = Accounts.byID[keys[i]];

            if (!!account) {
                // add to the accounts array the Account whose key is at index i
                accounts.push(account);
            }
        }

        // debug.emit('val', 'accounts', accounts, 'lib/cache', 131);
        
        return accounts;
    };

    cache.setGame = function (game) { 
        var gameID = game['_id'],
            playerOne = game.playerOne.accountID;

        Games.byID[gameID] = game;
        Games.byPlayerOne[playerOne] = game;

        //debug.emit('val', 'Games', Games, 'lib/cache.js', 145);
    };

    cache.getGame = function (gameID) {

        //debug.emit('val', 'Games.byID[' + gameID + ']', Games.byID[gameID], 'lib/cache', 150);

        return Games.byID[gameID] || false;
    };

    cache.getGames = function () {
        var keys = Object.keys(Games.byID);
        var games = [];
        var game;

        debug.emit('val', 'keys', keys, 'lib/cache', 160);

        for (var i = 0; i < keys.length; i += 1) {

            // which game?
            game = Games.byID[keys[i]];

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game);
            }
        }

        // debug.emit('val', 'games', games, 'lib/cache', 170);
        
        return games;

    }

    cache.init = function () {

        // first things first, update the cache
        updateCache(function() {

            if (updateIntervalID !== undefined) {
                clearInterval(updateIntervalID);
            }

            // once cache is up-to-date, every interval..
            updateIntervalID = setInterval(function () {

                // update the cache
                updateCache(function() {
                    // and once its updated, emit the updated event
                    cache.emit('cacheUpdated');
                    return true;
                });

                return true;
        
            }, UPDATE_INTERVAL);

            cache.emit('ready');
            return true;
        
        });

        return true;
    };

    cache.empty = function () {
        delete Accounts, Games;

        cache.emit('emptied');
    }

    return cache;
};