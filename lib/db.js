
// core node modules
var events = require('events');

// Adminion modules
var Games = require('../models/game')
	, Accounts = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose')
	, passport = require('passport');

// export the db factory function which is passed adminion
module.exports = function (adminion) {

	// the module itself
	db = Object.create(events.EventEmitter.prototype);

    var games,
        accounts;

    db.connect = function () {
        // create an instance of the connection
        mongoose.connect(adminion.config.mongodb);

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
        mongoose.connection.once('open', function () {
            // compile Game and Account models
            games = Games(mongoose);
            accounts = Accounts(mongoose);

            // createStrategy() returns the pre-built strategy
            passport.use(accounts.createStrategy());
            // serializeUser() and deserializeUser() return the functions passport will use
            passport.serializeUser(accounts.serializeUser());
            passport.deserializeUser(accounts.deserializeUser());

            // debug.val('accounts', accounts, 'lib/db.js', 41);
            // debug.val('games', games, 'lib/db.js', 42);

            db.emit('ready');
        });

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
        accounts.register(account, password, callback);
    };

    db.updateAccount = function (account, password, callback) {

        
    };

    db.createGame = function (game, callback) {

    };

    db.passportInitialize = function () {
        return passport.initialize();
    };

    db.passportSession = function () {
        return passport.session();
    };

    return db;
};

