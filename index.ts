export * as MqttJS from 'mqtt'
import { connect, MqttClient as NativeMQTTClient } from 'mqtt'
import MQTTPattern from 'mqtt-pattern';

type IStoreOptions = {
  clean: boolean;
};

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
function JsonTryParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

//Set up an in-memory alternative to global localStorage
// const _mqttStorage = {
//   setItem: (key: string, item: any) => {
//     storage.set(key, item)
//   },
//   getItem: (key: string) => storage.getString(key),
//   removeItem: (key: string) => {
//     storage.delete(key)
//   },
// }

type ITopicType = { name: string; cb: (data: any) => void };

export class MQTTClient {
  private instance: NativeMQTTClient;
  private topics: ITopicType[] = [];
  uri: string;
  constructor(uri: string, topics: ITopicType[], config: IMQTTConfig) {
    this.uri = uri;
    const clientId = config.clientId ?? 'app-' + Date.now();

    this.instance = connect(uri, {
      // incomingStore: _PersistStore,
      clientId,
      ...config
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
  messageReceived(topic: string, payload: ArrayBuffer) {
    // console.log('messageReceived', topic, payload.toString());
    const data = JsonTryParse(payload.toString());
    for (const n of this.topics) {
      if (MQTTPattern.matches(n.name, topic)) {
        // const params = MQTTPattern.exec(n.topic, destinationName);
        n?.cb(data);
      }
    }
  }
  subscribe(topics: Array<ITopicType>) {
    for (const topic of topics) {
      this.topics.push(topic);
      if (this.isConnected) {
        this.instance.subscribe(topic.name);
      }
    }
  }
  connect() {
    // console.log('connect', this.topics);
    for (const topic of this.topics) {
      this.instance.subscribe(topic.name);
    }
  }

  destroy(topics: Array<ITopicType>) {
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

type IClientsType = {
  [key: string]: MQTTClient;
};
const clients: IClientsType = {};

export type IMQTTConfig = {
  host: string;
  port: number;
  // 默认路径为 /mqtt
  path?: string;
  // 身份认证
  username?: string;
  password?: string;
  // 默认以 ws 方式请求
  useSSL?: boolean;
  clientId?: string;
  // 重连间隔
  reconnectPeriod?: number
};

export const defaultConfig : Partial<IMQTTConfig> = {
  useSSL: false,
  reconnectPeriod: 10000
}

/**
 * 初始化一个客户端
 * @param topics 主题
 * @param config 配置
 * @returns 返回销毁函数
 */
export function initMqtt(topics: ITopicType[], config: IMQTTConfig) {
  config = {...defaultConfig,...config}
  const uri = `${config.useSSL ? 'wss' : 'ws'}://${config.host}:${config.port}${config.path ?? '/mqtt'}`;
  let mqttClient = clients[uri];
  if (!mqttClient) {
    mqttClient = new MQTTClient(uri, topics, config);
    clients[uri] = mqttClient;
    // mqttClient.subscribe(topics);
  } else {
    mqttClient.subscribe(topics);
  }

  return () => {
    mqttClient.destroy(topics);
  };
}
