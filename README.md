# Photon Lightswitch

This is a simple API that uses my current location to determine whether or not
a lightswitch should be turned on or off.

I offload the logic to this API to keep the script running on the photon as simple
as possible.

## Ideas

Possible ideas I have for expansion:

- Check cloud conditions in the area (turn the lights on when it's cloudy or
	stormy).
- Check to see if my phone is connected to the same wireless network as the lights
	(on device, turns the lights out when my phone is not in the area).
- Update the application to use WebSockets [https://github.com/hpssjellis/Particle-Spark-Core-Photon-Websocket-Hack](using this repository).
- Create an Amazon Echo app to support turning the lights on and off by speaking to the Echo.
