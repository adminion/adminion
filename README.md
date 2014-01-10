Adminion
========

Administrate your deck

Adminion is under heavy development.  Its likely going to crash on you... issues/pull requests...?

## System Dependencies
Adminion depends on [node](http://nodejs.org) and [mongodb](http://www.mongodb.org).  

### Ubuntu

	# apt-get update && apt-get install node mongodb

### Mac OS X

	# brew update && brew install node mongodb

### Windows 
Although I have not really tried to make it run on windows, theoretically, it should work fine.

## Get Adminion
The easiest way to get (and later update) adminion is using git:

	$ cd /where/you/want/it/
	$ git clone git://github.com/adminion/adminion.git

### Install required Node Modules
Now use npm to install all module dependencies and create the default admin user:

	$ cd adminion/ && sudo npm install
	
## Start the game server

	# ./adminion.sh

## Server configuration
All server configuration options are defined within `config.json`.  If an option is omitted, the default value will be used.

### Configuration options

* `debug`: toggles debug output. default: `false`
* `cacheUpdateInterval`: the frequency, in milliseconds, that the database cache is updated. default: `5 * 60 * 1000` // 5 minutes
* `serverName`: name of the server. default: `Adminion`
* `host`: network address to be used. default: `localhost`
* `port`: port number to be used. default: `1337`
* `ssl`: turns on or off SSL encryption. see [SSL](http://github.com/adminion/adminion#ssl) below for details. default: `true`
* `cert`: path to the certificate. see [Custom paths](http://github.com/adminion/adminion#custom-paths) below for details. default: `.ssl/adminion-cert.pem`
* `key`: path to the public key. see [Custom paths](http://github.com/adminion/adminion#custom-paths) below for details. default: `.ssl/adminion-key.pem`

### SSL
By default, the server employs ssl using .ssl/adminion-key.pem and .ssl/adminion-cert.pem.

If you want to disable SSL encryption, simply set the ssl option to false:
```json
{
	"ssl" :		false
}
```

#### Custom paths
You may specify the path(s) to your key and certificate. 
```json
{
	"ssl" :		true
	, "cert" : 	"myServer-cert.pem"
	, "key" : 	"/path/.to/myServer-key.pem"
}
```
The example above will prompt the server to use `./myServer-cert.pem` and `/path/.to/myServer-key.pem`.
	
## Start the game server
We're now ready to start the server!

	# ./adminion.sh

Once installed, the adminionator will be the only account that may logon and is also the only account that can change system settings and CRUD accounts

### Change adminionator password
We recommend you change the default password ('adminion') to something a bit more secure:

	https://localhost:1337/accounts/adminionator/update

After logging on, enter the new password, verify it, then click "Update" to save. 

### Create an account
We also recommend you create your own user account for hosting and playing games:

	https://localhost:1337/accounts/create
	
