
var mysql = require('../lib/mysql');

var all = exports.all = function () {
	mysql.query('SELECT * FROM users limit 10', function(err, rows) {
		if (err) throw (err);
		
		return rows;
	});
};

exports.authenticate = function(username, password, callback) {
	
	var sql = 'SELECT username FROM users WHERE username = ' + mysql.escape(username) 
		+ ' AND password = ' + mysql.escape(password) + ' LIMIT 1';
		
	mysql.query(sql, function(err, rows) {
		if (err) { 
			callback(null);
		}
		
		// insert new row into 'session'
		callback(rows[0]);
		return;
	});	
};
