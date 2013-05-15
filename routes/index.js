
/*
 * GET home page.
 */
var env = require('../lib/env');

exports.index = function(req, res){
  res.render('index', { title: env.appName });
};
