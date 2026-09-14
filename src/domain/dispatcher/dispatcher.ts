import type { Job } from "../job/job"
import { WorkerScheduler } from "../scheduler/scheduler"

export class Dispatcher {
    
    constructor(
        readonly scheduler: WorkerScheduler,
    ) { }

    sendJob(
        job: Job
    ) {
        const worker = this.scheduler.nextWorker()

        if (!worker)
            return

        worker.sendJob(job)
    }
}