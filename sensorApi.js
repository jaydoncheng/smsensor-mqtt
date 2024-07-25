function debug(msg) {
    document.getElementById('debug').innerText += '\n' + msg;
}

export default class SensorAPI {

    mqttclient; address;
    room_id; client_id;

    constructor(_address, _room_id) {
        this.address = _address;
        this.client_id = '' + Math.floor(Math.random() * 1000000);
        this.room_id = _room_id;
    }

    requestPermission() {
        if (typeof DeviceMotionEvent === 'undefined') {
            debug('This device does not support Motion Events.');
            return false;
        }

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            debug('DeviceMotionEvent.requestPermission is a function.')
            DeviceMotionEvent.requestPermission()
                .then(permissionState => { 
                    debug('permissionState: ' + permissionState);
                    return permissionState === 'granted'; 
                }).catch(error => { 
                    debug('requestPermission error: ' + error);
                    return false;
                });
        } else {
            debug('DeviceMotionEvent.requestPermission is not a function.');
            return false;
        }
    }

    startSensors() {
        const publish = (_topic, message) => {
            this.mqttclient.publish(`rooms/${this.room_id}/${this.client_id}/${_topic}`, message);
        }
        const p = this.requestPermission();
        debug('request permission: ' + p);
        if (p) {
            window.addEventListener('devicemotion', (event) => {
                publish('devicemotion', JSON.stringify({
                    client_id: this.client_id,
                    type: event.type,
                    timestamp: event.timeStamp,
                    x: event.acceleration.x,
                    y: event.acceleration.y,
                    z: event.acceleration.z,
                    xg: event.accelerationIncludingGravity.x,
                    yg: event.accelerationIncludingGravity.y,
                    zg: event.accelerationIncludingGravity.z,
                }));
            });
            window.addEventListener('deviceorientation', (event) => {
                publish('deviceorientation', JSON.stringify({
                    client_id: this.client_id,
                    type: event.type,
                    timestamp: event.timeStamp,
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma,
                }))
            })
        }
    }

    connect(room_id = this.room_id) {
        if (this.mqttclient) { this.mqttclient.end(); }

        this.room_id = room_id;
        const topic = "rooms/" + room_id;
        debug('Connecting to ' + this.room_id);

        this.mqttclient = mqtt.connect(this.address);
        this.mqttclient.on("connect", () => {
            this.mqttclient.subscribe(topic + '/#', (err) => {
                if (!err) {
                    this.startSensors();
                    this.mqttclient.publish(topic, "Hello mqtt from " + this.client_id);
                }
            });
        });

        this.mqttclient.on("message", (topic, message) => {
            console.log(topic, message.toString());
            debug(message.toString());
        });
    }
}
