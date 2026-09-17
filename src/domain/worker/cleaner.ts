import { JobStatus } from "../../../prisma/generated/prisma/enums";
import type { PrismaDatabaseConnection } from "../../infra/db/prisma.db";
import type { WorkerInstance } from "./worker";
import type { WorkerRegistry } from "./worker.registry";

export class WorkerCleaner {

    constructor(
        private readonly workerRegistry: WorkerRegistry,
        private readonly db: PrismaDatabaseConnection
    ) { }

    async clean(worker: WorkerInstance) {

        this.removeFromRegistry(worker.ID)
        await this.freeExecutingJobs(worker)

    }

    private removeFromRegistry(workerID: string) {
        this.workerRegistry.remove(workerID)
    }

    private async freeExecutingJobs(worker: WorkerInstance) {
        const executingJobs = worker.getExecutingJobsIterable().toArray()

        if (executingJobs.length === 0)
            return

        await this.db.job.updateMany({
            where: {
                id: {
                    in: executingJobs
                }
            },
            data: {
                status: JobStatus.Available
            }
        })
    }
}