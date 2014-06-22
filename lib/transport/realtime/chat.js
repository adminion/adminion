
// 3rd party
var debug = require('debug')('adminion:transport:realtime:chat'),
    passportSocketio = require('passport.socketio');

module.exports = function (io, data, authOptions) {

    var chat = io.of('/chat')
        .use(passportSocketio.authorize(authOptions))
        .on('connect', onConnect);

    function onConnect (socket) {

        socket.on('disconnect', onDisconnect)
            .on('message', onMessage)
            .on('join', onJoin);

        function onDisconnect () {
            
        }

        function onJoin () {
            
        }

        function onMessage (msg) {

            games.in(gameID).emit('chat', msg.displayName, msg.text);

            return true;
        };

    }

}
