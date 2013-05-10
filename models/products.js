
/*
 * A L L   P R O D U C T S
 */

var mysql = require('../lib/mysql');

function queryError(err) {
	console.log('mysql error: %j',err);
	throw(err);
};

function get(offset, count, callback) {
	// if undefined, set default values defined here
	count 	= typeof (count) !== 'undefined' 	? count 	: 10;
	offset 	= typeof (offset) !== 'undefined' 	? offset 	: 0;
	
	if (typeof(callback) === 'undefined') {
		throw ('products model - error: callback must be defined! ');
	}
	
	console.log('count: %j',count);
	console.log('offset: %j',offset);
	
	sql = 'SELECT * FROM products LIMIT ?, ?';
	
	var query = mysql.query(sql, [offset, count], function(err, rows) {		
		if (err) { 
			queryError(err);
		} else {
			console.log('asdf');
			callback(rows);
		}
	});
	
	console.log(query.sql);
};

function one(id, callback) {
	// 
	if (typeof(id) === 'undefined') {
		throw ('products model - error: id must be defined!');
	} 
	
	if (typeof(callback) === 'undefined') {
		throw ('products model - error: callback must be defined! ');
	}	
		
	var sql = "SELECT * FROM products WHERE id = " + mysql.escape(id) + " LIMIT 1";
	var query = mysql.query(sql, function (err, rows) {
		if (err || rows.length === 0) { 
			console.warn('unable to find product with id: "%s".',id);
			callback(false);
		} else {
			console.info('found product %s: %j', id, rows);
			callback (rows[0]);
		}
	}); 
	
	console.log('sql: %s', query.sql);
};
	
/* 
 * E X I S T S
 */

function exists (id, callback) {
	console.info('checking for product with id "%s"...', id);
	
	var sql = 'SELECT id FROM products WHERE ? LIMIT 1';
	mysql.query(sql, {id: mysql.escape(id)}, function (err, rows) {
		if (err) { 
			console.warn('unable to find product with id: "%s".',id);
			callback(false);
		} else {
			console.info('found product %s', id);
			callback(true);
		}
	}); 
};


/*
 * A D D  
 */

function add(product, callback) {
	var sql = "INSERT INTO products (name, description, price, active) VALUES (?, ?, ?, ?)";
	var values = [product.name, product.description, product.price, product.active];
	
	var query = mysql.query(sql, values, function(err, response) {
		
		console.log('err: %j', err);
		console.log('response: %j', response);
		
		if (response) {
			console.log('product[%d] added: %j', response.insertId, product);
			callback(response.insertId);
		} else {
			console.warn('error while adding product: %j', err);
			callback(false);
		} 
	});
	
	console.log('query: %j', query.sql);
};

/*
 * U P D A T E 
 */

function update(product, callback) {
	exists(product.id, function(found) {
		if (!found) {
			return false;
		} 
		
		var sql = "UPDATE products SET name = ?, description = ?, price = ?, active = ? WHERE id = ?";
		
		var values = [product.name, product.description, product.price, product.active, product.id];
		
		var query = mysql.query(sql, values, function(err, rows) {
			if (err) { 
				console.warn('error while updating product: %j', err);
				callback(false);
			} else {
				console.info('updated product: %j', product);
				callback(product.id);
			}
		});
		
		console.log('query: %j', query.sql);
	});
};

/* 
 * T O G G L E   A C T I V E
 */

function toggleActive(id) {
	if (!exists(id)) {
		return false;
	}
	
	product = one(id);
	
	product.id = ('on') ? 'on' : '';
		
	return update(product);
	
};

/*
 * T E M P L A T E
 */

function template() {
	return {
		name: '', 
		description: '',
		price: 0,
		active: true
	};
};

/*
 * E X P O R T S 
 */

module.exports = {
	get: 			get,
	add: 			add,
	one: 			one,
	update: 		update,
	toggleActive: 	toggleActive,
	template: 		template
};

