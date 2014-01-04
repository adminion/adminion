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
        
        if (tools.config.debug) {
           app.use(express.logger('dev'));        
        }

        app.use(express.urlencoded());
        app.use(express.json());
        
        // for PUT requests
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

        // have express try our routes before looking for static content
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

    ////////////////////////////////////////////////////////////////////////////
    //
    // PARAMETER HANDLERS
    //
    ////////////////////////////////////////////////////////////////////////////

    app.param('email', function (request, response, next, email) {
        
        request.account = tools.cache.getAccountByEmail(email);

        // debug.emit('val', 'request.account', request.account, 'lib/http', 103);

        next();
    });

    app.param('gameID', function (request, response, next, gameID) {
        request.game = tools.cache.getGame(gameID);

        // debug.emit('val', 'request.game', request.game, 'lib/http', 103);

        next();
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
        debug.emit('val', 'err', err, 'lib/http.js', 142);
        response.render('errors/500', {
            err: err,
            request: request
        });
    };

    function verify (request, response, next) {
        var redirectURL;

        if (request.isAuthenticated()) {
            debug.emit('msg', util.format('\t--> %s is authorized', request.user.email), 'lib/http', 151);
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

        debug.emit('var' , 'request.session', request.session, 'lib/http.js', 140);
        
        response.render('root', {
            request :   request
        });

        // var doc = '<!DOCTYPE html><html><head><!-- link(rel=\'stylesheet\', href=\'/stylesheets/styles.css\')--><title>Adminion</title><script src="/scripts/jquery.js"></script><script>$(document).ready(function() {\n';
        // doc += '$(\'#name\').focus();\n';
        // doc += '});</script></head><body><div id="wrapper"><div id="header"><div id="banner"><!-- this would be a good place for a banner image--></div><div id="breadcrumbs"><!-- breadcrumbs leave a trail as players navigate the server--><h3><a href="/">Adminion</a></h3></div><div id="session"><span>Not logged on. \n';
        // doc += '[&nbsp; <a href="/logon?redir=/">Logon</a>&nbsp;]</span></div></div><div id="body"><div id="menu"></div><div id="main"><div id="content"><h2>Hello</h2><p>World!</p></div></div></div></div></body></html>';

        // response.writeHead(200);
        // response.end(doc);
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
            // console.log("[%s] %s logged in.", Date(), request.user.handle);
            http.emit('logon', request.user);

            return response.redirect(request.body.redir);
        }
    );

    // GET requests for /logoff will kill the users session and redirect to root
    app.get('/logoff', function (request, response) {

        if (!!request.user) {
            // console.log("[%s] %s logged out.",
            //     Date(),
            //     request.user.email);

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
        var accounts = tools.cache.getAccounts();

        response.render('accounts', {
            accounts : accounts,
            request : request
        });
    });

    // get requests
    app.get('/accounts/create', verify, function (request, response) {
        response.render('accounts/create', {
            request :   request
            , err: false
            , redir: request.redir || '/logon'
        });
    });

    // GET requests for /accounts/:email will check for auth then display the account's profile
    app.get('/accounts/:email', verify, function (request, response) {
        debug.emit('var' , 'request.account', request.account, 'lib/http.js', 253);
        
        response.render('accounts/account', { request : request });
        
    });

    // GET requests for /accounts/:email/update with check for auth then
    // display a form filled with the user's current data
    app.get('/accounts/:email/update', verify, function (request, response) {
        // output the account that we got back for debug purposes
        debug.emit('val',  'request.account', request.account, 'lib/http.js', 263);

        // render accounts/update.jade
        response.render('accounts/update', { request : request });
    });

    ////////////////////////////////////////////////////////////////////////////
    // POST REQUESTS
    ////////////////////////////////////////////////////////////////////////////

    app.post('/accounts', verify, function (request, response) {
        // only admin can create accounts
        if (!request.user.admin) {
            response.redirect('/accounts');
            return;
        }

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
            tools.db.createAccount(newAccount, request.body.password, function (err, account) {
                if (err) { 
                    errorHandler(err, request, response);
                } else {
                    // add the new account to the server's cache
                    tools.cache.setAccount(account);
                    response.redirect('/accounts/' + account.email);
                }
            });
        }

    });

    app.post('/accounts/:email/update', verify, function (request, response) {
        // make sure an account's email has been specified
        if (request.params.email) {

            if (request.user.email !== request.body.email) {
                response.redirect('/accounts' + request.params.email);
                return;    
            }

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

            tools.db.updateAccount(updatedAccount, function (error, account) {
                // if there was an error
                if (err) { 
                    errorHandler(err, request, response);
                } else {
                    debug.emit('msg', 'account updated!', 'lig/http', 320);
                    debug.var('account', account, 'lib/http.js', 321);

                    tools.cache.setAccount(account);
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

        var games = tools.cache.getGames();

        debug.emit('val', 'games', games, 'lib/http', 359);

        var playerOnes = {};
        var numGames = games.length;

        var numAccounts = 0;

        for (var i=0; i <numGames; i+=1) {
            
            var accountID = games[i].playerOne.accountID,
                gameID = games[i]['_id'];

            debug.emit('val', 'accountID', accountID, 'lib/http', 369);
            debug.emit('val', 'gameID', gameID, 'lib/http', 370);
            
            playerOnes[gameID] = tools.cache.getAccount(accountID);
            
        }
        
        debug.emit('val', 'games', games, 'lib/http', 390);
        debug.emit('val', 'playerOnes', playerOnes, 'lib/http', 391);

        response.render('games' , {
            accounts: tools.db.getAccounts()
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
        tools.db.createGame(newGame, function (err, game) {
            if (err) { 
                errorHandler(err, request, response);
            } else {
                debug.emit('val', 'newGame', game, 'lib/http.js', 401);

                tools.cache.setGame(game);

                response.redirect('/games/' + game.id + '/lobby');   
            }
        });
    });

    // GET requests for /games/:game will verify, then display game stats
    app.get('/games/:gameID', verify, function (request, response) {
        
        var playerOne = tools.cache.getAccount(request.game.playerOne.accountID);
    
        debug.emit('val', 'request.game', request.game, 'lib/http', 415);

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
        
        var playerOne = tools.cache.getAccount(request.game.playerOne.accountID);
    
        // debug.emit('val', 'playerOne', playerOne, 'lib/http', 433);

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
        
        var playerOne = tools.cache.getAccount(request.game.playerOne.accountID);
    
        // debug.emit('val', 'playerOne', playerOne, 'lib/http', 450);

        if ( playerOne === false) {
            response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
        }  else {   
            response.render('games/play', {
                playerOne: playerOne, 
                request: request
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

        http.server.on('closed', function () {
            http.emit('stopped');
        });
                
        // instruct the server to start listening
        http.server.listen(tools.config.port, function () { 
            // once the server is listening, emit ready
            http.emit('ready'); 
        });
    };

    http.stop = function () {
        http.server.close();
    };

    // return the http module
    return http;

};
