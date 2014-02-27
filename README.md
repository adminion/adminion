Administrate your deck
========

## About Adminion
Adminion has been written almost exclusively on [ubuntu](http://www.ubuntu.com) and depends on [node.js](http://nodejs.org) v0.10.x, [OpenSSL](https://www.openssl.org/), [MongoDB](http://www.mongodb.org), and a number of [3rd-party node modules](https://github.com/adminion/adminion/blob/master/package.json#L17).  If anyone wants to try it on windows or mac, please let me know the results :)

## Get Adminion

### Git
The easiest way to get (and later update) adminion is using [git](http://git-scm.com) (the amazing, time-traveling source-code manager!):

	# cd /where/you/want/it/
	# git clone https://github.com/adminion/adminion.git

### Zip
I suppose you could download a zip of the current (or any previous) commit, but I would advise against it.  It probably won't work and will crash with exceptions thrown.  If you can get to the bottom of the problem, it will likely NOT be obvious where I was going or what I was attempting to accomplish... and then if you make any changes, you're going to have one hell of a time merging my updates.  But why go through all that trouble, when [git](http://git-scm.com) will do it for you?

It might be a better idea to download a zip once my release versions actually equate to something more substantial than "a lot of progress in a short period of time; probably still crashes, though! :D".  

Good things come with patience.

## Install Adminion
Now enter the new `adminion` directory and run the setup script inside the setup folder to install:

	# cd adminion/ && ./setup/setup.sh
	
## Start Adminion
The server should now start, unless of course i told it to do something that would prevent it from doing so...which is likely:

	# adminion

## Configure Adminion
All server configuration options are defined within `config.json`.  If an option is omitted, the default value found within `config.default.json` will be used:
```json
{
    "debug": false,
    "cacheUpdateInterval": 300000, 
    "host": "localhost", 
    "https": true,
    "cert": ".ssl/adminion-cert.pem",
    "key": ".ssl/adminion-key.pem",
    "mongodb": "mongodb://localhost/adminion",
    "port": "1337",
    "serverName": "Adminion",
    "session": {
        "cookie": { "maxAge" : 18000000 }, 
        "secret": "$4$1M1KLxrb$h0ynxcy1IZ0wQltG+iqdYZCmcfg$"
    },
    "workers": 1
}
```

### Configuration options

* `debug`: toggles debug output. When set to true, debug is enabled with its default configuration, however an object with configuration settings may be specified--see lib/debug.js for more details. default: `false`
* `cacheUpdateInterval`: the frequency, in seconds, that the database cache is updated. default: `300` // 5 minutes
* `host`: network address to be used. default: `localhost`
* `https`: turns on or off SSL encryption. see [SSL](http://github.com/adminion/adminion#ssl) below for details. default: `true`
* `cert`: path to the certificate. see [SSL](http://github.com/adminion/adminion#ssl) below for details. default: `.ssl/adminion-cert.pem`
* `key`: path to the public key. see [SSL](http://github.com/adminion/adminion#ssl) below for details. default: `.ssl/adminion-key.pem`
* `mongodb
* `port`: port number to be used. default: `1337`
* `serverName`: name of the server. default: `Adminion`
* `session`: an object of options passed to [express.session]()\()

#### Debug
Debug messages are disabled by default, but contributors may find them useful.  

* `marker`: A "marker" (---------) will be printed before and after each debug message enhancing visibility. default: `false`
* `printStack`: print stack traces with each message / variable output. default: `false`

```json
{
    "marker" : true,
    "printStack" : true
}
```

#### SSL
By default, the server employs ssl using .ssl/adminion-key.pem and .ssl/adminion-cert.pem.

If you want to disable SSL encryption, simply set the ssl option to false:
```json
{
	"ssl" :		false
}
```

You may specify the path(s) to your key and/or certificate:
```json
{
	"ssl" :		true
	, "cert" : 	"myServer-cert.pem"
	, "key" : 	"/path/.to/myServer-key.pem"
}
```
The example above will prompt the server to use `./myServer-cert.pem` and `/path/.to/myServer-key.pem`.