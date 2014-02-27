
// node core modules
var events = require('events'), 
    util = require('util');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

function AdminionServer_cache (tools) {
    var Accounts,
        Games,
        UPDATE_INTERVAL = tools.config.cacheUpdateInterval * 1000,
        updateIntervalID
        self = this;

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
        tools.modules.db.getGames( { $or: [{'status' : 'lobby'}, {'status': 'play'} ]}, null,  function onceGamesFound (err, games) {

            var game, 
                index;

            if (err) {
                throw err;
            }

            // debug.emit('val', 'games', games);

            for (index in games) {
                game = games[index];

                self.setGame(game);
            }

            // debug.emit('val', 'Games', Games);

            tools.modules.db.getAccounts( null, null, function onceAccountsFound (err, accounts) {

                var account, 
                    accountID, 
                    index;

                if (err) {
                    throw err;
                }

                // debug.emit('val', 'accounts', accounts);

                for (index in accounts) {
                    account = accounts[index];
                    
                    self.setAccount(account);
                }

                // debug.emit('val', 'Accounts', Accounts);

                // debug.emit('msg', '...cache updated');

                self.emit('updated');

                callback();

            });
        });  

        return true;

    };

    this.setAccount = function (account) {

        var accountID = account['_id'],
            email = account.email;

        Accounts.byID[accountID] = account;
        Accounts.byEmail[email] = account;

        //debug.emit('val', 'Accounts', Accounts);

        this.emit('update');

        return true;

    };

    this.getAccount = function (accountID) {

        // debug.emit('val', 'Accounts.byID', Accounts.byID);

        return Accounts.byID[accountID] || false;
    };

    this.getAccountByEmail = function (email) {
        return Accounts.byEmail[email] || false;
    }

    this.getAccounts = function () {
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

    this.setGame = function (game) { 
        Games.byID[game['_id']] = game;

        this.emit('update');
      
        //debug.emit('val', 'Games', Games);
    };

    this.getGame = function (gameID) {

        //debug.emit('val', 'Games.byID[' + gameID + ']', Games.byID[gameID]);

        return Games.byID[gameID] || false;
    };

    this.getGames = function () {
        var keys = Object.keys(Games.byID),
            games = [],
            game,
            i;

        // debug.emit('val', 'keys', keys);

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

    };

    this.removeGame = function (gameID) {
        delete Games.byID[gameID];

        this.emit('update');

    };

    this.start = function () {

        this.emit('updating');

        // first things first, update the cache
        updateCache(function onceCacheUpdated () {

            if (updateIntervalID !== undefined) {
                clearInterval(updateIntervalID);
            }

            // once cache is up-to-date, every interval..
            updateIntervalID = setInterval(function updateInterval () {

                // update the cache
                updateCache(function () {
                    debug.emit('val', 'Accounts', Accounts);
                    debug.emit('val', 'Games', Games);

                    // and once its updated, emit the updated event
                    self.emit('update');
                    return true;
                });

                return true;
        
            }, UPDATE_INTERVAL);

            // debug.emit('val', 'Accounts', Accounts);
            // debug.emit('val', 'Games', Games);

            self.emit('ready');
            return true;
        
        });

        return true;
    };

    this.empty = function () {
        delete Accounts, Games;

        this.emit('emptied');

    }

};

util.inherits(AdminionServer_cache, events.EventEmitter);

module.exports = AdminionServer_cache;