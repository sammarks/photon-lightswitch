var http = require('http');
var unirest = require('unirest');
var moment = require('moment-timezone');

console.log('Starting...');

// Downtown Lexington, KY.
const LAT = 38.045407;
const LNG = -84.4992567;
const TZ = 'America/Kentucky/Louisville';

function toLocaleTimezone(time)
{
	var date = new Date();
	return moment.tz(time, 'hh:mm:ss A', 'UTC')
		.month(date.getMonth())
		.day(date.getDay())
		.year(date.getFullYear())
		.tz(TZ);
}

http.createServer(function (request, http_response) {

	// Get the sunrise and sunset for the current location.
	unirest.get('http://api.sunrise-sunset.org/json')
		.query({ lat: LAT, lng: LNG })
		.end(function (response) {
			var sunrise = toLocaleTimezone(response.body['results']['sunrise']);
			var sunset = toLocaleTimezone(response.body['results']['sunset']);
			var current = moment.tz(new Date().getTime(), 'UTC').tz(TZ);
			console.log("Current time: %s", current);
			console.log("Sunrise: %s", sunrise);
			console.log("Sunset: %s", sunset);
			console.log('-----------------');
			if (current > sunrise && current < sunset) {
				http_response.end('off');
			} else {
				http_response.end('on');
			}
		});

}).listen(8480, function() {
	console.log('Server listening on port 8480.');
});
