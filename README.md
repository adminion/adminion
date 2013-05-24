adminion
========

administrate your deck

## Installation

adminion depends on node and mongodb

	# apt-get update && apt-get install mongodb node

installation is easy

	$ git clone git://github.com/adminion/adminion.git
	$ cd adminion && sudo npm install
	
## Start the game server

You can either run app.js directly using node:

	$ node app.js
	
or, you can define your own startup script for logging and such:

	$ sudo ./adminion.sh

## Server configuration
All server configuration settings are optional and defined within `config.json`.  If settings are omitted, default values will be used.

### default config.json
```json
{
	"serverName" : 	"Adminion"
	, "host" : 		"localhost"
	, "port" : 		"1337"
}
```

### Configuration settings

* `serverName`: name of the server. default: `Adminion`
* `host`: network address to be used. default: `localhost`
* `port`: port number to be used. default: `1337`
* `https`: turns on or off SSL encryption. see below for details. default: `false`
* `cert`: path to the certificate. see [SSL](http://github.com/adminion/adminion#SSL) below. default: `adminion-cert.pem`
* `key`: path to the public key. see [SSL](http://github.com/adminion/adminion#SSL) below. default: `adminion-key.pem`

### SSL
If you want to use ssl with default settings:
```json
{
	"serverName" : 	"Adminion"
	, "host" : 		"localhost"
	, "port" : 		"1337"
	, "https" :		"true"
}
```

#### Generate key and certificate
You may want to just generate a key and self-signed certificate pair with default names:

	# ./gen-key-sign-cert.sh
*the example above will generate .ssl/adminion-key.pem and .ssl/adminion-cert.pem.*
	
You may optionally provide a server name to prepend to cert and key files:

	# ./gen-key-sign-cert.sh serverName
	
*the example above will generate .ssl/serverName-key.pem and .ssl/serverName-cert.pem.*

#### Custom path and filenames	
If you gave your own filenames, or want to serve your key and certificate elsewhere:
```json
{
	"serverName" : 	"Adminion"
	, "host" : 		"localhost"
	, "port" : 		"1337"
	, "https" :		"/path/to/.ssl"
	, "cert" : 		"my-cert.pem"
	, "key" : 		"my-key.pem"
}
```
