
var express = require('express'),
    url = require('url');

module.exports = function (data) {

    var root = express.Router();

    root.get('/', getRoot);

    // GET requests for /logon will respond with the logon form
    root.get('/logon', getLogOn);

    // POST requests for /logon will attempt to authenticate the given user
    root.post('/logon', data.passport.authenticate(), postLogOn);

    // GET requests for /logoff will kill the users session and redirect to root
    root.get('/logoff', getLogOff);

    root.get('/register', getRegister);

    root.post('/register', postRegister); 

    function postRegister(request, response) {
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
            data.accounts.create(newAccount, request.body.password, function (err, account) {
                if (err) { 
                    fiveHundred(err, request, response);
                } else {
                    response.redirect('/accounts/' + account.email);
                }
            });
        }

    };

    function getLogOn (request, response) {
        response.render('logon', { request : request });
    };

    function getLogOff(request, response) {

        if (!!request.user) {
            // console.log("[%s] %s logged out.",
            //     Date(),
            //     request.user.email);
            request.logOut();
        }

        response.redirect('/');
    };

    function getRegister (request, response) {
        response.render('register', {
            request :   request
            , err: false
            , redir: request.redir || '/logon'
        });
    };

    function getRoot (request, response) {

        // debug.emit('val' , 'request.session', request.session);
        
        response.render('root', {
            request :   request
        });
    };

    function postLogOn (request, response, next) {
        // console.log("[%s] %s logged in.", Date(), request.user.displayName);
        
        return response.redirect(request.body.redir);
    };

    function fiveHundred (err, request, response) {
        console.trace(err);
        // debug.emit('val', 'err', err);
        response.render('errors/500', {
            err: err,
            request: request
        });
    };


    return root;

};
