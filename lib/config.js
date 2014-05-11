/**
 * configuration module
 * 
 * assigns a map of configuration settings to configuration
 */


var configFile = require('../config.json'),
    defaults = require('../config.default.json'),
    utils = require('techjeffharris-utils');
    configuration = utils.extend(defaults, configFile, true);

module.exports = configuration; 
