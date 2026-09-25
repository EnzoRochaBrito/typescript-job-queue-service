import { WorkerClient } from "../../src/application/worker/client";
import type { Job } from "../../src/domain/job/job";
import type { ClassFields } from "../../src/types/extract.class.fields";
import { GRPC_PORT, QUEUE_NAME } from "./const";
import type { LongRunningJob } from "./type";


/**
 * This long running job is good to test worker cleanup during server crashes, because you can
 * stop the worker instance (using Ctrl + C) while knowing there is a job being executed
 */
export class LongRunningWorker extends WorkerClient<LongRunningJob> {

    constructor() {
        super(QUEUE_NAME, {
            address: GRPC_PORT
        }, 5)
    }

    override async work(job: ClassFields<Job<LongRunningJob>>): Promise<void> {
        console.log("running job" ,job.ID, "waiting for", job.data.seconds, "seconds")
        // await Bun.sleep((job.data.seconds+4)*1000)
        console.log("finishing job", job.ID)
    }
}