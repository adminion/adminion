/**
 *  lib/http.js
 *
 * Adminion HTTP Utility
 *  - Configures HTTP server
 *  - Initializes authentication and authorization mechanisms
 *  - Establishes and maintains aaccount sessions
 *  - Provides Account and Game CRUD APIs via HTTP
 *
 */


// node core modules
var events = require('events')
    , http = require('http')
    , https = require('https')
    , url = require('url')
    , util = require('util');

// 3rd party modules
var express = require('express')
    , flash = require('connect-flash')
    , connectMongo = require('connect-mongo')(express);

function AdminionServer_http (tools) {

    var app = express(),
        self = this;
    
    this.cookieParser = express.cookieParser;

    this.start = function () {
        // create a server instance depending on the boolean conversion of tools.config.http
        this.server = !!tools.config.https
            // if https is enabled, create https server
            ? https.createServer(tools.env.net.ssl.data, app )
            // otherwise, create http server
            : this.createServer(app);

        this.server.on('closed', function () {
            self.emit('stopped');
        });
                
        // instruct the server to start listening
        this.server.listen(tools.config.port, function serverListerning () { 
            // once the server is listening, emit ready
            self.emit('ready');
        });
    };

    this.stop = function () {
        this.server.close(function () {
            self.emit('stopped');
        });
    };

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONFIGURATION
    //
    ////////////////////////////////////////////////////////////////////////////

    //when NODE_ENV is undefined
    app.configure(configureApp);

    ////////////////////////////////////////////////////////////////////////////
    //
    // PARAMETER HANDLERS
    //
    ////////////////////////////////////////////////////////////////////////////

    app.param('email', paramEmail);

    app.param('gameID', paramGameID);

    ////////////////////////////////////////////////////////////////////////////
    //
    // TEMPLATE VARS
    //
    ////////////////////////////////////////////////////////////////////////////

    // make the properties adminion object available as variables in all views
    app.locals = {
        env: tools.env,
        links : {
            Games : "/games",
            Accounts : "/accounts"
        }    
    };

    app.get('/', getRoot);

    // GET requests for /logon will respond with the logon form
    app.get('/logon', getLogon);

    // POST requests for /logon will attempt to authenticate the given user
    app.post('/logon', tools.modules.db.logon(), postLogon);

    // GET requests for /logoff will kill the users session and redirect to root
    app.get('/logoff', function (request, response) {

        if (!!request.user) {
            // console.log("[%s] %s logged out.",
            //     Date(),
            //     request.user.email);

            self.emit('logoff', request.user.email);
            request.logOut();
        }

        response.redirect('/');
    });

    app.get('/accounts', verify, getAccounts);

    app.get('/accounts/create', /* verify, */ getAccountsCreate);

    app.get('/accounts/:email', verify, getAccountsEmail);

    app.get('/accounts/:email/update', verify, getAccountsEmailUpdate);

    app.post('/accounts', /* verify, */ postAccounts);

    app.post('/accounts/:email/update', verify, postAccountsEmailUpdate);

    app.get('/games', verify, getGames);

    // GET requests for /games/create will verify, then create a game
    app.get('/games/create', verify, getGamesCreate);

    // GET requests for /games/:gameID will verify, then display game stats
    app.get('/games/:gameID', verify, getGamesGameID);

    // GET requests for /lobby will display the game lobby if authorized
    app.get('/games/:gameID/lobby', verify, getGamesGameIDLobby);

    // GET requests for /play will check for authorization then display the game
    app.get('/games/:gameID/play', verify, getGamesGameIDPlay);


    function configureApp() {
        var scfg;

        app.set('port', tools.config.port);
        app.set('views', 'views');
        app.set('view engine', 'jade');
        app.use(express.favicon());
        
        if (tools.config.debug) {
           app.use(express.logger('dev'));        
        }

        app.use(express.urlencoded());
        app.use(express.json());
        
        // for PUT requests
        app.use(express.methodOverride());

        // sets up session store in memory also using cookies
        app.use(express.cookieParser());

        self.mongoStore = new connectMongo({ mongoose_connection: tools.modules.db.getConnection() });

        scfg = tools.config.session;
        scfg.key = 'adminion.sid';
        scfg.store = self.mongoStore;

        app.use(express.session(scfg));

        // allows us to use connect-flash messages
        app.use(flash());

        // setup passport
        app.use(tools.modules.db.passportInitialize());
        app.use(tools.modules.db.passportSession());

        // have express try our routes before looking for static content
        app.use(app.router);

        // serve static content if no routes were found
        app.use(express.static('public'));

        // render 404 if a static file is not found
        app.use(fourOhFour);

    };

    function errorHandler (err, request, response) {
        console.trace(err);
        // debug.emit('val', 'err', err);
        response.render('errors/500', {
            err: err,
            request: request
        });
    };

    function fourOhFour (request, response) {
        response.render('errors/404', {
            request: request
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    //
    // GET REQUESTS
    //
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // ACCOUNTS
    ////////////////////////////////////////////////////////////////////////////

    function getAccounts (request, response) {
        var accounts = tools.data.getAccounts();

        response.render('accounts', {
            accounts : accounts,
            request : request
        });
    };

    function getAccountsCreate (request, response) {
        response.render('accounts/create', {
            request :   request
            , err: false
            , redir: request.redir || '/logon'
        });
    };

    function getAccountsEmail (request, response) {
        // debug.emit('val' , 'request.account', request.account);
        
        response.render('accounts/account', { request : request });
        
    };

    function getAccountsEmailUpdate (request, response) {
        // output the account that we got back for debug purposes
        // debug.emit('val',  'request.account', request.account);

        // render accounts/update.jade
        response.render('accounts/update', { request : request });
    };

    ////////////////////////////////////////////////////////////////////////////
    // G A M E S
    ////////////////////////////////////////////////////////////////////////////

    function getGames (request, response) {

        var offset = request.query.offset || 0,
            count = request.query.count || 20,
            games = tools.data.getGames();

        // debug.emit('val', 'games', games);

        response.render('games' , {
            games: games
            , request : request
        });

    };

    function getGamesCreate (request, response) {
        // debug.emit('val',  'request.user', request.user, 'lib/gamesServer.js', 457);

        var newGame = { playerOne : request.user._id };

        // create Game model instance
        tools.modules.db.createGame(newGame, function (err, game) {
            if (err) { 
                throw err;
                // errorHandler(err, request, response);
            } else {
                // debug.emit('val', 'game', game);

                game.populate('playerOne', function (err, game) {
                    // debug.emit('val', 'game', game);

                    tools.data.setGame(game);

                    response.redirect('/games/' + game.id + '/lobby');

                });
            }
        });
    };

    function getGamesGameID (request, response) {
        
        response.render('games/game', {
            request: request
        });
        
    };

    function getGamesGameIDLobby (request, response) { 

        switch (request.game.status) {
            case 'lobby':
                response.render('games/lobby', { request: request });
            break;

            case 'play':
                response.redirect('games/' + request.params.gameID + '/play');
            break;

            default: 
                response.redirect('games/' + request.params.gameID);
                break;
        } 
        
    };

    function getGamesGameIDPlay (request, response) {
         
        response.render('games/play', {
            request: request
        });
    };

    function getLogon (request, response) {
        response.render('logon', {
            err: request.flash('error') || request.cookies.err
            , redir: url.parse(request.url,true).query.redir || '/'
            , request :     request
        });
    };

    function getRoot (request, response) {

        // debug.emit('val' , 'request.session', request.session);
        
        response.render('root', {
            request :   request
        });
    };

    function paramEmail (request, response, next, email) {
        
        request.account = tools.data.getAccountByEmail(email);

        // debug.emit('val', 'request.account', request.account);

        next();
    };

    function paramGameID (request, response, next, gameID) {
    
        request.game = tools.data.getGame(gameID);
        // debug.emit('val', 'request.game', request.game);

        if (request.game) {
            next();

        } else {      
            response.render('errors/games/404', {
                request: request
            });

            return false;
        }

    };

    ////////////////////////////////////////////////////////////////////////////
    //
    // POST REQUESTS
    //
    ////////////////////////////////////////////////////////////////////////////

    function postAccounts(request, response) {
        // only admin can create accounts
        // if (!request.user.admin) {
        //     response.redirect('/accounts');
        //     return;
        // }

        // create a new Account instance that we will attempt to create
        var newAccount = {
            email : request.body.email
            , firstName : request.body.firstName
            , lastName : request.body.lastName
            , displayName : request.body.displayName
        };

        if (request.body.password !== request.body.verifyPassword) {
            response.render('accounts/create', {
                request :   request
                , err: 'Passwords do not match!'
                , redir: request.redir || '/logon'
            });
        } else {
            tools.modules.db.createAccount(newAccount, request.body.password, function (err, account) {
                if (err) { 
                    errorHandler(err, request, response);
                } else {
                    // add the new account to the server's cache
                    tools.data.setAccount(account);
                    response.redirect('/accounts/' + account.email);
                }
            });
        }

    };

    function postAccountsEmailUpdate(request, response) {

        var accountID = request.user['_id'],
            updates;

        if (request.user.email !== request.params.email) {

            response.redirect('/accounts/' + request.params.email);
            return;    
        }

        // define updated account
        updates = {
            email: request.params.email,
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            displayName: request.body.displayName,
        };

        // if both the password and verify password fields are set...
        if (request.body.password && request.body.verifyPassword) {
            // and if the password and verify password fields are equal...
            if (request.body.password === request.body.verifyPassword) {
                updatedAccount.password = request.body.password;
            }
        }

        // debug.emit('val', 'updates', updates);

        tools.modules.db.updateAccount(accountID, updates, function (err, updatedAccount) {
            // if there was an error
            if (err) { 
                errorHandler(err, request, response);
            } else {
                // debug.emit('msg', 'account updated!', 'lig/http', 320);
                // debug.emit('val', 'updatedAccount', updatedAccount);

                tools.data.setAccount(updatedAccount);

                // response.redirect('/accounts/' + updatedAccount.email);
            }
        });

    };



    function postLogon (request, response, next) {
        // console.log("[%s] %s logged in.", Date(), request.user.displayName);
        self.emit('logon', request.user);

        return response.redirect(request.body.redir);
    };

    function verify (request, response, next) {
        
        if (request.isAuthenticated()) {
            // debug.emit('msg', util.format('%s is authorized', request.user.email));
            return next();
        } else {
            // console.log('\t--> NOT authenticated.  redirecting to logon...');
            request.cookies.redir = request.url;
            request.cookies.err = 'You need to logon before you can visit ' + request.url;
            response.redirect('/logon');
        }
    };


};

util.inherits(AdminionServer_http, events.EventEmitter);

module.exports = AdminionServer_http;
