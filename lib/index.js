"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMqtt = exports.defaultConfig = exports.MQTTClient = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const mqtt_pattern_1 = __importDefault(require("mqtt-pattern"));
// 后续切换至@rn-toolkit/mqtt
function JsonTryParse(str) {
    try {
        return JSON.parse(str);
    }
    catch (_a) {
        return str;
    }
}
class MQTTClient {
    constructor(uri, topics, config) {
        this.topics = [];
        this.uri = uri;
        this.client = mqtt_1.default.connect(uri, config);
        this.subscribe(topics);
        this.client.on('connect', () => this.connect());
        // 断开连接，需要MQTT 5.0协议
        this.client.on('disconnect', () => console.log(`mqtt ${this.uri} is disconnect`));
        // 关闭连接
        this.client.on('close', () => console.log(`mqtt ${this.uri} is close`));
        // 接收消息订阅
        this.client.on('message', (topic, payload) => this.messageReceived(topic, payload));
        // 报错
        this.client.on('error', error => console.log('mqtt error', error));
    }
    reconnect() {
        if (!this.client.reconnecting) {
            this.client.reconnect();
        }
    }
    messageReceived(topic, payload) {
        // console.log('messageReceived', topic, payload.toString());
        const data = JsonTryParse(payload.toString());
        for (const n of this.topics) {
            if (mqtt_pattern_1.default.matches(n.name, topic)) {
                // const params = MQTTPattern.exec(n.topic, destinationName);
                n === null || n === void 0 ? void 0 : n.cb(data);
            }
        }
    }
    subscribe(topics) {
        for (const topic of topics) {
            this.topics.push(topic);
            if (this.isConnected) {
                this.client.subscribe(topic.name);
            }
        }
    }
    connect() {
        // console.log('connect', this.topics);
        for (const topic of this.topics) {
            this.client.subscribe(topic.name);
        }
    }
    destroy(topics) {
        // 销毁当前的客户端订阅，如果只有当前客户端订阅了该内容，则销毁链接，如果还存在其他订阅，则仅仅取消订阅
        for (const topic of topics) {
            this.topics = this.topics.filter(item => topic.name !== item.name);
            if (this.isConnected) {
                this.client.unsubscribe(topic.name);
            }
        }
    }
    get isConnected() {
        return this.client.connected;
    }
}
exports.MQTTClient = MQTTClient;
const clients = {};
exports.defaultConfig = {
    useSSL: false,
    reconnectPeriod: 10000
};
/**
 * 初始化一个客户端
 * @param topics 主题
 * @param config 配置
 * @returns 返回销毁函数
 */
function initMqtt(topics, config) {
    var _a;
    config = Object.assign(Object.assign({}, exports.defaultConfig), config);
    const uri = `${config.useSSL ? 'wss' : 'ws'}://${config.host}:${config.port}${(_a = config.path) !== null && _a !== void 0 ? _a : '/mqtt'}`;
    let mqttClient = clients[uri];
    if (!mqttClient) {
        mqttClient = new MQTTClient(uri, topics, config);
        clients[uri] = mqttClient;
    }
    else {
        mqttClient.subscribe(topics);
    }
    return () => {
        mqttClient.destroy(topics);
    };
}
exports.initMqtt = initMqtt;
