/**
 * configuration module
 * 
 * assigns a map of configuration settings to configuration
 */

var debug = require('debug')('adminion:config');

var configFile = require('../config.json'),
    defaults = require('../config.default.json'),
    utils = require('techjeffharris-utils');
    configuration = utils.extend(defaults, configFile, true);

// debug('configFile', configFile);
// debug('defaults', defaults);
debug('configuration', configuration);

module.exports = configuration; 
