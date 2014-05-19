
// node core modules
var events = require('events'), 
    util = require('util');

// adminion server modules
var Adminion_db = require('./db.js'),
    config = require('../config'),
    env = require('../env'),
    connectMongo = require('connect-mongo'),
    passport = require('passport');

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

function Adminion_data () {

    var db,
        Accounts,
        Games,
        MongoStore,
        sessionStore,
        UPDATE_INTERVAL = config.cacheUpdateInterval,
        self = this;

    this.start = function () {

        var updateInterval;

        db = new Adminion_db(passport);

        db.on('ready', function DbReady () {
            // update now
            updateCache(function onceCacheUpdated () {

                // debug.emit('val', 'Accounts', Accounts);
                // debug.emit('val', 'Games', Games);

                self.emit('ready');
                return true;
            
            });

            // scheduling an interval waits that interval prior to first run
            updateInterval = setInterval(function () {

                updateCache(function () {
                    debug.emit('val', 'Accounts', Accounts);
                    debug.emit('val', 'Games', Games);

                    // and once its updated, emit 'update'
                    self.emit('update');
                    return true;
                });

                return true;
        
            }, UPDATE_INTERVAL);

            updateInterval.unref();

        });

        db.start();

        return true;
    };

    this.createAccount = function (newAccount, password, done) {
        db.createAccount(newAccount, password, function onceAccountCreated (err, account) {
            // add the new account to the server's cache

            debug.emit('val', 'account', account);
            
            self.setAccount(account);
            done(err, account);
        });
    };


    this.setAccount = function (account) {

        var accountID = account['_id'],
            email = account.email;

        Accounts.byID[accountID] = account;
        Accounts.byEmail[email] = account;

        //debug.emit('val', 'Accounts', Accounts);

        // process.send({'setAccount': {_id:});

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

        if (keys.length === 0) {
            return games;
        }

        offset = offset || 0;
        count = count || 20;

        if (offset >= keys.length ) {
            return Error('Err: offset out of range!');
        }

        stop = offset + count;

        debug.emit('val', 'keys', keys);

        for (i = offset; i < stop; i += 1) {

            // which game?
            game = Games.byID[keys[i]];

            debug.emit('val', 'game', game);

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game.toObject());
            } else {
                // once we get a dry run, we're done.
                debug.emit('val', 'games', games);
                
                return games;
            }
        }


    };

    this.session = function (expressSession) {

        if (expressSession) {

            MongoStore = connectMongo(expressSession);

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

    this.authenticate = function () {
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

util.inherits(Adminion_data, events.EventEmitter);

module.exports = Adminion_data;
