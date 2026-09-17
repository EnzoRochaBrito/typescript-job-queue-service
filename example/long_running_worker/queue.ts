import { bootstrap } from "../../src/application";
import { Job } from "../../src/domain/job/job";
import { Queue } from "../../src/domain/queue/queue";
import { GRPC_PORT, LOCAL_DATABASE_URL, QUEUE_NAME } from "./const";
import type { LongRunningJob } from "./type";

const { queueFactory, queueService } = await bootstrap({
    grpcPort: GRPC_PORT,
    databaseUrl: LOCAL_DATABASE_URL
})

const queue = queueFactory(QUEUE_NAME)

await queueService.create(queue)

// insertJobsOnQueue()

function insertJobsOnQueue() {
    setInterval(() => {
        const jobData: LongRunningJob = {
            seconds: 4
        }

        const job = Job.create({
            data: jobData,
            queue: QUEUE_NAME,
        })

        console.log("job created")

        queueService.push(job)
    }, 700)
}