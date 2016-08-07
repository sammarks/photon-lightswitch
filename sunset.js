var moment = require('moment-timezone');
var unirest = require('unirest');

var internal = {};
var sunset = {};

// Converts the given timezone to the current locale timezone
// on the current date.
internal.toLocaleTimezone = function (time, current) {
	return moment.tz(time, 'hh:mm:ss A', 'UTC')
		.tz(sunset.config.timezone)
		.month(current.month())
		.date(current.date())
		.year(current.year());
}

internal.currentTime = function () {
	return moment.utc().tz(sunset.config.timezone);
}

sunset.config = {
	latitude: 0,
	longitude: 0,
	timezone: '',
	callbacks: {
		sunrise: function() {},
		sunset: function() {}
	}
};

sunset.restart = function () {

	// Get the sunrise and sunset for the current location.
	unirest.get('http://api.sunrise-sunset.org/json')
		.query({ lat: sunset.config.latitude, lng: sunset.config.longitude })
		.end(function (response) {

			// Make sure we have a valid result.
			if (!response.body['results']['sunrise'] || !response.body['results']['sunset']) return;

			// Break it up into some variables.
			var current = internal.currentTime();
			internal.sunrise = internal.toLocaleTimezone(response.body['results']['sunrise'], current);
			internal.sunset = internal.toLocaleTimezone(response.body['results']['sunset'], current);
			internal.tomorrow = current.clone().hours(0).minutes(0).seconds(0).add(1, 'day');

			// Do some logging.
			console.log("Current: %s", current);
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
	setTimeout(sunset.sunset, secondsToSunset * 1000);
	sunset.config.callbacks.sunrise();
};

sunset.sunset = function () {
	var secondsToTomorrow = internal.tomorrow.unix() - internal.currentTime().unix();
	setTimeout(sunset.restart, secondsToTomorrow * 1000);
	sunset.config.callbacks.sunset();
};

sunset.current = function () {
	var current = internal.currentTime();
	if (current > internal.sunrise && current < internal.sunset) {
		sunset.config.callbacks.sunrise();
	} else {
		sunset.config.callbacks.sunset();
	}
};

/**
 * Gets the current status of the lightbulb as a boolean.
 * @return {bool} Whether or not the light should be on based on sunrise.
 */
sunset.getCurrent = function () {
	var current = internal.currentTime();
	return !(current > internal.sunrise && current < internal.sunset);
}

module.exports = sunset;
