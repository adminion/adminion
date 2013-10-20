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

// export the http factory function which is passed tools
module.exports = function (tools) {

    var http = Object.create(events.EventEmitter.prototype);

    http.cookieParser = express.cookieParser;
    
    var app = express();

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
        app.use(express.logger('short'));

        // for PUT requests
        app.use(express.bodyParser());
        app.use(express.methodOverride());

        // sets up session store in memory also using cookies
        app.use(express.cookieParser());

        http.mongoStore = new connectMongo({ mongoose_connection: tools.db.getConnection() });

        app.use(express.session({
            cookie      : tools.config.session.cookie
            , key       : 'adminion.sid'
            , secret    : tools.config.session.secret
            , store     : http.mongoStore
        }));

        // allows us to use connect-flash messages
        app.use(flash());

        // setup passport
        app.use(tools.db.passportInitialize());
        app.use(tools.db.passportSession());

        // have express try our routes (not yet defined) before looking for static content
        app.use(app.router);

        // serve static content if no routes were found
        app.use(express.static('public'));

    });

    //when NODE_ENV = 'development'
    app.configure(function () {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    });

    //when NODE_ENV = 'production'
    app.configure(function () {
        app.use(express.logger('prod'));
    });

    ////////////////////////////////////////////////////////////////////////////
    //
    // PARAMETER HANDLERS
    //
    ////////////////////////////////////////////////////////////////////////////

    app.param('email', function (request, response, next, email) {
        tools.db.getAccount(email, function (err, account) {
            if (err) {
                errorHandler(err, request, response);
            } else {
                request.account = account;
                next();
            }
        });
    });

    app.param('gameID', function (request, response, next, gameID) {
        tools.db.getGame(gameID, function (err, game) {
            if (err) {
                errorHandler(err, request, response);
            } else {
                request.game = game;
                next();
            }
        });
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
        debug.val('err', err, 'lib/http.js', 27);
        response.render('errors/500', {
            err: err,
            request: request
        });
    };

    function verify (request, response, next) {
        var redirectURL;

        console.log('%s - Authorizaton required...', request.url);
    //      debug.emit('var' , 'request.session', request.session, 'lib/auth.js', 332);
        // this is a pretty crude way of doing this but it works at this scale;
        // however, it would be a silly performance loss to do this every single time...
        if (request.isAuthenticated()) {
            console.log('\t--> %s is authorized', request.user.email);
            return next();
        } else {
            console.log('\t--> NOT authenticated.  redirecting to logon...');
            redirectURL = util.format('/Logon?redir=%s', request.url);
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
//          debug.emit('var' , 'request.session', request.session, 'lib/http.js', 140);
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
        tools.db.logon()

        // then fulfill the request
        , function (request, response, next) {
            console.log("[%s] %s logged in.", Date(), request.user.handle);
            http.emit('logon', request.user);

            return response.redirect(request.body.redir);
        }
    );

    // GET requests for /logoff will kill the users session and redirect to root
    app.get('/logoff', function (request, response) {

        if (!!request.user) {
            console.log("[%s] %s logged out.",
                Date(),
                request.user.email);

            http.emit('logoff', request.user.email);
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
        tools.db.getAccounts(10, 0, function (err, accounts) {
            if (err) { 
                errorHandler(err, request, response);
            } else {
                response.render('accounts', {
                    accounts : accounts,
                    request : request
                });
            }
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
        debug.emit('var' , 'request.account', request.account, 'lib/http.js', 208);
        
        response.render('accounts/account', { request : request });
        
    });

    // GET requests for /accounts/:email/update with check for auth then
    // display a form filled with the user's current data
    app.get('/accounts/:email/update', verify, function (request, response) {
        // output the account that we got back for debug purposes
        debug.val( 'request.account', request.account, 'lib/http.js', 233);

        // render accounts/update.jade
        response.render('accounts/update', { request : request });
    });

    ////////////////////////////////////////////////////////////////////////////
    // POST REQUESTS
    ////////////////////////////////////////////////////////////////////////////

    app.post('/accounts', /* verify, */ function (request, response) {
        // create a new Account instance that we will attempt to create
        var newAccount = new adminion.db.accounts({
            email : request.body.email
            , firstName : request.body.firstName
            , lastName : request.body.lastName
            , handle : request.body.handle
        });

        if (request.body.password !== request.body.verifyPassword) {
            response.render('accounts/create', {
                request :   request
                , err: 'Passwords do not match!'
                , redir: request.redir || '/logon'
            });
        } else {
            adminion.db.createAccount(newAccount, password, function (err, account) {
                if (err) { 
                    errorHandler(err, request, response);
                } else {
                    response.redirect('/accounts/' + account.email);
                }
            });
        }

    });

    app.post('/accounts/:email/update', verify, function (request, response) {
        // make sure an account's email has been specified
        if (request.params.email) {

            // define updated account
            var updatedAccount = {
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

            tools.db.updateAccount(updatedAccount, function (error) {
                // if there was an error
                if (err) { 
                    errorHandler(err, request, response);
                } else {
                    console.log('account updated!');
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

        var offset = request.query.offset || 0
        var count = request.query.count || 20;

        var games = tools.db.getGames(count, offset);
        var playerOnes = [];

        for (i=0; i <games.length; i+=1) {
            var accountID = games[i].playerOne.accountID;
            var gameID = games[i]['_id'];
            playerOnes[gameID] = tools.db.getAccount(accountID);
        }

        debug.val('games', games, 'lib/http', 388);
        debug.val('playerOnes', playerOnes, 'lib/http', 389);

        response.render('games' , {
            accounts: tools.db.getAccounts()
            , games: games
            , playerOnes: playerOnes
            , request : request
        });
    });

    // GET requests for /games/create will verify, then create a game
    app.get('/games/create', verify, function (request, response) {
        // debug.val( 'request.user', request.user, 'lib/gamesServer.js', 457);

        // create Game model instance
        tools.db.createGame({
            playerOne : {
                handle: request.user.handle,
                accountID: request.user['_id']
            }
        }, function (err) {
            if (err) { 
                errorHandler(err, request, response);
            } else {
                var gameID = newGame['_id'];

                debug.val('adminion.realtime.sockets', adminion.realtime.sockets, 'lib/http.js', 430);

                // save the new game 
                http.emit('newGame', newGame);


                debug.val('newGame', newGame, 'lib/http.js', 437);

                response.redirect('/games/' + gameID + '/lobby');   
            }
        });
    });

    // GET requests for /games/:game will verify, then display game stats
    app.get('/games/:gameID', verify, function (request, response) {
        
        // get account...
        var playerOne = tools.db.getAccount(request.game.playerOne.accountID);

        debug.val('playerOne', playerOne, 'lib/http', 431);

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
        // get account...
        var playerOne = tools.db.getAccount(request.game.playerOne.accountID);

        debug.val('playerOne', playerOne, 'lib/http', 431);

        if ( playerOne === false) {
            response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
        }  else {   
            response.render('games/lobby', {
                playerOne: playerOne, 
                request: request
            });
        }
    });

    // GET requests for /play will check for authorization then display the game
    app.get('/games/:gameID/play', verify, function (request, response) {
        // get account...
        var playerOne = tools.db.getAccount(request.game.playerOne.accountID);

        debug.val('playerOne', playerOne, 'lib/http', 431);

        if ( playerOne === false) {
            response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
        }  else {   
            response.render('games/play', {
                game: game
                , playerOne: playerOne
                , request: request
            });
        }
    });

    http.listen = function () {
        // create a server instance depending on the boolean conversion of tools.config.http
        http.server = !!tools.config.https
            // if https is enabled, create https server
            ? https.createServer(tools.config.https.data, app )
            // otherwise, create http server
            : http.createServer(app);
                
        // instruct the server to start listening
        http.server.listen(tools.config.port, function () { 
            // once the server is listening, emit ready
            http.emit('ready'); 
        });
    };

    // return the http module
    return http;

};
