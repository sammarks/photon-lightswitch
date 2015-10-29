var http = require('http');
var WebSocketServer = require('ws').Server;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Random = require('random-js');
var sunset = require('./sunset');
var alexa = require('./alexa');
var weather = require('./weather');
var alarm = require('./alarm');
var port = 8480;

console.log('Starting...');

// Global Configuration
var config = {
	latitude: process.env.LATITUDE,
	longitude: process.env.LONGITUDE,
	timezone: process.env.TZ,
	forecast_io: process.env.FORECAST_IO_KEY,
	alarm_max: 100, // The number of times to turn the lights on and off for an alarm.
	alarm_time_min: 1000,
	alarm_time_max: 3000,
	rave_mode_interval: 500,
	rave_mode_cycles: 20
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

// Configure weather.
weather.config.latitude = config.latitude;
weather.config.longitude = config.longitude;
weather.config.timezone = config.timezone;
weather.config.forecast_io = config.forecast_io;
weather.config.callbacks.statusChanged = function (on) {
	if (sunset.getCurrent()) return; // If the lights are supposed to be on, leave them on.
	if (on) {
		wss.broadcast('!Y');
	} else {
		wss.broadcast('!N');
	}
}

// Configure alarm.
var alarm_count = 0;
var alarm_light_on = false;
alarm.config.callbacks.alarm = function () {

	// Initial message.
	if (alarm_count === 0) {
		console.log('DING DING DING WE WOO WE WOO DING DING');
	}

	// Process the alarm.
	alarm_light_on = !alarm_light_on;
	wss.broadcast(alarm_light_on ? '!F' : '!O');
	alarm_count++;
	if (alarm_count > config.alarm_max) {
		alarm_count = 0;
		alarm_light_on = false;
		wss.reset();
	} else {
		var engine = Random.engines.mt19937().autoSeed();
		setTimeout(alarm.config.callbacks.alarm, Random.integer(config.alarm_time_min, config.alarm_time_max)(engine));
	}
	
}

// Configure alexa.
alexa.config.callbacks.on = function () {
	wss.broadcast('!F');
}
alexa.config.callbacks.off = function () {
	wss.broadcast('!O');
}
alexa.config.callbacks.rave = function () {
	var count = 0;
	var on = false;
	console.log('TURN DOWN FOR WHAT');
	var id = setInterval(function () {
		on = !on;
		wss.broadcast(on ? '!F' : '!O');
		count++;
		if (count > config.rave_mode_cycles) {
			clearInterval(id);
			wss.reset();
		}
	}, config.rave_mode_interval);
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
		console.log('No clients to broadcast %s to!', data);
	}
	for (var i in this.clients) {
		this.clients[i].send(data);
		console.log('sent to client[' + i + '] ' + data);
	}
}

wss.on('connection', function(ws) {

	console.log('Client connected.');

	// Send the current sunset and weather status.
	wss.sendInitial();
	
	var id = setInterval(function() {
		ws.send('!P', function() {});
	}, 10000);

	ws.on('close', function() {
		console.log('Client disconnected.');
		clearInterval(id);
	});

});

wss.reset = function () {
	wss.broadcast('!Y');
	wss.broadcast('!N');
	wss.sendInitial();
}

wss.sendInitial = function () {
	sunset.current();
	weather.checkForecast(true);
}

// Initialize services.
sunset.restart();
weather.initialize(true);
alarm.init();
