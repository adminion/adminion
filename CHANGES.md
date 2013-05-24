## v0.2.3*
* no longer tracking .ssl/ - need to be generated per-machine
* created script to generate key/signed-cert required for https out-of-box
* updated how lib/config.js handles "https" configuration option
  * "true" or a filesystem path will enable https
  * if "true" the default directory .ssl/ will be used as prefix
  * otherwise the given path with be used as prefix
* updated lib/ssl.js to reflect changes to lib/config.js
* updated config.json "https" option value to "true" to reflect changes to lib/config.js
* updated package.json to reflect new version

### todo
* serve user-interface
* define user-interface
* build library to support user-interface
* port game library to server

## v0.2.2*
* https works!
* configuration is now set in config.json
* automatic http/https server creation

### issues / todo
* GET / is resolving to 404 even with route and static /index.html file
* finish authentication module
* develop user-interface
* model real-time communication module after UI

## v0.2.1*
starting to make a lot more sense. weird ssl error. …

    crypto.js:84
          c.context.setKey(options.key);
                    ^
    Error: error:0906D06C:PEM routines:PEM_read_bio:no start line
        at Object.exports.createCredentials (crypto.js:84:17)
        at Server (tls.js:1062:28)
        at new Server (https.js:34:14)
        at Object.exports.createServer (https.js:49:10)
        at Object.<anonymous> (/home/jeff/git/adminion/app.js:65:7)
        at Module._compile (module.js:449:26)
        at Object.Module._extensions..js (module.js:467:10)
        at Module.load (module.js:356:32)
        at Function.Module._load (module.js:312:12)
        at Module.runMain (module.js:492:10)

## v0.2.0*
commit msg:
> This diff is too big to show! We're showing status information only.
> Showing 1,028 changed files with 108,687 additions and 227,919 deletions.
