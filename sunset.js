var moment = require('moment-timezone');
var unirest = require('unirest');

var internal = {};
var sunset = {};

// Converts the given timezone to the current locale timezone
// on the current date.
internal.toLocaleTimezone = function (time, current) {
	var date = new Date();
	return moment.tz(time, 'hh:mm:ss A', 'UTC')
		.month(current.month())
		.day(current.day())
		.year(current.year())
		.tz(sunset.config.timezone);
}

internal.currentTime = function () {
	return moment.tz(new Date().getTime(), 'UTC').tz(sunset.config.timezone);
}

sunset.config = {
	latitude: 38.045407, // Downtown Lexington, KY
	longitude: -84.4992567,
	timezone: 'America/Kentucky/Louisville',
	callbacks: {
		sunrise: function() {},
		sunset: function() {}
	}
};

sunset.restart = function () {

	var sunset = this;

	// Get the sunrise and sunset for the current location.
	unirest.get('http://api.sunrise-sunset.org/json')
		.query({ lat: this.config.latitude, lng: this.config.longitude })
		.end(function (response) {

			// Make sure we have a valid result.
			if (!response.body['results']['sunrise'] || !response.body['results']['sunset']) return;

			// Break it up into some variables.
			var current = internal.currentTime();
			internal.sunrise = internal.toLocaleTimezone(response.body['results']['sunrise'], current);
			internal.sunset = internal.toLocaleTimezone(response.body['results']['sunset'], current);
			internal.tomorrow = current.clone().hours(0).minutes(0).seconds(0).add(1, 'day');

			// Do some logging.
			console.log("Sunrise: %s", internal.sunrise);
			console.log("Sunset: %s", internal.sunset);
			console.log('-----------------');

			// Figure out where we are in the day.
			if (current < internal.sunrise) {
				var secondsToSunrise = internal.sunrise.unix() - current.unix();
				setTimeout(sunset.sunrise, secondsToSunrise * 1000);
				console.log("Waiting %d seconds to sunrise.", secondsToSunrise);
			} else if (current < internal.sunset) {
				var secondsToSunset = internal.sunset.unix() - current.unix();
				setTimeout(sunset.sunset, secondsToSunset * 1000);
				console.log("Waiting %d seconds to sunset.", secondsToSunset);
			} else {
				var secondsToTomorrow = internal.tomorrow.unix() - current.unix();
				setTimeout(sunset.restart, (secondsToTomorrow * 1000) + 30000); // 30 second delay for kicks.
				console.log("Waiting %d seconds to tomorrow.", secondsToTomorrow);
			}

			// Send the current status.
			sunset.current();

		});

};

sunset.sunrise = function () {
	var secondsToSunset = internal.sunset.unix() - internal.currentTime().unix();
	setTimeout(this.sunset, secondsToSunset * 1000);
	this.config.callbacks.sunrise();
};

sunset.sunset = function () {
	var secondsToTomorrow = internal.tomorrow.unix() - internal.currentTime().unix();
	setTimeout(this.restart, secondsToTomorrow * 1000);
	this.config.callbacks.sunset();
};

sunset.current = function () {
	var current = internal.currentTime();
	if (current > internal.sunrise && current < internal.sunset) {
		this.config.callbacks.sunrise();
	} else {
		this.config.callbacks.sunset();
	}
};

module.exports = sunset;
