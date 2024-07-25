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
            DeviceMotionEvent.requestPermission()
                .then(permissionState => { return permissionState === 'granted'; })
                .catch(console.error);
        } else {
            return false;
        }
    }

    startSensors() {
        const publish = (_topic, message) => {
            this.mqttclient.publish(`rooms/${this.room_id}/${topic}/${this.client_id}/${_topic}`, message);
        }
        if (this.requestPermission()) {
            debug('Permission granted');
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
        } else {
            debug('Permission denied');
        }
    }

    connect(room_id = this.room_id) {
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
