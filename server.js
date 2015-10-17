var http = require('http');
var WebSocketServer = require('ws').Server;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sunset = require('./sunset');
var alexa = require('./alexa');
var port = 8480;

console.log('Starting...');

// Configure sunset.
sunset.config.callbacks.sunrise = function () {
	wss.broadcast('!N');
}
sunset.config.callbacks.sunset = function () {
	wss.broadcast('!Y');
}

// Configure alexa.
alexa.config.callbacks.on = function () {
	wss.broadcast('!F');
}
alexa.config.callbacks.off = function () {
	wss.broadcast('!O');
}

app.use(express.static(__dirname + '/'));
app.use(bodyParser.json());

// POST /
app.post('/', function (req, res) {
	alexa.handle(req, res);
});

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log("websocket server created");

wss.broadcast = function(data) {
	if (!this.clients || this.clients.length <= 0) {
		console.log('No clients to broadcast to!');
	}
	for (var i in this.clients) {
		this.clients[i].send(data);
		console.log('sent to client[' + i + '] ' + data);
	}
}

wss.on('connection', function(ws) {

	console.log('Client connected.');

	// Send the current sunset status.
	sunset.current();

	ws.on('close', function() {
		console.log('Client disconnected.');
	});

});

// Begin sunset.
sunset.restart();
