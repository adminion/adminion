
var express = require('express');

module.exports = function (accounts, store) {

    accounts.param('email', paramEmail);

    accounts.get('/', getAccounts);

    accounts.get('/:email', getAccountsEmail);

    accounts.get('/:email/update', getAccountsEmailUpdate);

    accounts.post('/:email/update', postAccountsEmailUpdate);

    function getAccounts (request, response) {
        var accounts = store.getAccounts();

        response.render('accounts', {
            accounts : accounts,
            request : request
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

        store.updateAccount(accountID, updates, function (err, updatedAccount) {
            // if there was an error
            if (err) { 
                fiveHundred(err, request, response);
            } else {
                // debug.emit('msg', 'account updated!', 'lig/http', 320);
                // debug.emit('val', 'updatedAccount', updatedAccount);

                store.setAccount(updatedAccount);

                // response.redirect('/accounts/' + updatedAccount.email);
            }
        });

    };

    function paramEmail (request, response, next, email) {
        
        request.account = store.getAccountByEmail(email);

        debug.emit('val', 'request.account', request.account);

        if (request.account) {
            next();

        } else {      
            response.render('accounts/404', {
                request: request
            });

            return false;
        }

        next();
    };

    function fiveHundred (err, request, response) {
        console.trace(err);
        // debug.emit('val', 'err', err);
        response.render('errors/500', {
            err: err,
            request: request
        });
    };

    return accounts;

};


