

var app = require('./lib/')
	, root = require('./controllers/root')
//	, products = require('./controllers/products');

var port = app.config.express.port;

app.locals = {env: app.env};

/*
 * /  
 */

app.get('/', root.index);
app.get('/logon', root.logon);
app.get('/logoff', root.logoff);
app.post('/auth', root.auth);


/*
 * / P R O D U C T S
 */

app.get('/products', app.auth, products.get.index);
app.get('/products/add', app.auth, products.get.add);
app.post('/products', app.auth, products.post);
app.get('/products/:id', app.auth, products.get.one);
app.get('/products/:id/edit', app.auth, products.get.edit);
app.put('/products/:id', app.auth, products.put);

app.listen(port, function() {
	console.log('express server listening: http://localhost:%d.', port);
});


