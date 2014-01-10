/**
 *  lib/db.js
 *
 * Adminion Database Utility
 *  - Establishes and maintains mongodb connections
 *  - Initializes mongoose data models
 *
 */


// core node modules
var events = require('events');

// Adminion modules
var Games = require('./models/game')
	, Accounts = require('./models/account');

// 3rd party modules
var mongoose = require('mongoose')
	, passport = require('passport');

// export the db factory function which is passed the configuration 
module.exports = function (config) {

	// the module itself
	db = Object.create(events.EventEmitter.prototype);

    var connection;

    var games,
        accounts;

    function init () {
        // compile Game and Account models
        games = Games(mongoose);
        accounts = Accounts(mongoose);

        // createStrategy() returns the built-in strategy
        passport.use(accounts.createStrategy());
        // serializeUser() and deserializeUser() return the functions passport will use
        passport.serializeUser(accounts.serializeUser());
        passport.deserializeUser(accounts.deserializeUser());

        // debug.emit('val', 'accounts', accounts, 'lib/db.js', 41);
        // debug.emit('val', 'games', games, 'lib/db.js', 42);

        db.emit('ready');
        
        return true;
    };

    db.connect = function () {

        // create an instance of the connection
        connection = mongoose.connection;

        // debug.emit('val', 'connection', connection, 'lib/db.js', 27);

        connection.on('connecting', function () {
            // debug.emit('marker', 'connecting to mongodb...', 'lib/db.js', 57);
        });

        connection.on('connected', function () {
            // debug.emit('marker', 'connected to mongodb!', 'lib/db.js', 65);
        });

        connection.on('disconnecting', function () {
            debug.emit('marker', 'disconnecting from mongodb...', 'lib/db.js', 61);
        });

        connection.on('disconnected', function () {
           debug.emit('marker', 'disconnected from mongodb!', 'lib/db.js', 61); 
        });

        connection.on('close', function () {
            db.emit('disconnected');
        });

        // if the connection has an error, output the error:
        connection.on('error', function () {
            console.error.bind(console, 'connection error:');
            process.exit();
        });

        // once the connection is open
        connection.once('open', init);

        mongoose.connect(config);

        return true; 
    };

    db.disconnect = function () {
        connection.close();
    };

    db.getConnection = function () {
        return connection;
    };

    /**
     * db.create (collection, conditions, limits)
     * 
     *
     *
     */

    db.createAccount = function (account, password, callback) {
        // lets do some data-integrity tests

        accounts.register(account, password, callback);


    };

    db.getAccount = function (accountID, callback) {
        accounts.findById(accountID, callback);
    };

    db.getAccounts = function (limit, skip, callback) {
        accounts.find(null, null, {limit: limit, skip: skip}, callback);

    };

    db.getAccountByEmail = function (email, callback) {
        accounts.findByUsername(email, callback);
    };

    db.updateAccount = function (account, callback) {
        accounts.findByIdAndUpdate(account['_id'], account, null, callback);
    };

    db.logon = function () {
        return passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true });
    };

    db.createGame = function (game, callback) {
        games.create(game, callback);
    };

    db.getGame = function (gametID, callback) {
        games.findById(gameID, callback);
    };

    db.getGames = function (conditions, options, callback) {
        games.find(conditions, null, options, callback);
    };

    db.getGame = function (gameID, callback) {
        games.findById(gameID, callback);
    };

    db.passportInitialize = function () {
        return passport.initialize();
    };

    db.passportSession = function () {
        return passport.session();
    };

    return db;
};

