/**
 * configuration module
 * 
 * assigns a map of configuration settings to configuration
 */

var configFile = require('../config.json'),
    utils = require('./utils');

var defaults = {
    debug: false,
    cacheUpdateInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
    host: 'localhost', 
    https: true,
    locals: {
        links : {
            "Games" : "/games"
            , "Accounts" : "/accounts"
        }
    },
    port: '1337',
    mongodb: 'mongodb://localhost/adminion',
    serverName: 'Adminion',
    session: {
        // maxAge is the number of milliseconds till cookie expiry
        // 5 hours in milliseconds = 5 * 60 * 60 * 1000
        cookie: { maxAge : 5 * 60 * 60 * 1000 }, 
        // we recommend creating your own secret... 
        secret: '$4$1M1KLxrb$h0ynxcy1IZ0wQltG+iqdYZCmcfg$'
    },
    views: 'views',
    viewEngine: 'jade',
    workers: 1
};

var configuration = utils.extend(defaults, configFile);

if (configuration.https) {
    configuration.https = require('./ssl') ;
} 

module.exports = configuration;