export {connect,Store} from 'mqtt'
import {Store} from 'mqtt'

type IStoreOptions = {
    clean: boolean;
  };
  
  class PersistStore extends Store {
    /**
     *
     */
    constructor(options: IStoreOptions) {
      super(options);
    }
  
    public put(packet: any, cb?: Function | undefined): this {
      throw new Error('Method not implemented.');
    }
    public createStream() {
      throw new Error('Method not implemented.');
    }
    public del(packet: any, cb: Function): this {
      throw new Error('Method not implemented.');
    }
    public get(packet: any, cb: Function): this {
      throw new Error('Method not implemented.');
    }
    public close(cb: Function): void {
      throw new Error('Method not implemented.');
    }
  }
  const _PersistStore = new PersistStore({clean: true});
  