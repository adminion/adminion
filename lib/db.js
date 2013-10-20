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
var Games = require('../models/game')
	, Accounts = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose')
	, passport = require('passport');

// export the db factory function which is passed the configuration 
module.exports = function (config) {

	// the module itself
	db = Object.create(events.EventEmitter.prototype);

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

        // debug.val('accounts', accounts, 'lib/db.js', 41);
        // debug.val('games', games, 'lib/db.js', 42);

        db.emit('ready');
        
        return true;
    };

    db.connect = function () {
        // create an instance of the connection
        mongoose.connect(config);

        // debug.val('mongoose.connection', mongoose.connection, 'lib/db.js', 27);

        mongoose.connection.on('connecting', function () {
            debug.marker('connecting to mongodb...', 'lib/db.js', 27);
        });

        mongoose.connection.on('disconnecting', function () {
            debug.marker('disconnecting from mongodb...', 'lib/db.js', 31);
        });

        mongoose.connection.on('connected', function () {
            debug.marker('connected to mongodb!', 'lib/db.js', 35);
        })

        // if the connection has an error, output the error:
        mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

        // once the connection is open
        mongoose.connection.once('open', init);

        return true; 

    };

    db.getConnection = function () {
        return mongoose.connection;
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

    db.updateAccount = function (account, callback) {
        accounts.findByIdAndUpdate(account['_id'], account, null, callback);
    };

    db.logon = function () {
        return passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true });
    };

    db.createGame = function (game, callback) {
        var newGame = new games(game);

        newGame.save(callback);
    };

    db.getGame = function (gametID, callback) {
        games.findById(gameID, callback);
    };

    db.getGames = function (limit, skip, callback) {
        games.find(null, null, {limit: limit, skip: skip}, callback);
    };

    db.getGame = function (gameID, callback) {
        games.findById(gameID, callback);
    };

    db.getGames = function (limit,skip, callback) {
        games.find(null, null, {limit: limit, skip: skip}, callback);
    };

    db.passportInitialize = function () {
        return passport.initialize();
    };

    db.passportSession = function () {
        return passport.session();
    };

    return db;
};

