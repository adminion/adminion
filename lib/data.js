
// node core modules
var events = require('events'), 
    util = require('util');

var AdminionServer_db = require('./db.js'),
    connectMongo = require('connect-mongo'),
    passport = require('passport');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

function AdminionServer_data (keyRing) {

    var db,
        Accounts,
        Games,
        MongoStore,
        sessionStore,
        UPDATE_INTERVAL = keyRing.config.cacheUpdateInterval * 1000,
        self = this;

    this.start = function () {

        var updateIntervalID;

        db = new AdminionServer_db(keyRing.config.mongodb, passport);

        db.on('ready', function DbReady () {

            updateIntervalID = setInterval(function updateInterval () {

                updateCache(function () {
                    debug.emit('val', 'Accounts', Accounts);
                    debug.emit('val', 'Games', Games);

                    // and once its updated, emit 'update'
                    self.emit('update');
                    return true;
                });

                return true;
        
            }, UPDATE_INTERVAL);

            // do it now, since setting up the interval waits the given interval
            updateCache(function onceCacheUpdated () {

                // debug.emit('val', 'Accounts', Accounts);
                // debug.emit('val', 'Games', Games);

                self.emit('ready');
                return true;
            
            });
        });

        db.start();

        return true;
    };

    this.createAccount = function (newAccount, done) {
        db.createAccount(newAccount, function onceAccountCreated (err, account) {
            // add the new account to the server's cache
            self.setAccount(account);
        });
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

    this.getConnection = function () {

        return db.connection;
    }

    this.createGame = function (newGame, done) {
        db.createGame(newGame, function onceGameCreated (err, game) {
            self.setGame(game);
            done(err, game)
        });
    };

    this.setGame = function (game) { 

        Games.byID[game['_id']] = game;
      
        //debug.emit('val', 'Games', Games);
    };

    this.getGame = function (gameID) {

        //debug.emit('val', 'Games.byID[' + gameID + ']', Games.byID[gameID]);

        return Games.byID[gameID] || false;
    };

    this.getGames = function (offset, count) {
        var keys = Object.keys(Games.byID),
            games = [],
            game,
            i;

        offset = offset || 0;
        count = count || 20;

        stop = offset + count;

        if (offset >= keys.length ) {
            return Error('Err: offset out of range!');
        }

        // debug.emit('val', 'keys', keys);

        for (i = offset; i < stop; i += 1) {

            // which game?
            game = Games.byID[keys[i]];

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game);
            } else {
                // once we get a dry run, we're done.
                break;
            }
        }

        // debug.emit('val', 'games', games);
        
        return games;

    };

    this.session = function (express) {

        if (express) {

            MongoStore = connectMongo(express);

            sessionStore = new MongoStore({ mongoose_connection: db.getConnection() });
        } 

        return sessionStore;
    };

    this.passportInitialize = function () {
        return passport.initialize();
    };

    this.passportSession = function () {
        return passport.session();
    };




    this.removeGame = function (gameID) {
        delete Games.byID[gameID];

        this.emit('update');

    };

    this.logon = function () {
        return passport.authenticate('local', { 
            failureRedirect: '/logon', 
            failureFlash: true 
        });
    };

    
    this.empty = function () {
        delete Accounts, Games;

        this.emit('emptied');

    };


    function updateCache (done) {

        self.emit('updating');

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
        db.getGames( { $or: [{'status' : 'lobby'}, {'status': 'play'} ]}, null,  function onceGamesFound (err, games) {

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

            db.getAccounts( null, null, function onceAccountsFound (err, accounts) {

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

                done();

            });
        });  

        return true;

    };

};

util.inherits(AdminionServer_data, events.EventEmitter);

module.exports = AdminionServer_data;
