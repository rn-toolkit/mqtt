# @rn-toolkit/mqtt
Base on [MQTT.js](https://github.com/mqttjs/MQTT.js)

```bash
npm i @rn-toolkit/mqtt

#or

yarn add @rn-toolkit/mqtt
```

#### Use in React/ReactNative
```js

  useEffect(() => {
    const destroy = initMqtt(
      [
        {
          name: '/msg/+',
          cb: data => {
            console.log('/msg/+', data);
          },
        },
        {
          name: '/msg/1',
          cb: data => {
            console.log('/msg/1', data);
          },
        },
      ],
      {
        host: 'your host',
        port: 8083,
      },
    );
    return () => destroy();
  }, []);
```

#### TODO
- [ ] support [MQTTPattern](https://github.com/RangerMauve/mqtt-pattern)
