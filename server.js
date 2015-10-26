var http = require('http');
var WebSocketServer = require('ws').Server;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sunset = require('./sunset');
var alexa = require('./alexa');
var port = 8480;

console.log('Starting...');

// Global Configuration
var config = {
	latitude: process.env.LATITUDE,
	longitude: process.env.LONGITUDE,
	timezone: process.env.TIMEZONE,
	forecast_io: process.env.FORECAST_IO_KEY
};

// Configure sunset.
sunset.config.latitude = config.latitude;
sunset.config.longitude = config.longitude;
sunset.config.timezone = config.timezone;
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

// Configure the web service.
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
	
	var id = setInterval(function() {
		ws.send('!P', function() {});
	}, 10000);

	ws.on('close', function() {
		console.log('Client disconnected.');
		clearInterval(id);
	});

});

// Initialize services.
sunset.restart();
