/**
 *  lib/db.js
 *
 * Adminion Database Utility
 *  - Establishes and maintains mongodb connections
 *  - Initializes mongoose data models
 *
 */


// core node modules
var events = require('events'),
    util = require('util');

// Adminion modules
var Games = require('./models/game')
	, Accounts = require('./models/account');

// 3rd party modules
var mongoose = require('mongoose')
	, passport = require('passport');

function AdminionServer_db(tools) {

	var connection,
        games,
        accounts,
        self = this;

    function init () {
        // compile Game and Account models
        games = Games(mongoose);
        accounts = Accounts(mongoose);

        // createStrategy() returns the built-in strategy
        passport.use(accounts.createStrategy());
        // serializeUser() and deserializeUser() return the functions passport will use
        passport.serializeUser(accounts.serializeUser());
        passport.deserializeUser(accounts.deserializeUser());

        // debug.emit('val', 'accounts', accounts);
        // debug.emit('val', 'games', games);

        self.emit('ready');
        
        return true;
    };

    this.start = function () {

        // create an instance of the connection
        connection = mongoose.connection;

        // debug.emit('val', 'connection', connection);

        connection.on('connecting', function () {
            // debug.emit('msg', 'connecting to mongodb...');
        });

        connection.on('connected', function () {
            // debug.emit('msg', 'connected to mongodb!');
            self.emit('connected');
        });

        connection.on('disconnecting', function () {
            // debug.emit('msg', 'disconnecting from mongodb...');
        });

        connection.on('disconnected', function () {
           debug.emit('msg', 'disconnected from mongodb!'); 
        });

        connection.on('close', function () {
            self.emit('disconnected');
        });

        // if the connection has an error, output the error:
        connection.on('error', function () {
            console.error.bind(console, 'connection error:');
            process.exit();
        });

        // once the connection is open
        connection.once('open', init);

        mongoose.connect(tools.config.mongodb);

        return true; 
    };

    this.disconnect = function () {
        connection.close();
    };

    this.getConnection = function () {
        return connection;
    };

    /**
     * db.create (collection, conditions, limits)
     * 
     *
     *
     */

    this.createAccount = function (account, password, callback) {
        // lets do some data-integrity tests

        accounts.register(account, password, callback);


    };

    this.getAccount = function (accountID, callback) {
        accounts.findById(accountID, callback);
    };

    this.getAccounts = function (limit, skip, callback) {
        accounts.find(null, null, {limit: limit, skip: skip}, callback);

    };

    this.getAccountByEmail = function (email, callback) {
        accounts.findByUsername(email, callback);
    };

    this.updateAccount = function (account, callback) {
        accounts.findByIdAndUpdate(account['_id'], account, null, callback);
    };

    this.logon = function () {
        return passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true });
    };

    this.createGame = function (game, callback) {
        games.create(game, callback);
    };

    this.getGame = function (gametID, callback) {
        games.findById(gameID, callback);
    };

    this.getGames = function (conditions, options, callback) {
        games.find(conditions, null, options, callback);
    };

    this.getGame = function (gameID, callback) {
        games.findById(gameID, callback);
    };

    this.passportInitialize = function () {
        return passport.initialize();
    };

    this.passportSession = function () {
        return passport.session();
    };

};

util.inherits(AdminionServer_db, events.EventEmitter);

module.exports = AdminionServer_db;

