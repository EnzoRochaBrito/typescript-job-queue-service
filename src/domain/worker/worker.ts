import { ListenQueueRequest, ListenQueueStreamResponse } from "../../../proto/jobqueue"
import * as grpc from "@grpc/grpc-js"
import type { Job } from "../job/job"
import type { ClassFields } from "../../types/extract.class.fields"
import { randomUUIDv7 } from "bun"
import { eventBus } from "../../infra/eventBus"

export type WorkerConnection = grpc.ServerWritableStream<ListenQueueRequest, ListenQueueStreamResponse>

export class WorkerInstance {

    constructor(
        public readonly ID: string,
        public readonly queue: string,
        public readonly concurrency: number,
        public currentConcurrentJobs: number,
        private readonly grpcConnectionObject: WorkerConnection
    ) { }

    static create(
        body: Omit<ClassFields<WorkerInstance>, "ID" | "currentConcurrentJobs">,
        connection: WorkerConnection
    ) {
        return new WorkerInstance(
            randomUUIDv7(),
            body.queue,
            body.concurrency,
            0,
            connection
        )
    }

    canWork(): boolean {
        return this.currentConcurrentJobs < this.concurrency
    }

    ack() {
        if (this.currentConcurrentJobs > 0)
            this.currentConcurrentJobs--
        eventBus.emit("queue:available", { queueName: this.queue })
    }

    sendJob(job: Job): void {
        this.currentConcurrentJobs++
        this.grpcConnectionObject.write({
            jobDataResponse: {
                jobData: job
            }
        })
    }
}