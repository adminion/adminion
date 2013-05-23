Adminion
========

Administrate your deck

## Installation
Adminion depends on node and mongodb.  To install on debian/ubuntu:

	# apt-get update && apt-get install mongodb node
	
## Getting Adminion
The easiest way to get (and later update) adminion is using git:

	$ cd /where/you/want/it
	$ git clone git://github.com/adminion/adminion.git

## Installation is easy
Once you have adminion, get in there and install all module-based dependancies:
	
	$ cd adminion && sudo npm install
	
## Start the game server
You can either run app.js directly using node:

	$ node app.js
	
or, you can define your own startup script for logging and such:

	$ sudo ./adminion.sh

## Server configuration
All server configuration options are defined within `config.json`.  If an option is omitted, the default value will be used.

### Configuration options

* `serverName`: name of the server. default: `Adminion`
* `host`: network address to be used. default: `localhost`
* `port`: port number to be used. default: `1337`
* `ssl`: turns on or off SSL encryption. see [SSL](http://github.com/adminion/adminion#SSL) below for details. default: `false`
* `cert`: path to the certificate. see [Custom paths](http://github.com/adminion/adminion#custom-paths) below for details. default: `adminion-cert.pem`
* `key`: path to the public key. see [Custom paths](http://github.com/adminion/adminion#custom-paths) below for details. default: `adminion-key.pem`

### SSL
If you want to enable SSL encryption using the default key and certificate files:
```json
{
	"ssl" :		true
}
```
The example above will prompt the server to use `.ssl/adminion-cert.pem` and `.ssl/adminion-key.pem`.  To generate your own key and self-signed certificate see [Generate key and self-signed certificate](http://github.com/adminion/adminion#generate-key-and-self-signed-certificate) below.

#### Custom paths
You may specify the path(s) to your key and certificate.  Both absolute and relative paths are accepted.  Relative paths resolve to `.ssl/`
```json
{
	"ssl" :		true
	, "cert" : 	"myServer-cert.pem"
	, "key" : 	"/path/.to/myServer-key.pem"
}
```
The example above will prompt the server to use `.ssl/myServer-cert.pem` and `/path/.to/myServer-key.pem`.

#### Generate key and self-signed certificate
You can generate a key and self-signed certificate pair with default names using:

	# ./gen-key-signed-cert.sh
*The example above will generate `.ssl/adminion-key.pem` and self-signed `.ssl/adminion-cert.pem`.*
	
You may optionally provide a server name to prepend to cert and key files:

	# ./gen-key-signed-cert.sh /path/.to/myServer
*The example above will generate `/path/.to/myServer-key.pem` and self-signed `/path/.to/myServer-cert.pem`.*
