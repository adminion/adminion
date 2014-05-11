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
var mongoose = require('mongoose');

// adminion server modules
var config = require('../config');

function Adminion_db(passport) {

    var Accounts,
        Games,
        self = this;


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

        mongoose.connect(config.mongodb);

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

    this.createAccount = function (account, password, done) {
        return Accounts.register(account, password, done);
    };

    this.getAccount = function (accountID, done) {
        return Accounts.findById(accountID, done);
    };

    this.getAccounts = function (limit, skip, done) {
        return Accounts.find(null, null, {limit: limit, skip: skip}, done);
    };

    this.getAccountByEmail = function (email, done) {
        return Accounts.findByUsername(email, done);
    };

    this.updateAccount = function (accountID, updates, done) {
        return Accounts.findByIdAndUpdate(accountID, updates, null, done);
    };

    this.createGame = function (game, done) {
        return Games.create(game, function onceGameCreated (err, game) {
            if (err) { 
                throw err;
                // errorHandler(err, request, response);
            } else {
                // debug.emit('val', 'game', game);

                game.populate('playerOne', done);
            }
        });
    };

    this.getGames = function (conditions, options, done) {
        return Games.find(conditions, function (err, games) {

            var opts = { path: 'playerOne', select: 'email firstName lastName displayName accountStats'};

            Games.populate(games, opts, function (err, games) {

                if (err) {
                    throw err;
                }

                var opts = { path: 'registeredPlayers.account', select: 'email firstName lastName displayName accountStats'};

                Games.populate(games, opts, done);

            });
        });
    };

    this.getGame = function (gameID, done) {
        return Games.findById(gameID, function (err, game) {
            var opts = { path: 'playerOne', select: 'email firstName lastName displayName accountStats'};

            Games.populate(game, opts, function (err, game) {

                if (err) {
                    throw err;
                }

                var opts = { path: 'registeredPlayers.account', select: 'email firstName lastName displayName accountStats'};

                Games.populate(game, opts, done);
            });
        });
    };

    this.removeGame = function (gameID, done) {
        return Games.remove({ '_id' : gameID}, done);
    };

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

};

util.inherits(Adminion_db, events.EventEmitter);

module.exports = Adminion_db;

