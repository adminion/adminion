adminion
========

administrate your deck.

## installation

	$ git://github.com/adminion/adminion.git
	$ cd adminion && sudo npm install
	
## server configuration

All configuration settings are optional and defaults will be assigned ommitted.
config.json default configuration:
```json
{
	"serverName" : 	"Adminion"
	, "host" : 		"localhost"
	, "port" : 		"1337"
}
```

If you want ssl, define the directory containing your cert and key files:
```json
{
	"serverName" : 	"Adminion"
	, "host" : 		"localhost"
	, "port" : 		"1337"
	, "https" :		".ssl"
}
```


## start the game server

You can either runn app.js directly using node:

	$ node app.js
	
or, you can define your own startup script for logging and such

	$ sudo ./adminion.sh
	
## game configuration
