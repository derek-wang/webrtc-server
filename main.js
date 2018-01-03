var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync('45946636_snf-647197.vm.okeanos.grnet.gr.key'),
    cert: fs.readFileSync('45946636_snf-647197.vm.okeanos.grnet.gr.cert')
};

//var app = require('http').createServer();
var server = https.createServer(options, function (req, res) {
  res.statusCode = 200;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("server created");
});

var io = require('socket.io')(server, {
  transports: ['polling', 'websocket']
});
server.listen(5000);

var channels = {};
var UserIds = {};
/**io.on('connection', function (socket) {
  console.log("connected");
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});**/

io.sockets.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }

    console.log("connected");
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      console.log(data);
    });

    socket.on('new-channel', function (data) {
        if (!channels[data.channel]) {
            initiatorChannel = data.channel;
        }

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !!channels[channel];
        socket.emit('presence', isChannelPresent);
    });

    socket.on('initUser', function (userid) {
        if (!UserIds[userid]) {
            UserIds[userid] = userid;
        }
        console.log(UserIds);
        socket.emit('initUser', userid);
    });




    socket.on('request', function (data) {
        socket.broadcast.emit('request', data);

    });


    socket.on('disconnect', function (channel) {
        if (initiatorChannel) {
            delete channels[initiatorChannel];
        }
    });
});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        var username;
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }

        socket.on('message', function (data) {
            if (data.sender == sender) {
                if (!username) username = data.data.sender;

                socket.broadcast.emit('message', data.data);
            }
        });

        socket.on('disconnect', function () {
            if (username) {
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
    });
}
