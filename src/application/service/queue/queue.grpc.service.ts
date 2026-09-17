import type { sendUnaryData, ServerUnaryCall, ServerWritableStream } from "@grpc/grpc-js";
import type { CreateQueueRequest, DeleteQueueRequest, HearthbeatRequest, JobInfoRequest, ListenQueueRequest, ListenQueueStreamResponse, PushRequest, QueueServer, SuccessBoolResponse } from "../../../../proto/jobqueue";
import type { GrpcServerImplementation, UnaryMethod } from "../../../types/application.interface";
import type { IQueueService } from "./queue.service.interface";
import type { WorkerRegistry } from "../../../domain/worker/worker.registry";
import type { QueueRegistry } from "../../../domain/queue/queue.registry";
import { Queue } from "../../../domain/queue/queue";
import { Job } from "../../../domain/job/job";
import type { Empty } from "../../../../proto/google/protobuf/empty";
import { WorkerInstance } from "../../../domain/worker/worker";
import { WorkerHeartbeat } from "../../../worker/heartbeat/class";

export class JobQueueGrpcService implements GrpcServerImplementation<QueueServer> {

    
    constructor(
        private readonly queueService: IQueueService,
        private readonly workerRegistry: WorkerRegistry,
        private readonly queueRegistry: QueueRegistry,
        private readonly workerHeartbeat: WorkerHeartbeat,
    ) {
        
    }

    createQueue(call: ServerUnaryCall<CreateQueueRequest, SuccessBoolResponse>, callback: sendUnaryData<SuccessBoolResponse>) {
        const { queueName } = call.request

        const queue = Queue.create({
            queueName
        }, this.workerRegistry)

        this.queueService.create(queue)
            .then(_ => {
                this.queueRegistry.add(queue)
                callback(null, {
                    success: true
                })
            })
            .catch(error => {
                callback({
                    cause: error.cause,
                    message: error.message,
                    name: error.name
                }, {
                    success: false
                })
            })
    }

    push(call: ServerUnaryCall<PushRequest, SuccessBoolResponse>, callback: sendUnaryData<SuccessBoolResponse>) {
        const { jobData, queueId, metadata } = call.request

        const job = Job.create({
            data: jobData,
            queue: queueId,
            meta: metadata
        })

        this.queueService.push(job)
            .then(_ => {
                callback(null, {
                    success: true
                })
            })
            .catch(error => {
                callback({
                    cause: error.cause,
                    message: error.message,
                    name: error.name
                }, {
                    success: false
                })
            })
        
    }

    listenQueue(ssc: ServerWritableStream<ListenQueueRequest, ListenQueueStreamResponse>) {
        const { queue, concurrency } = ssc.request

        const worker = WorkerInstance.create({
            queue,
            concurrency: concurrency
        }, ssc)

        console.log("worker connected", worker.ID)

        this.workerRegistry.add(worker)
        
        const queueInstance = this.queueRegistry.get(queue)

        if (!queueInstance)
            return
        
        queueInstance.pushWorker(worker)

        this.workerHeartbeat.beat(worker.ID)

        ssc.write({
            queueConnectResponse: {
                workerId: worker.ID
            }
        })
    }

    deleteQueue(call: ServerUnaryCall<DeleteQueueRequest, SuccessBoolResponse>, callback: sendUnaryData<SuccessBoolResponse>) {
        const { queueId } = call.request
        this.queueService.delete(queueId)
            .then(_ => {
                callback(null, {
                    success: true
                })
            })
            .catch(error => {
                callback({
                    cause: error.cause,
                    message: error.message,
                    name: error.name
                }, {
                    success: false
                })
            })
    }

    hearthbeat(call: ServerUnaryCall<HearthbeatRequest, SuccessBoolResponse>, callback: sendUnaryData<SuccessBoolResponse>) {
        const { worker } = call.request

        const workerInstance = this.workerRegistry.get(worker)

        if (!workerInstance)
            callback(null, {
                success: false
            })

        else {
            this.workerHeartbeat.beat(worker)
            callback(null, {
                success: true
            })
        }
    }

    ack(call: ServerUnaryCall<JobInfoRequest, SuccessBoolResponse>, callback: sendUnaryData<SuccessBoolResponse>) {
        const { jobID, workerID } = call.request
        
        this.workerRegistry.get(workerID)?.ack(jobID)

        this.queueService.ack(jobID)
            .then(_ => {
                callback(null, {
                    success: true
                })
            })
            .catch(_ => {
                callback(null, {
                    success: false
                })
            })
    }

    error(call: ServerUnaryCall<JobInfoRequest, SuccessBoolResponse>, callback: sendUnaryData<SuccessBoolResponse>) {
        const { jobID, workerID } = call.request

        this.workerRegistry.get(workerID)?.ack(jobID)

        this.queueService.error(jobID)
            .then(_ => {
                callback(null, {
                    success: true
                })
            })
            .catch(_ => {
                callback(null, {
                    success: false
                })
            })
    }
}