"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = exports.connect = void 0;
var mqtt_1 = require("mqtt");
Object.defineProperty(exports, "connect", { enumerable: true, get: function () { return mqtt_1.connect; } });
Object.defineProperty(exports, "Store", { enumerable: true, get: function () { return mqtt_1.Store; } });
const mqtt_2 = require("mqtt");
class PersistStore extends mqtt_2.Store {
    /**
     *
     */
    constructor(options) {
        super(options);
    }
    put(packet, cb) {
        throw new Error('Method not implemented.');
    }
    createStream() {
        throw new Error('Method not implemented.');
    }
    del(packet, cb) {
        throw new Error('Method not implemented.');
    }
    get(packet, cb) {
        throw new Error('Method not implemented.');
    }
    close(cb) {
        throw new Error('Method not implemented.');
    }
}
const _PersistStore = new PersistStore({ clean: true });
