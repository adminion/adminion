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

// 3rd party modules
var mongoose = require('mongoose')
	, passport = require('passport');

function AdminionServer_db(tools) {

	var connection,
        Games,
        Accounts,
        self = this;

    function init () {
        // compile Game and Account models
        Accounts = require('./models/account')(mongoose);
        Games = require('./models/game')(mongoose);
        // Player = mongoose.model('Player');

        // createStrategy() returns the built-in strategy
        passport.use(Accounts.createStrategy());
        // serializeUser() and deserializeUser() return the functions passport will use
        passport.serializeUser(Accounts.serializeUser());
        passport.deserializeUser(Accounts.deserializeUser());

        // debug.emit('val', 'Accounts', Accounts);
        // debug.emit('val', 'Games', Games);

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
        return connection.close();
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

        return Accounts.register(account, password, callback);


    };

    this.getAccount = function (accountID, callback) {
        return Accounts.findById(accountID, callback);
    };

    this.getAccounts = function (limit, skip, callback) {
        return Accounts.find(null, null, {limit: limit, skip: skip}, callback);

    };

    this.getAccountByEmail = function (email, callback) {
        return Accounts.findByUsername(email, callback);
    };

    this.updateAccount = function (accountID, updates, callback) {
        return Accounts.findByIdAndUpdate(accountID, updates, null, callback);
    };

    this.logon = function () {
        return passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true });
    };

    this.createGame = function (game, callback) {
        return Games.create(game, callback);
    };

    this.getGames = function (conditions, options, callback) {
        return Games.find(conditions, function (err, games) {

            var opts = { path: 'playerOne', select: 'email firstName lastName displayName accountStats'};

            Games.populate(games, opts, function (err, games) {

                if (err) {
                    throw err;
                }

                var opts = { path: 'registeredPlayers.account', select: 'email firstName lastName displayName accountStats'};

                Games.populate(games, opts, callback);

            });
        });
    };

    this.getGame = function (gameID, callback) {
        return Games.findById(gameID, function (err, game) {
            var opts = { path: 'playerOne', select: 'email firstName lastName displayName accountStats'};

            Games.populate(game, opts, function (err, game) {

                if (err) {
                    throw err;
                }

                var opts = { path: 'registeredPlayers.account', select: 'email firstName lastName displayName accountStats'};

                Games.populate(game, opts, callback);
            });
        });
    };

    this.passportInitialize = function () {
        return passport.initialize();
    };

    this.passportSession = function () {
        return passport.session();
    };

    this.removeGame = function (gameID, callback) {
        return Games.remove({ '_id' : gameID}, callback);
    };

};

util.inherits(AdminionServer_db, events.EventEmitter);

module.exports = AdminionServer_db;

