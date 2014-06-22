
// 3rd party
var debug = require('debug')('adminion:transport:http:verify');

module.exports = function verifySession (request, response, next) {
    
    if (request.isAuthenticated()) {
        // debug.emit('msg', util.format('%s is authorized', request.user.email));
        return next();
    } else {
        // console.log('\t--> NOT authenticated.  redirecting to logon...');
        debug('request.originalUrl', request.originalUrl);
        response.cookie('redir', request.originalUrl);
        request.flash('err', 'You need to logon before you can visit ' + request.originalUrl);
        response.redirect('/logon');
    }
};
