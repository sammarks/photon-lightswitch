// Setup some of our internal variables.
bool lightOn = true; // This will be reversed on setup.
bool lightShouldBeOn = false;
bool oldLightShouldBeOn = false;
int lightOutput = D5; // PIN: Light output.
int buttonPin = D3; // PIN: Button input pin.

// Debouncing variables.
int buttonState;
int lastButtonState = LOW;
long lastDebounceTime = 0;
long debounceDelay = 50;

// Connection variables.
long lastConnectTime = 0;
long connectDelay = 10000;
long lastPing = 0;
long pingTimeout = 25000;

char server[] = ""; // TODO: Change server IP.
TCPClient client;

int connectToServer() {
    Spark.publish("log_event", "Connecting to server.");
    if (client.connect(server, 8080)) { // TODO: Enter port.
        client.write("GET / HTTP/1.1\r\n");
        client.write("Host: \r\n"); // TODO: Enter server host.
        client.write("Upgrade: websocket\r\n");
        client.write("Connection: Upgrade\r\n");
        client.write("Sec-WebSocket-Key: \r\n"); // TODO: Enter server websocket key (random hash seems to work for me).
        client.write("Sec-WebSocket-Version: 13\r\n");
        client.write("\r\n");
        
        Spark.publish("log_event", "Connection established. Request sent.");
        lastPing = millis(); // Update the last ping.
        return 1;
    } else {
        Spark.publish("log_event", "Could not connect.");
        return -1;
    }
}

int closeConnection() {
    
    while (client.read() >= 0);
    client.stop();
    
    return 1;
    
}

void setup() {
    
    // Setup the pin modes.
    pinMode(lightOutput,OUTPUT);
    digitalWrite(lightOutput,LOW);
    pinMode(buttonPin,INPUT_PULLUP);
    
    // Connect to the server.
    connectToServer();
    
}

void checkButtonStatus() {
    
    // Read the value of the button.
    int reading = digitalRead(buttonPin);
    if (reading != lastButtonState) {
        lastDebounceTime = millis();
    }
    
    if ((millis() - lastDebounceTime) > debounceDelay) {
        if (reading != buttonState) {
            buttonState = reading;
            if (buttonState == HIGH) {
                
                // The button was pressed, toggle the light.
                forceLightStatus(!lightOn);
                
            }
        }
    }
    
    // Save the last button state.
    lastButtonState = reading;
    
}

void forceLightStatus(bool on) {
    lightOn = on;
    Spark.publish("light_change", on ? "force on" : "force off");
    digitalWrite(lightOutput, lightOn ? HIGH : LOW);
}

void setLightStatus(bool on) {
    
    // Update the variables.
    oldLightShouldBeOn = lightShouldBeOn;
    lightShouldBeOn = on;
    Spark.publish("light_change", on ? "on" : "off");
    
    // If the old and new values differ.
    if (oldLightShouldBeOn != lightShouldBeOn && lightShouldBeOn != lightOn) {
        lightOn = lightShouldBeOn;
        digitalWrite(lightOutput, lightOn ? HIGH : LOW);
    }
    
}

void loop() {
    
    checkButtonStatus();
    
    // Make the request and get the response.
    if (client.connected()) {
        if (client.available()) {
            char myIncoming = client.read();
            if (myIncoming == '!') {
                char code = client.read();
                if (code == 'Y') { setLightStatus(true); }
                if (code == 'N') { setLightStatus(false); }
                if (code == 'F') { forceLightStatus(true); }
                if (code == 'O') { forceLightStatus(false); }
                if (code == 'P') { Spark.publish("ping", "PONG!"); lastPing = millis(); }
            }
        }
    } else if ((millis() - lastConnectTime) > connectDelay) {
        Spark.publish("connection", "Not connected. Retrying connection.");
        lastConnectTime = millis();
        connectToServer();
    }
    
    // Check if the server is still there.
    if ((millis() - lastPing) > pingTimeout && (millis() - lastConnectTime) > connectDelay) {
        Spark.publish("connection", "Not connected. Heartbeat failed. Retrying connection.");
        lastConnectTime = millis();
        connectToServer();
    }
    
}
