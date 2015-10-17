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
		!request.body['intent'] ||
		!request.body['intent']['slots'] ||
		!request.body['intent']['slots']['State'] ||
		!request.body['intent']['slots']['State']['value']) {
		response.status(400).end();
		return;
	}
	var state = request.body['intent']['slots']['State']['value'];
	if (state == 'On') {
		Alexa.config.callbacks.on;
	} else if (state == 'Off' || state == 'Out') {
		Alexa.config.callbacks.off;
	}
	response.json({
		version: '1.0',
		shouldEndSession: true
	});
};

module.exports = Alexa;
