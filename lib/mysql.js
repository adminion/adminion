
var mysql 		= require('mysql');
var mysqlAuth	= require('../config/mysqlAuth');

var connection 	= module.exports = mysql.createConnection(mysqlAuth);

connection.connect(function(err) {
	if (err) {
		console.log('MySQL Connection Error: %j',err);
		throw (err);
	} else {
		console.log('connected to mysql database % as %s@%s', mysqlAuth.user);
	}
});