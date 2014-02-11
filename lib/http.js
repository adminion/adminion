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

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONFIGURATION
    //
    ////////////////////////////////////////////////////////////////////////////

    //when NODE_ENV is undefined
    app.configure(function () { 
        app.set('port', tools.config.port);
        app.set('views', tools.config.views);
        app.set('view engine', tools.config.viewEngine);
        app.use(express.favicon(tools.config.favicon));
        
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

        app.use(express.session({
            cookie      : tools.config.session.cookie
            , key       : 'adminion.sid'
            , secret    : tools.config.session.secret
            , store     : self.mongoStore
        }));

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
        app.use(function (request, response) {
            response.render('errors/404', {
                request: request
            });
        });

    });

    //when NODE_ENV = 'development'
    app.configure(function () {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    });

    ////////////////////////////////////////////////////////////////////////////
    //
    // PARAMETER HANDLERS
    //
    ////////////////////////////////////////////////////////////////////////////

    app.param('email', function (request, response, next, email) {
        
        request.account = tools.modules.cache.getAccountByEmail(email);

        // debug.emit('val', 'request.account', request.account);

        next();
    });

    app.param('gameID', function (request, response, next, gameID) {
    
        request.game = tools.modules.cache.getGame(gameID);
        // debug.emit('val', 'request.game', request.game);

        if (request.game) {
            next();

        } else {      
            response.render('errors/games/404', {
                request: request
            });

            return false;
        }

    });

    ////////////////////////////////////////////////////////////////////////////
    //
    // TEMPLATE VARS
    //
    ////////////////////////////////////////////////////////////////////////////

    // make the properties adminion object available as variables in all views
    app.locals = {
        adminion : {
            env: tools.env
        }
        , config : tools.config.locals
    };

    ////////////////////////////////////////////////////////////////////////////
    //
    // HANDLER HELPERS
    //
    ////////////////////////////////////////////////////////////////////////////

    function errorHandler (err, request, response) {
        console.trace(err);
        debug.emit('val', 'err', err);
        response.render('errors/500', {
            err: err,
            request: request
        });
    };

    function verify (request, response, next) {
        var redirectURL;

        if (request.isAuthenticated()) {
            debug.emit('msg', util.format('%s is authorized', request.user.email));
            return next();
        } else {
            // console.log('\t--> NOT authenticated.  redirecting to logon...');
            redirectURL = util.format('/logon?redir=%s', request.url);
            request.cookies.redir = request.url;
            request.cookies.err = 'You need to logon before you can visit ' + request.url;
            response.redirect(redirectURL);
        }
    };

    ////////////////////////////////////////////////////////////////////////
    //
    // REQUEST HANDLERS
    //
    ////////////////////////////////////////////////////////////////////////

    app.get('/', function (request, response) {

        debug.emit('val' , 'request.session', request.session);
        
        response.render('root', {
            request :   request
        });
    });

    // GET requests for /logon will respond with the logon form
    app.get('/logon', function (request, response) {
        response.render('logon', {
            err: request.flash('error') || request.cookies.err
            , redir: url.parse(request.url,true).query.redir || '/'
            , request :     request
        });
    });

    // POST requests for /logon will attempt to authenticate the given user
    app.post('/logon',
        // first authenticate
        tools.modules.db.logon()

        // then fulfill the request
        , function (request, response, next) {
            // console.log("[%s] %s logged in.", Date(), request.user.handle);
            self.emit('logon', request.user);

            return response.redirect(request.body.redir);
        }
    );

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

    ////////////////////////////////////////////////////////////////////////////
    //
    // ACCOUNTS
    //
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // GET REQUESTS
    ////////////////////////////////////////////////////////////////////////////

    // GET requests for /accounts will check for auth then display all accounts
    app.get('/accounts', verify, function (request, response) {
        var accounts = tools.modules.cache.getAccounts();

        response.render('accounts', {
            accounts : accounts,
            request : request
        });
    });

    // get requests
    app.get('/accounts/create', /* verify, */ function (request, response) {
        response.render('accounts/create', {
            request :   request
            , err: false
            , redir: request.redir || '/logon'
        });
    });

    // GET requests for /accounts/:email will check for auth then display the account's profile
    app.get('/accounts/:email', verify, function (request, response) {
        debug.emit('val' , 'request.account', request.account);
        
        response.render('accounts/account', { request : request });
        
    });

    // GET requests for /accounts/:email/update with check for auth then
    // display a form filled with the user's current data
    app.get('/accounts/:email/update', verify, function (request, response) {
        // output the account that we got back for debug purposes
        debug.emit('val',  'request.account', request.account);

        // render accounts/update.jade
        response.render('accounts/update', { request : request });
    });

    ////////////////////////////////////////////////////////////////////////////
    // POST REQUESTS
    ////////////////////////////////////////////////////////////////////////////

    app.post('/accounts', /* verify, */ function (request, response) {
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
            , handle : request.body.handle
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
                    tools.modules.cache.setAccount(account);
                    response.redirect('/accounts/' + account.email);
                }
            });
        }

    });

    app.post('/accounts/:email/update', verify, function (request, response) {

        var updatedAccount;

        // make sure an account's email has been specified
        if (request.params.email) {

            if (request.user.email !== request.body.email) {
                response.redirect('/accounts' + request.params.email);
                return;    
            }

            // define updated account
            updatedAccount = {
                email: request.body.email,
                firstName: request.body.firstName,
                lastName: request.body.lastName,
                handle: request.body.handle,
            };

            // if both the password and verify password fields are set...
            if (request.body.password && request.body.verifyPassword) {
                // and if the password and verify password fields are equal...
                if (request.body.password === request.body.verifyPassword) {
                    updatedAccount.password = request.body.password;
                }
            }

            tools.modules.db.updateAccount(updatedAccount, function (error, account) {
                // if there was an error
                if (err) { 
                    errorHandler(err, request, response);
                } else {
                    debug.emit('msg', 'account updated!', 'lig/http', 320);
                    debug.emit('val', 'account', account);

                    tools.modules.cache.setAccount(account);
                    response.redirect('/accounts/' + account.email);
                }
            });

            
        // if no user was specified...
        } else {
            // redirect to /accounts
            response.redirect('/accounts');
        }
    });

    ////////////////////////////////////////////////////////////////////////////
    //
    // G A M E S
    //
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // GET REQUESTS
    ////////////////////////////////////////////////////////////////////////////

    // GET requests for /games will verify then display list of games in play
    app.get('/games', verify, function (request, response) {

        var offset = request.query.offset || 0,
            count = request.query.count || 20,
            games = tools.modules.cache.getGames(),
            playerOnes = {},
            numGames = games.length,
            i,
            accountID,
            gameID;

        debug.emit('val', 'games', games);

        for (i=0; i <numGames; i+=1) {
            
            accountID = games[i].playerOne.accountID,
                gameID = games[i]['_id'];

            debug.emit('val', 'accountID', accountID);
            debug.emit('val', 'gameID', gameID);
            
            playerOnes[gameID] = tools.modules.cache.getAccount(accountID);
            
        }
        
        debug.emit('val', 'games', games);
        debug.emit('val', 'playerOnes', playerOnes);

        response.render('games' , {
            accounts: tools.modules.db.getAccounts()
            , games: games
            , playerOnes: playerOnes
            , request : request
        });

    });

    // GET requests for /games/create will verify, then create a game
    app.get('/games/create', verify, function (request, response) {
        // debug.emit('val',  'request.user', request.user, 'lib/gamesServer.js', 457);

        var newGame = {
            playerOne : {
                handle: request.user.handle,
                accountID: request.user['_id']
            }
        };

        // create Game model instance
        tools.modules.db.createGame(newGame, function (err, game) {
            if (err) { 
                errorHandler(err, request, response);
            } else {
                debug.emit('val', 'newGame', game);

                tools.modules.cache.setGame(game);

                self.emit('newGame');

                response.redirect('/games/' + game.id + '/lobby');   
            }
        });
    });

    // GET requests for /games/:game will verify, then display game stats
    app.get('/games/:gameID', verify, function (request, response) {
        
        var playerOne = tools.modules.cache.getAccount(request.game.playerOne.accountID);
    
        debug.emit('val', 'request.game', request.game);

        if ( playerOne === false) {
            response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
        }  else {   
            response.render('games/game', {
                playerOne: playerOne, 
                request: request
            });
        }
        
    });

    // GET requests for /lobby will display the game lobby if authorized
    app.get('/games/:gameID/lobby', verify, function (request, response) {      
        
        var playerOne = tools.modules.cache.getAccount(request.game.playerOne.accountID);
    
        // debug.emit('val', 'playerOne', playerOne);

        if ( playerOne === false) {
            response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
        }  else if (request.game.status !== 'lobby') {
            response.redirect('games/' + request.params.gameID);
        } else {   
            response.render('games/lobby', {
                playerOne: playerOne, 
                request: request
            });
        }
    });

    // GET requests for /play will check for authorization then display the game
    app.get('/games/:gameID/play', verify, function (request, response) {
        
        var playerOne = tools.modules.cache.getAccount(request.game.playerOne.accountID);
    
        // debug.emit('val', 'playerOne', playerOne);

        if ( playerOne === false) {
            response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
        }  else {   
            response.render('games/play', {
                playerOne: playerOne, 
                request: request
            });
        }
    });

    this.start = function () {
        // create a server instance depending on the boolean conversion of tools.config.http
        this.server = !!tools.config.https
            // if https is enabled, create https server
            ? https.createServer(tools.config.https.data, app )
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
        this.server.close();
    };

};

util.inherits(AdminionServer_http, events.EventEmitter);

module.exports = AdminionServer_http;
