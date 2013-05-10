/**
 * env.js
 * 
 * smb environment module
 * 
 */

var config 	= require('../config/'),
	_os		= require('os'),
//	_url 	= require('url'),
	_util 	= require('util'); 

var env = module.exports; 
env.appName		= config.appName;
env.banner		= config.banner;
env.prefix		= __dirname.replace(/\/config\/$/, ''); // remove /config/;
env.url			= config.express.protocol + '://' + config.express.host + ':' + config.express.port;

env.links = require('./links');

env.nav = function (url){
	
	split = url.split('/');
	split.shift();
	
//	console.log('split: %j',split);
	
	nav = new Array(
		// site root
		{title: env.appName, url: _util.format('%s',env.url)}
	);
	
	if (split[0] != '') {
		for (i = 0; i< split.length; i++) {
			url = _util.format('%s',env.url);
			
			for (j = 0; j < (i+1); j++) {
				url += '/' + split[j];
			}
			
			nav.push({title:  split[i], 
				url: url
			});
		}
	}
	
//	console.log('nav: %j',nav);
	
	output = '';
	
	for(i in nav) {
//		console.log('i in nav: %d', i); 
		if(i != '0') { 
			output += '&nbsp; &rarr; &nbsp;'; 
		}
		
		output += _util.format('<a href="%s">%s</a>',
			nav[i].url, nav[i].title);
	}
	
//	console.log('output: %s', output);
	
	return output;
		
};


console.log ('env: ', env);
