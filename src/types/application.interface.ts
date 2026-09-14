import type { handleClientStreamingCall, handleServerStreamingCall, handleUnaryCall, sendUnaryData, ServerUnaryCall, ServerWritableStream,  } from "@grpc/grpc-js";
import type { CreateQueueRequest, DeleteQueueRequest, ListenQueueRequest, ListenQueueStreamResponse, PushRequest, QueueServer, SuccessBoolResponse } from "../../proto/jobqueue";

export type UnaryMethod<REQ, RES> = {
    call: ServerUnaryCall<REQ, RES>,
    callback: sendUnaryData<RES>
}

export type GrpcServerImplementation<T> = {
    [K in keyof T as string extends K ? never : K]:
        T[K] extends handleServerStreamingCall<infer I, infer O>
            ? (ssc: ServerWritableStream<I, O>) => void
            : T[K] extends handleUnaryCall<infer I, infer O>
                ? (call: ServerUnaryCall<I, O>, callback: sendUnaryData<O>) => void
                : T[K] extends handleClientStreamingCall<infer I, infer O> ? 
                (ccall: ServerUnaryCall<I, O>, callback: sendUnaryData<O>) => void : never;
};