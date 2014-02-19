/**
 * configuration module
 * 
 * assigns a map of configuration settings to configuration
 */

var configFile = require('../config.json'),
    defaults = require('../config.default.json'),
    utils = require('./utils'),
    configuration = utils.extend(defaults, configFile);

module.exports = configuration; 