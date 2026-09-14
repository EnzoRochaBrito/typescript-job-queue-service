import { WorkerClient } from "../../src/application/worker/client";
import type { Job } from "../../src/domain/job/job";
import type { ClassFields } from "../../src/types/extract.class.fields";
import { GRPC_PORT, QUEUE_NAME } from "./const";
import type { CompressImageJob } from "./type";


export class CompressImageWorker extends WorkerClient<CompressImageJob> {

    private concurrentJobs = 0

    constructor() {
        super(QUEUE_NAME, {
            address: GRPC_PORT
        })

        console.log("Worker created")
    }

    override async execute(job: ClassFields<Job<CompressImageJob>>): Promise<void> {
        this.log(`recieved job (${this.concurrentJobs})`)
        
        this.log(`fetching image from bucket`)
        await this.sleep(2000)

        this.log(`processing`)
        await this.sleep(2000)

        this.log(`sending processed image to bucket`)
        await this.sleep(2000)

        this.log(`discarding original image`)
        await this.sleep(2000)

        this.log(`finishing job`)

        this.ack(job)
    }

    private log(message: string) {
        console.log(`(${this.workerIDSimplified}) - ${message}`)
    }

    private get workerIDSimplified() {
        const splittedUUID = this.workerID.split("-")
        return splittedUUID[splittedUUID.length-1]
    }

    private async sleep(time: number) {
        await Bun.sleep(time)
    }
}