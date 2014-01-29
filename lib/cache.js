
// node core modules
var events = require('events'), 
    util = require('util');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function (tools) {
    var cache = Object.create(events.EventEmitter.prototype),
        Accounts,
        Games,
        UPDATE_INTERVAL = tools.config.cacheUpdateInterval,
        updateIntervalID;

    function updateCache (callback) {

        // debug.emit('msg', 'updating cache...');

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

            var game, 
                index;

            if (err) {
                throw err;
            }

            //debug.emit('val', 'games', games);

            for (index in games) {
                game = games[index];

                cache.setGame(game);
            }

            // debug.emit('val', 'Games', Games);

            tools.db.getAccounts( null, null, function (err, accounts) {

                var account, 
                    accountID, 
                    index;

                if (err) {
                    throw err;
                }

                // debug.emit('val', 'accounts', accounts);

                for (index in accounts) {
                    account = accounts[index];
                    
                    cache.setAccount(account);
                }

                // debug.emit('val', 'Accounts', Accounts);

                // debug.emit('msg', '...cache updated');

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

        //debug.emit('val', 'Accounts', Accounts);

        return true;

    };

    cache.getAccount = function (accountID) {

        // debug.emit('val', 'Accounts.byID', Accounts.byID);

        return Accounts.byID[accountID] || false;
    };

    cache.getAccountByEmail = function (email) {
        return Accounts.byEmail[email] || false;
    }

    cache.getAccounts = function () {
        var keys = Object.keys(Accounts.byID),
            accounts = [],
            account,
            i;

        //debug.emit('val', 'keys', keys);

        for (i = 0, len = keys.length; i < len; i += 1) {

            // which account?
            account = Accounts.byID[keys[i]];

            if (!!account) {
                // add to the accounts array the Account whose key is at index i
                accounts.push(account);
            }
        }

        // debug.emit('val', 'accounts', accounts);
        
        return accounts;
    };

    cache.setGame = function (game) { 
        var gameID = game['_id'],
            playerOne = game.playerOne.accountID;

        Games.byID[gameID] = game;
        Games.byPlayerOne[playerOne] = game;

        //debug.emit('val', 'Games', Games);
    };

    cache.getGame = function (gameID) {

        //debug.emit('val', 'Games.byID[' + gameID + ']', Games.byID[gameID]);

        return Games.byID[gameID] || false;
    };

    cache.getGames = function () {
        var keys = Object.keys(Games.byID),
            games = [],
            game,
            i;

        debug.emit('val', 'keys', keys);

        for (i = 0, len = keys.length; i < len; i += 1) {

            // which game?
            game = Games.byID[keys[i]];

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game);
            }
        }

        // debug.emit('val', 'games', games);
        
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
                updateCache(function () {
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