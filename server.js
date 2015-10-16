var http = require('http');
var unirest = require('unirest');
var moment = require('moment-timezone');
var WebSocketServer = require('ws').Server;
var express = require('express');
var app = express();
var port = 8480;

// Downtown Lexington, KY.
const LAT = 38.045407;
const LNG = -84.4992567;
const TZ = 'America/Kentucky/Louisville';

function toLocaleTimezone(time, current)
{
	var date = new Date();
	return moment.tz(time, 'hh:mm:ss A', 'UTC')
		.month(current.month())
		.day(current.day())
		.year(current.year())
		.tz(TZ);
}

console.log('Starting...');

app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log("websocket server created");

wss.broadcast = function(data) {
	for (var i in this.clients) {
		this.clients[i].send(data);
		console.log('sent to client[' + i + '] ' + data);
	}
}

wss.sendCurrentConditions = function() {

	// If we have no clients, don't do anything.
	if (!this.clients || this.clients.length <= 0) {
		console.log('No clients.');
		return;
	}

	// Get the sunrise and sunset for the current location.
	unirest.get('http://api.sunrise-sunset.org/json')
		.query({ lat: LAT, lng: LNG })
		.end(function (response) {
			var current = moment.tz(new Date().getTime(), 'UTC').tz(TZ);
			var sunrise = toLocaleTimezone(response.body['results']['sunrise'], current);
			var sunset = toLocaleTimezone(response.body['results']['sunset'], current);
			console.log("Current time: %s", current);
			console.log("Sunrise: %s", sunrise);
			console.log("Sunset: %s", sunset);
			console.log('-----------------');
			if (current > sunrise && current < sunset) {
				wss.broadcast('N');
			} else {
				wss.broadcast('Y');
			}
		});

}

wss.on('connection', function(ws) {

	console.log('Client connected.');

 	// Send the current conditions on new connection.
	wss.sendCurrentConditions();

	console.log('websocket connection open ');
	ws.on('message', function(message) {
		console.log('received: %s', message);
		wss.broadcast(message);
	});

	ws.on('close', function() {
		console.log('Client disconnected.');
	});

});

setInterval(wss.sendCurrentConditions, 10000); // Send the current conditions every 10 seconds.
