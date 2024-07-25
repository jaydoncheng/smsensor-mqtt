export default class SensorAPI {

    mqttclient; address;
    room_id; client_id;

    constructor(_address, _room_id) {
        this.address = _address;
        this.client_id = '' + Math.floor(Math.random() * 1000000);
        this.room_id = _room_id;
    }

    requestPermission() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => { return permissionState === 'granted'; })
                .catch(console.error);
        } else {
            return false;
        }
    }

    startSensors() {
        const topic = "rooms/" + this.room_id;
        if (this.requestPermission()) {
            window.addEventListener('devicemotion', (event) => {
                const _topic = topic + '/' + this.client_id + '/' + 'devicemotion';
                this.mqttclient.publish(_topic, JSON.stringify({
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
                const _topic = topic + '/' + this.client_id + '/' + 'deviceorientation';
                this.mqttclient.publish(_topic, JSON.stringify({
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
        this.room_id = room_id;
        const topic = "rooms/" + room_id;
        console.log('connecting to ' + this.room_id);
        this.mqttclient = mqtt.connect(this.address);
        this.mqttclient.on("connect", () => {
            this.mqttclient.subscribe(topic + '/#', (err) => {
                if (!err) {
                    this.startSensors();
                    this.mqttclient.publish(topic, "Hello mqtt");
                }
            });
        });

        this.mqttclient.on("message", (topic, message) => {
            console.log(topic, message.toString());
            this.mqttclient.end();
        });
    }
}
