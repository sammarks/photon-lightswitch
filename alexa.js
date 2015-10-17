var Alexa = {};
var internals = {};

Alexa.config = {
	callbacks: {
		on: function () {},
		off: function () {}
	}
};

Alexa.handle = function (request, response) {
	console.log(request.body); // For debug.
	if (!request.body ||
		!request.body['request'] ||
		!request.body['request']['intent'] ||
		!request.body['request']['intent']['name'] ||
		!request.body['request']['intent']['slots'] ||
		!request.body['request']['intent']['slots']['State'] ||
		!request.body['request']['intent']['slots']['State']['value']) {
		response.status(400).end();
		return;
	}
	var name = request.body['request']['intent']['name'];
	if (name == 'Lightswitch') {
		var state = request.body['request']['intent']['slots']['State']['value'];
		if (state == 'On') {
			Alexa.config.callbacks.on;
		} else if (state == 'Off' || state == 'Out') {
			Alexa.config.callbacks.off;
		}
	} else if (name == 'LightswitchGoodmorning') {
		Alexa.config.callbacks.on;
	} else if (name == 'LightswitchGoodnight') {
		Alexa.config.callbacks.off;
	}
	response.json({
		version: '1.0',
		shouldEndSession: true
	});
};

module.exports = Alexa;
