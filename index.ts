import mqtt from 'mqtt'
import MQTTPattern from 'mqtt-pattern';

// 后续切换至@rn-toolkit/mqtt
function JsonTryParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

type ITopicType = { name: string; cb: (data: any) => void };

export class MQTTClient {
  private client: mqtt.MqttClient;
  private topics: ITopicType[] = [];
  uri: string;
  constructor(uri: string, topics: ITopicType[], config: IMQTTConfig) {
    this.uri = uri;

    this.client = mqtt.connect(uri, config);

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

  destroy(topics: Array<ITopicType>) {
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

type IClientsType = {
  [key: string]: MQTTClient;
};
const clients: IClientsType = {};

export type IMQTTConfig = mqtt.IClientOptions & {
  // 默认以 ws 方式请求
  useSSL?: boolean;
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
  } else {
    mqttClient.subscribe(topics);
  }

  return () => {
    mqttClient.destroy(topics);
  };
}
