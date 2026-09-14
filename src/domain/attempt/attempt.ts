import { randomUUIDv7 } from "bun";
import type { Job } from "../job/job";
import type { WorkerInstance } from "../worker/worker";

export class Attempt {
    constructor(
        public readonly ID: string,
        public readonly jobID: string,
        public readonly workerID: string,
        public readonly startedAt: Date,
        public readonly finishedAt: Date | undefined,
        public readonly error: any | false,
        public readonly leashUntil: Date
    ) { }

    static create(worker: WorkerInstance, job: Job) {
        return new Attempt(
            randomUUIDv7(),
            job.ID,
            worker.ID,
            new Date(),
            undefined,
            false,
            new Date()
        )
    }
}