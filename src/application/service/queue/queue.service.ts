import type { PrismaClient } from "@prisma/client/extension";
import { JobStatus } from "../../../../prisma/generated/prisma/enums";
import { Job } from "../../../domain/job/job";
import type { JobMetadata } from "../../../domain/job/job.metadata";
import type { Queue } from "../../../domain/queue/queue";
import type { PrismaDatabaseConnection } from "../../../infra/db/prisma.db";
import type { IQueueService } from "./queue.service.interface";
import type { JobSupervisor } from "../../../worker/producer/job.supervisor";

export class JobQueueService implements IQueueService {

    constructor(
        private readonly db: PrismaDatabaseConnection,
        private readonly jobSupervisor: JobSupervisor
    ) {
        this.jobSupervisor
            .bindTriggerEvent(this.unleashLongRunningJob)
    }

    async create(queue: Queue): Promise<void> {
        try {
            await this.db.queue.create({
                data: {
                    name: queue.name
                }
            })
        } catch (error) {
            return 
        }
    }

    async delete(queueID: string): Promise<void> {
        await this.db.queue.delete({
            where: {
                name: queueID
            }
        })
    }

    async pop(queue: Queue): Promise<Job | undefined> {
        const jobData = await this.db.$transaction(async tx => {
            const job = await tx.job.findFirst({
                where: {
                    queue_name: queue.name,
                    status: {
                        in: [JobStatus.Available, JobStatus.Retryable]
                    },
                },
                orderBy: {
                    created_at: "asc",
                }
            })

            if (!job)
                return

            await tx.job.update({
                where: {
                    id: job.id
                },
                data: {
                    status: JobStatus.Executing
                }
            })
            
            return job
        })


        if (!jobData)
            return

        const job = Job.from({
            queue: queue.name,
            ID: jobData.id,
            data: jobData.data,
            createdAt: jobData.created_at,
            status: jobData.status
        }, JSON.parse(jobData.metadata?.toString() || "{}") as any)

        return job
    }

    async popMany(queue: Queue, batchAmount: number): Promise<Job[]> {
        let jobArr: Job[] = []
        
        const jobDataArr = await this.db.$transaction(async tx => {
            const jobs = await tx.job.findMany({
                where: {
                    queue_name: queue.name,
                    status: {
                        in: [JobStatus.Available, JobStatus.Retryable]
                    },
                },
                orderBy: {
                    created_at: "asc",
                },
                take: batchAmount
            })

            if (!jobs)
                return

            await tx.job.updateMany({
                where: {
                    id: {
                        in: jobs.map(j => j.id)
                    }
                },
                data: {
                    status: JobStatus.Executing
                }
            })

            return jobs
        })

        if (!jobDataArr)
            return []

        jobArr = jobDataArr.map(j => 
            Job.from({
                ID: j.id,
                data: j.data,
                status: j.status,
                queue: j.queue_name,
                createdAt: j.created_at,
            }, j.metadata as JobMetadata)
        )

        return jobArr
    }

    async push(job: Job): Promise<void> {
        await this.db.job.create({
            data: {
                id: job.ID,
                queue_name: job.queue,
                data: job.data,
                metadata: JSON.stringify(job.getMetadata()),
                status: JobStatus.Available,
                lease_time: job.getMetadata().lease_time
            }
        })
    }

    async ack(jobID: string): Promise<void> {

        this.updateJobStatus(jobID, JobStatus.Completed)
            .then(_ => { })
            .catch(e => console.log(e))

        this.jobSupervisor.remove(jobID)
    }

    async error(jobID: string): Promise<void> {
        await this.db.$transaction(async (tx) => {
            const job = await tx.job.findUnique({
                where: {
                    id: jobID,
                    status: {
                        notIn: [JobStatus.Discarded, JobStatus.Completed]
                    }
                },
            })

            if (!job)
                return

            const jobInstance = Job.from({
                ID: job.id,
                data: job.data,
                status: job.status,
                queue: job.queue_name,
                createdAt: job.created_at,
            }, job.metadata as JobMetadata)

            const jobNextStatus = jobInstance.retry() ? JobStatus.Retryable : JobStatus.Discarded
            const jobMetadata = jobInstance.getMetadata()

            await this.updateJobStatus(jobID, jobNextStatus, jobMetadata, tx)
        })
    }

    private async updateJobStatus(jobID: string, status: JobStatus, metadata?: JobMetadata, tx?: PrismaClient) {
        const client = tx ?? this.db
        await client.job.update({
            where: {
                id: jobID
            },
            data: {
                status: status,
                ...(metadata ? {
                    metadata: metadata
                } : { })
            }
        })
    }

    private async unleashLongRunningJob(jobID: string) {
        this.db.job.update({
            where: {
                id: jobID
            },
            data: {
                status: JobStatus.Retryable
            }
        })
    }
}