import {
    join as pathJoin,
    dirname as pathDirname
} from 'path';
import {
    createHash
} from 'crypto';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ServiceClientConstructor } from '@grpc/grpc-js/build/src/make-client';

export function getProtoDescriptor(protoPath):{
    [key:string]:ServiceClientConstructor
} {
    const notifyServiceProtoPath = pathJoin(pathDirname(__dirname),protoPath);
    const packageDefinition = protoLoader.loadSync(notifyServiceProtoPath);
    // @ts-ignore  这里就是返回[key:string]:ServiceClientConstructor
    return  grpc.loadPackageDefinition(packageDefinition);
}

export function hash256ByStr(str) {
    return createHash('SHA256').update(str).digest('hex');
}