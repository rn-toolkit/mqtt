"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMqtt = exports.defaultConfig = exports.MQTTClient = exports.MqttJS = void 0;
exports.MqttJS = __importStar(require("mqtt"));
const mqtt_1 = require("mqtt");
const mqtt_pattern_1 = __importDefault(require("mqtt-pattern"));
// class PersistStore extends Store {
//   /**
//    *
//    */
//   constructor(options: IStoreOptions) {
//     super(options);
//   }
//   public put(packet: any, cb?: Function | undefined): this {
//     throw new Error('Method not implemented.');
//   }
//   public createStream() {
//     throw new Error('Method not implemented.');
//   }
//   public del(packet: any, cb: Function): this {
//     throw new Error('Method not implemented.');
//   }
//   public get(packet: any, cb: Function): this {
//     throw new Error('Method not implemented.');
//   }
//   public close(cb: Function): void {
//     throw new Error('Method not implemented.');
//   }
// }
// const _PersistStore = new PersistStore({clean: true});
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
        var _a, _b;
        this.topics = [];
        this.uri = uri;
        const clientId = (_a = config.clientId) !== null && _a !== void 0 ? _a : 'app' + Date.now();
        this.instance = (0, mqtt_1.connect)(uri, {
            // incomingStore: _PersistStore,
            clientId,
            reconnectPeriod: (_b = config.reconnectPeriod) !== null && _b !== void 0 ? _b : 10000,
        });
        this.subscribe(topics);
        this.instance.on('connect', () => this.connect());
        // 断开连接，需要MQTT 5.0协议
        this.instance.on('disconnect', () => console.log(`mqtt ${this.uri} is disconnect`));
        // 关闭连接
        this.instance.on('close', () => console.log(`mqtt ${this.uri} is close`));
        // 接收消息订阅
        this.instance.on('message', (topic, payload) => this.messageReceived(topic, payload));
        // 报错
        this.instance.on('error', error => console.log('mqtt error', error));
    }
    reconnect() {
        // clearTimeout(this.#keepAliveInterval)
        // this.#keepAliveInterval = setTimeout(() => {
        //   if (!this.isConnected) {
        //     this.#instance.reconnect()
        //   }
        // }, 10000)
        if (!this.instance.reconnecting) {
            this.instance.reconnect();
        }
    }
    messageReceived(topic, payload) {
        console.log('messageReceived', topic, payload.toString());
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
                this.instance.subscribe(topic.name);
            }
        }
    }
    connect() {
        console.log('connect', this.topics);
        for (const topic of this.topics) {
            this.instance.subscribe(topic.name);
        }
    }
    destroy(topics) {
        // 销毁当前的客户端订阅，如果只有当前客户端订阅了该内容，则销毁链接，如果还存在其他订阅，则仅仅取消订阅
        for (const topic of topics) {
            this.topics = this.topics.filter(item => topic.name !== item.name);
            if (this.isConnected) {
                this.instance.unsubscribe(topic.name);
            }
        }
    }
    get isConnected() {
        return this.instance.connected;
    }
}
exports.MQTTClient = MQTTClient;
const clients = {};
exports.defaultConfig = {
    clientId: 'app',
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
        // mqttClient.subscribe(topics);
    }
    else {
        mqttClient.subscribe(topics);
    }
    return () => {
        mqttClient.destroy(topics);
    };
}
exports.initMqtt = initMqtt;
