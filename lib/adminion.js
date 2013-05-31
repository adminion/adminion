
/**
 * Configure the main adminion library and module.exports equal to it
 */

// define the adminion module object 
var adminion = module.exports = {};

// express is the express module itself
var express = require('express')
	MongoStore = require('connect-mongo')(express);

// store the express app inside our adminion module
var app = adminion.app = express()
	, auth = adminion.auth = require('./auth')
	, config = adminion.config = require('./config')
	, env = adminion.env = require('./env')
	, logger = adminion.logger = require('./logger')
	, passport = auth.passport
	, ssl = adminion.ssl = require('./ssl');
	
//when NODE_ENV is undefined
app.configure(function() {
	app.set('port', config.port);
	app.set('views', config.views);
	app.set('view engine', config.viewEngine);
	app.use(express.favicon(config.favicon));
	app.use(express.logger('short'));	
	
	// for PUT requests
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	
	// sets up session store in memory also using cookies
	app.use(express.cookieParser());
	app.use(express.session({
		secret: "4$BoD8Uoo7$hjI1ZbrPB+hd8Sh3peZ20SUbPU4", 
		store:	new MongoStore({
			db: 'adminion'
		})
	}));
	
	app.use(passport.initialize());
	app.use(passport.session());
			
	// have express try our routes (not yet defined) before looking for static content
	app.use(app.router);

	// serve static content if no routes were found
	app.use(express.static('public'));
	
	// error handler should be last resort
//	app.use(function(err, req, res, next){
//		res.status(404);
//		
//		console.log('%s: 404 - Not Found -> %s', 
//			new Date(), 
//			req.body.url
//		);
//		res.render('errors/404', {request: req.body});
//	});
});

//when NODE_ENV = 'development'
app.configure('dev',function () {
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

//when NODE_ENV = 'production'
app.configure('prod',function () {
	app.use(express.logger('prod'));
});

adminion.listening = function() {
	var secure = (config.https) ? ' for secure connections' : '';
	 
	console.log("Adminion game server '%s' listening%s.\nJoin game --> %s/join", 
		env.serverName, secure, env.url
	);
	 
};

