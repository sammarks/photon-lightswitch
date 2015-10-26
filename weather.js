var Forecast = require('forecast');

var Weather = {};

Weather.config = {
	forecast_io: '', // Forecast.IO API key.
	latitude: 0,
	longitude: 0,
	timezone: '',
	cloud_cover_threshold: 0.5,
	callbacks: {
		statusChanged: function (on) {}
	}
};

Weather.initialize = function (check) {
	Weather.forecast = new Forecast({
		service: 'forecast.io',
		key: Weather.config.forecast_io,
		units: 'f',
		cache: false
	});
	Weather.previousState = -1;
	setInterval(Weather.checkForecast, 1000 * 60 * 10); // Check the forecast every 10 minutes.
	if (check) {
		Weather.checkForecast(true);
	}
};

Weather.checkForecast = function (force) {
	console.log('[weather] Checking Forecast');
	Weather.forecast.get([Weather.config.latitude, Weather.config.longitude], function (err, weather) {
		if (err) {
			console.log('ERROR fetching weather data.');
			console.dir(err);
		} else if (typeof(weather['currently']) !== 'undefined' &&
			typeof(weather['currently']['cloudCover']) !== 'undefined') {
			console.log('Cloud Cover: %s', weather['currently']['cloudCover']);
			var on = weather['currently']['cloudCover'] > Weather.config.cloud_cover_threshold;
			if (on != Weather.previousState || force) {
				Weather.previousState = on;
				Weather.config.callbacks.statusChanged(on);
			}
		} else {
			console.log('ERROR fetching weather data. Response schema incorrect.');
			console.dir(err);
		}
	});
};

module.exports = Weather;
