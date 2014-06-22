
// node core modules
var events = require('events'), 
    util = require('util');

// 3rd party modules
var debug = require('debug')('adminion:data')

// adminion server modules
var Adminion_db = require('./db.js'),
    config = require('../config'),
    env = require('../env'),
    connectMongo = require('connect-mongo'),
    passport = require('passport'),
    socketStore = new require('./models/socket');

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

    this.sockets = socketStore();

    this.connection = function () {

        return db.connection;
    };

    this.start = function () {

        var updateInterval;

        db = new Adminion_db(passport);

        db.on('ready', function DbReady () {
            // update now
            self.updateCache(function onceCacheUpdated () {

                // debug('Accounts', Accounts);
                // debug('Games', Games);

                self.emit('ready');
                return true;
            
            });

            // scheduling an interval waits that interval prior to first run
            updateInterval = setInterval(function () {

                self.updateCache(function () {
                    debug('Accounts', Accounts);
                    debug('Games', Games);

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

    this.accounts = function () {
        var keys = Object.keys(Accounts.byID),
            accounts = [],
            account,
            i;

        //debug('keys', keys);

        for (i = 0, len = keys.length; i < len; i += 1) {

            // which account?
            account = Accounts.byID[keys[i]];

            if (!!account) {
                // add to the accounts array the Account whose key is at index i
                accounts.push(account);
            }
        }

        // debug('accounts', accounts);
        
        return accounts;
    };

    this.accounts.create = function (newAccount, password, done) {
        db.createAccount(newAccount, password, function onceAccountCreated (err, account) {
            // add the new account to the server's cache

            debug('account', account);
            
            self.accounts.set(account);

            done(err, account);
        });
    }

    this.accounts.set = function (account) {

        db.updateAccount(account._id, account, function () {
            var accountID = account._id,
                email = account.email;

            Accounts.byID[accountID] = account;
            Accounts.byEmail[email] = account;
            
        });


        //debug('Accounts', Accounts);

        return true;

    };

    this.accounts.byID =function (accountID) {

        // debug('Accounts.byID', Accounts.byID);

        return Accounts.byID[accountID] || false;
    };

    this.accounts.byEmail = function (email) {
        return Accounts;
    };


    this.games = function (offset, count) {
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

        debug('keys', keys);

        for (i = offset; i < stop; i += 1) {

            // which game?
            game = Games.byID[keys[i]];

            debug('game', game);

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game.toObject());
            } else {
                // once we get a dry run, we're done.
                debug('games', games);
                
                return games;
            }
        }

    };

    this.games.create = function (newGame, done) {
        db.createGame(newGame, function onceGameCreated (err, game) {
            game.regis
            self.games.set(game);
            self.emit('update');
            done(err, game)
        });
    };

    this.games.set = function (game) { 

        Games.byID[game['_id']] = game;
      
        //debug('Games', Games);
    };

    this.games.byID = function (gameID) {

        //debug('Games.byID[' + gameID + ']', Games.byID[gameID]);

        return Games.byID[gameID] || false;
    },

    this.games.remove = function (gameID) {
        delete Games.byID[gameID];

        self.emit('update');

    },

    this.passport = {
        initialize : function () {
            return passport.initialize();
        },

        session : function () {
            return passport.session();
        },

        authenticate : function () {
            return passport.authenticate('local', { 
                failureRedirect: '/logon', 
                failureFlash: 'Invalid username or password.'        
            });
        }
    };

    this.session = function (expressSession) {

        if (expressSession) {

            MongoStore = connectMongo(expressSession);

            sessionStore = new MongoStore({ mongoose_connection: db.getConnection() });
        } 

        return sessionStore;
    };
    
    this.empty = function () {
        Accounts = Games = undefined;

        this.emit('emptied');

    };


    this.updateCache = function (done) {

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

            // debug('games', games);

            for (index in games) {
                game = games[index];

                self.games.set(game);
            }

            // debug('Games', Games);

            db.getAccounts( null, null, function onceAccountsFound (err, accounts) {

                var account, 
                    accountID, 
                    index;

                if (err) {
                    throw err;
                }

                // debug('accounts', accounts);

                for (index in accounts) {
                    account = accounts[index];
                    
                    self.accounts.set(account);
                }

                // debug('Accounts', Accounts);

                // debug('...cache updated');

                self.emit('update');

                done();

            });
        });  

        return true;

    };

};

util.inherits(Adminion_data, events.EventEmitter);

module.exports = Adminion_data;
