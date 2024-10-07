function debug(msg) {
    document.getElementById('debug').innerText += '\n' + msg
}

export default class SensorAPI {
    wsclient
    address
    room_id
    client_id

    constructor(_address, _room_id) {
        this.address = _address
        const d = Date.now().toString()
        this.client_id = '' + Math.floor(Math.random() * 1000000)
        this.client_id = d + this.client_id
        this.room_id = _room_id
    }

    requestPermission() {
        debug('Requesting permission for Motion Events.')
        if (typeof DeviceMotionEvent === 'undefined') {
            debug('This device does not support Motion Events.')
            return false
        }

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            debug('DeviceMotionEvent.requestPermission is a function.')

            DeviceMotionEvent.requestPermission()
                .then((permissionState) => {
                    debug('permissionState: ' + permissionState)
                    if (permissionState === 'granted') {
                        this.addSensors()
                    }
                    return permissionState === 'granted'
                })
                .catch((error) => {
                    debug('requestPermission error: ' + error)
                    return false
                })
        } else {
            debug('DeviceMotionEvent.requestPermission is not a function.')
            return false
        }
        debug('Requested permission for Motion Events.')
    }

    addSensors() {
        const publish = (_topic, message) => {
            const t = `rooms/${this.room_id}/${this.client_id}/${_topic}`
            // this.mqttclient.publish(t, message)
            this.wsclient.send(t + ' ' + message)
        }
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
                })
            )
        })
        window.addEventListener('deviceorientation', (event) => {
            publish('deviceorientation', JSON.stringify({
                    client_id: this.client_id,
                    type: event.type,
                    timestamp: event.timeStamp,
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma,
                })
            )
        })
    }

    connect(room_id = this.room_id) {
        if (this.wsclient) {
            this.wsclient.close()
        }

        this.room_id = room_id
        const topic = 'rooms/' + room_id
        debug('Connecting to ' + this.address + '/' + room_id + ' as ' + this.client_id)

        // this.mqttclient.on("connect", () => {
        //     this.mqttclient.subscribe(topic + '/#', (err) => {
        //         if (!err) {
        //             this.mqttclient.publish(topic + '/clients', this.client_id);
        //         }
        //     });
        // });
        //
        // this.mqttclient.on("message", (topic, message) => {
        //     console.log(topic, message.toString());
        // });

        const wsclient = (this.wsclient = new WebSocket(this.address))
        wsclient.addEventListener('open', () => {
            debug('Connected to ' + this.room_id)
            // wsclient.send("sub_" + this.room_id)
        })

        wsclient.addEventListener('message', (event) => {
            debug('Received: ' + event.data)
        })
    }
}
