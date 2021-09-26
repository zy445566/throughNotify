import { v4 as uuidv4 } from 'uuid';
import { ServerWritableStream } from '@grpc/grpc-js/build/src/server-call'
import {getProtoDescriptor}  from '../utils/index';
import * as grpc from '@grpc/grpc-js';
import { ServiceClientConstructor } from '@grpc/grpc-js/build/src/make-client';
import { getLogger, Logger } from 'log4js';
import config from '../config/index'
import {MessageIsOk, MessageJsonData} from '../type/index'
import { Client } from '../client/index'

export class Service {
    private partnerList:Array<string>
    private server:grpc.Server;
    private logger:Logger;
    private clientCallMap:Map<string, ServerWritableStream<any,any>>;

    constructor({
        partnerList
    }:{
        partnerList:Array<string>
    }={
        partnerList:[]
    }) {
        this.partnerList = partnerList;
        this.logger = getLogger(config.appName)
        this.clientCallMap = new Map<string, ServerWritableStream<any,any>>();
    }
    start(addr:string) {
        const notifyServiceDescriptor:ServiceClientConstructor = getProtoDescriptor('protos/notify_service.proto').NotifyService;
        this.server = new grpc.Server();
        // @ts-ignore  不得不说grpc的ts支持太差了
        this.server.addService(notifyServiceDescriptor.service, this.getNotifyService())
        return new Promise((reslove, reject)=>{
            this.server.bindAsync(addr, grpc.ServerCredentials.createInsecure(),(error, port)=>{
                if(error){
                    this.logger.info('server start failed,port:%O', error);
                    return reject(error)
                }
                this.server.start();
                this.logger.info('server start sucess,addr=%s|port:%d', addr, port);
                return reslove(port);
            });
        })
    }
    tryShutdown() {
        return new Promise((reslove, reject)=>{
            this.server.tryShutdown((error)=>{
                if(error){
                    this.logger.info('server tryShutdown failed,port:%O', error);
                    return reject(error)
                }
                return reslove(true);
            })
        })
    }
    async forceShutdown() {
        return this.server.forceShutdown()
    }

    private getNotifyService() {
        return {
            ping:async(call:ServerWritableStream<any,any>, callback:(error:Error,resp:MessageIsOk)=>void) => {
                return callback(null, call.request)
            },
            keepNotify:async(call:ServerWritableStream<any,any>) => {
                const callUuid:string = uuidv4();
                this.clientCallMap.set(callUuid,call)
                call.on('end', ()=> {
                    call.end();
                });
                call.on('error', (error)=> {
                    this.logger.error('keepNotify call is error: %O',error)
                });
                call.on('close', ()=> {
                    this.clientCallMap.delete(callUuid)
                });
            },
            sendNotify:async(call:ServerWritableStream<any,any>, callback:(error:Error,resp:MessageIsOk)=>void) => {
                // 同步伙伴机器
                for(const partner of this.partnerList) {
                    try{
                        const client = new Client({ address: partner});
                        await client.sendNotify(JSON.parse(call.request.json))
                    } catch(error) {
                        this.logger.error('sendNotify to server %s failed:%O', partner, error)
                    }
                }
                // 同步到客户机器
                for(const [_clientCallUuid,clientCall] of this.clientCallMap) {
                    try{
                        clientCall.write(call.request)
                    } catch(error) {
                        this.logger.error('sendNotify to client failed:%O', error)
                    }
                }
                callback(null,{ok:true})
            }
        }
    }
}