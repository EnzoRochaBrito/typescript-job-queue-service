import type { Job } from "../../../domain/job/job";
import type { Queue } from "../../../domain/queue/queue";

export interface IQueueService {
    create(queue: Queue): Promise<void>
    delete(queueID: string): Promise<void>
    pop(queue: Queue): Promise<Job | undefined>
    popMany(queue: Queue, amount: number): Promise<Job[]>
    push(job: Job): Promise<void>
    ack(jobID: string): Promise<void>
    error(jobID: string): Promise<void>
}