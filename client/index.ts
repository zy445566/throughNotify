import {getProtoDescriptor}  from '../utils/index';
import { ServerReadableStream } from '@grpc/grpc-js/build/src/server-call'
import * as grpc from '@grpc/grpc-js';
import { ServiceClientConstructor, ServiceClient } from '@grpc/grpc-js/build/src/make-client';
import {MessageIsOk, MessageJsonData} from '../type/index'
import { getLogger, Logger } from 'log4js';
import config from '../config/index'
import {EventEmitter} from 'events'

export class Client extends EventEmitter {
    private client:ServiceClient;
    private logger:Logger;
    private address:string
    constructor({
        address
    }:{
        address:string
    }) {
        super();
        this.address = address
        const notifyServiceDescriptor:ServiceClientConstructor = getProtoDescriptor('protos/notify_service.proto').NotifyService;
        this.client = new notifyServiceDescriptor(this.address, grpc.credentials.createInsecure())
        this.logger = getLogger(config.appName)
    }
    ping() {
        return new Promise((reslove,reject)=>{
            this.client.ping({ok:true},(error, ok:MessageIsOk)=>{
                if(error){return reject(error)}
                reslove(ok)
            })
        })
    }

    keepNotify() {
        const call:ServerReadableStream<any,any> = this.client.keepNotify({ok:true});
        call.on('data', (data:MessageJsonData)=> {
            this.emit('notify',JSON.parse(data.json))
        });
        call.on('error', (error)=> {
            this.logger.error('client keepNotify call is error: %O',error)
        });
        call.on('close', ()=> {
            this.logger.warn('client keepNotify call is close')
        });
        return call;
    }

    sendNotify(data:{[key:string]:any}) {
        const jsonData:MessageJsonData = {
            json:JSON.stringify(data)
        }
        return new Promise((reslove,reject)=>{
            this.client.sendNotify(jsonData,(error, ok)=>{
                if(error){return reject(error)}
                reslove(ok)
            })
        })
    }
}