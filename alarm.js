var later = require('later');
var Alarm = {};

Alarm.initialized = false;
Alarm.ids = [];
Alarm.config = {
	alarms: [
		'at 7:20am every Monday, Wednesday and Friday',
		'at 7:50am every Tuesday',
		'at 6:10am every Thursday'
	],
	callbacks: {
		alarm: function () {}
	}
};

Alarm.init = function () {
	if (Alarm.initialized) return;
	Alarm.initialized = true;

	// Use local time.
	later.date.localTime();

	// Loop through each of the alarms and schedule them.
	for (var index in Alarm.config.alarms) {
		if (!Alarm.config.alarms.hasOwnProperty(index)) continue;
		var textSchedule = later.parse.text(Alarm.config.alarms[index]);
		Alarm.ids.push(later.setInterval(Alarm.config.callbacks.alarm, textSchedule));
	}
}

Alarm.clear = function () {
	if (!Alarm.initialized) return;
	Alarm.initialized = false;
	for (var i = 0; i < Alarm.ids.length; i++) {
		Alarm.ids[i].clear();
		delete Alarm.ids[i];
	}
}

module.exports = Alarm;
