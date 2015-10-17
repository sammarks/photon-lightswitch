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
	var output = 'OK';
	if (name == 'Lightswitch') {
		var state = request.body['request']['intent']['slots']['State']['value'];
		if (state == 'on') {
			this.config.callbacks.on();
			output = 'Lights on.';
		} else if (state == 'off' || state == 'out') {
			this.config.callbacks.off();
			output = 'Lights out.';
		}
	} else if (name == 'LightswitchGoodmorning') {
		this.config.callbacks.on();
		output = 'Good morning!';
	} else if (name == 'LightswitchGoodnight') {
		this.config.callbacks.off();
		output = 'Goodnight!';
	}
	response.json({
		version: '1.0',
		response: {
			shouldEndSession: true,
			outputSpeech: {
				type: 'PlainText',
				text: output
			}
		}
	});
};

module.exports = Alexa;