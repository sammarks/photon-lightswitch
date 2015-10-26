# Photon Lightswitch

This is a simple API that uses my current location to determine whether or not
a lightswitch should be turned on or off.

I offload the logic to this API to keep the script running on the photon as simple
as possible.

## Ideas

Possible ideas I have for expansion:

- [x] Send a ping to the websocket connection every 10 seconds to verify that the connection is still alive.
- [x] Check cloud conditions in the area (turn the lights on when it's cloudy or
	stormy).
- [ ] Check to see if my phone is connected to the same wireless network as the lights
	(on device, turns the lights out when my phone is not in the area).
- [x] Update the application to use WebSockets [using this repository](https://github.com/hpssjellis/Particle-Spark-Core-Photon-Websocket-Hack).
- [x] Create an Amazon Echo app to support turning the lights on and off by speaking to the Echo.

## Device Codes

- *Y*: Lights on (submissive)
- *N*: Lights off (submissive)
- *F*: Lights on (forceful)
- *O*: Lights off (forceful)
- *P*: Ping (should be sent every 10 seconds from the server)

## Device Firmware

I have added the firmware to this repository (`firmware.ino`). The firmware was written
for a Particle Photon with the following configuration:

- Pin 3 is connected to a button, with the ground going to ground (it's a pullup resistor).
- Pin 5 is connected to a solid state relay, which controls the lights. The positive
	end of the solid state relay goes into this data port, with the ground going to the
	ground connection on the photon.
