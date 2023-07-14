export * as MqttJS from 'mqtt';
type ITopicType = {
    name: string;
    cb: (data: any) => void;
};
export declare class MQTTClient {
    private instance;
    private topics;
    uri: string;
    constructor(uri: string, topics: ITopicType[], config: IMQTTConfig);
    reconnect(): void;
    messageReceived(topic: string, payload: ArrayBuffer): void;
    subscribe(topics: Array<ITopicType>): void;
    connect(): void;
    destroy(topics: Array<ITopicType>): void;
    get isConnected(): boolean;
}
export type IMQTTConfig = {
    host: string;
    port: number;
    path?: string;
    username?: string;
    password?: string;
    useSSL?: boolean;
    clientId?: string;
    reconnectPeriod?: number;
};
export declare const defaultConfig: Partial<IMQTTConfig>;
/**
 * 初始化一个客户端
 * @param topics 主题
 * @param config 配置
 * @returns 返回销毁函数
 */
export declare function initMqtt(topics: ITopicType[], config: IMQTTConfig): () => void;
