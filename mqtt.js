const mqtt = require("mqtt");
const client = mqtt.connect("wss://aircontrol.utapp.cn:443/mqtt");

client.on("connect", () => {
    client.subscribe("presence", (err) => {
        if (!err) {
            client.publish("presence", "Hello mqtt");
        }
    });
});

client.on("message", (topic, message) => {
    // message is Buffer
    console.log(message.toString());
    client.end();
});
