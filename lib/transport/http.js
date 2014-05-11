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
var events = require('events'), 
    http = require('http'), 
    https = require('https'), 
    util = require('util');

// 3rd party modules
var bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    express = require('express'), 
    expressSession = require('express-session'),
    flash = require('connect-flash'),
    favicon = require('static-favicon'),
    // don't know why they decided to rename it "morgan..." ugh.
    logger = require('morgan'),
    methodOverride = require('method-override'),
    serveStatic = require('serve-static');

// adminion server modules
var config = require('../config'),
    env = require('../env'),
    utils = require('../utils');

function Adminion_http (data) {

    var app = express(),
        self = this,
        server;
    
    this.cookieParser = cookieParser;

    utils.define_prop(this, 'server', {
        get: function () { return server; },
        set: function () { return false }
    });

    this.start = function () {
        // instruct the server to start listening
        server.listen(config.port, function serverListerning () { 
            // debug.emit('val', 'server', server);
            
            // once the server is listening, emit ready
            self.emit('ready');
        });
    };

    this.stop = function (done) {
        server.close(function () {
            self.emit('stopped');
            done();
        });
    };

    ////////////////////////////////////////////////////////////////////////////
    //
    // CONFIGURATION
    //
    ////////////////////////////////////////////////////////////////////////////

    var scfg;

    app.set('port', config.port);
    app.set('views', 'lib/transport/views');
    app.set('view engine', 'jade');
    
    if (config.favicon) {
        app.use(favicon(config.favicon));
    }
    
    if (config.debug) {
       app.use(logger('dev'));        
    }

    app.use(bodyParser());
    
    // for PUT requests
    app.use(methodOverride());
    app.use(cookieParser());

    scfg = config.session;
    scfg.store = data.session(expressSession);
    
    // debug.emit('val', 'scfg', scfg);

    app.use(expressSession(scfg));

    // allows us to use connect-flash messages
    app.use(flash());

    // setup passport
    app.use(data.passportInitialize());
    app.use(data.passportSession());

    // make the properties adminion object available as variables in all views
    app.locals = {
        env: env,
        links : {
            Games : "/games",
            Accounts : "/accounts"
        }    
    };

    // express routers
    var accounts = express.Router(),
        games = express.Router();

    accounts.use(verifySession);
    games.use(verifySession);

    accounts = require('./routes/accounts')(accounts, data),
    games = require('./routes/games')(games, data),
    root = require('./routes/root')(data);

    app.use('/', root);
    app.use('/accounts', accounts);
    app.use('/games', games);

    // serve static content if no routes were found
    app.use(serveStatic('lib/transport/public'));

    // render 404 if a static file is not found
    app.use(function fourOhFour (request, response) {
        response.render('errors/404', {
            request: request
        });
    });  

    server = (config.https)
        // if https is enabled, create https server
        ? https.Server(env.net.ssl.data, app )
        // otherwise, create http server
        : http.Server(app);

    server.on('closed', function () {
        self.emit('stopped');
    });

    function verifySession (request, response, next) {
        
        if (request.isAuthenticated()) {
            // debug.emit('msg', util.format('%s is authorized', request.user.email));
            return next();
        } else {
            // console.log('\t--> NOT authenticated.  redirecting to logon...');
            debug.emit('val', 'request.originalUrl', request.originalUrl);
            response.cookie('redir', request.originalUrl);
            response.cookie('err', 'You need to logon before you can visit ' + request.originalUrl);
            response.redirect('/logon');
        }
    };


};

util.inherits(Adminion_http, events.EventEmitter);

module.exports = Adminion_http;
