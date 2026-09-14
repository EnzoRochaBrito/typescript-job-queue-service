import { randomUUIDv7 } from "bun"
import { JobStatus } from "../../../prisma/generated/prisma/enums"
import type { JobMetadata } from "./job.metadata"
import type { ClassFields } from "../../types/extract.class.fields"

export interface JobDTO {
    data: any
}

interface CreateJobDTO {
    data: any,
    queue: string,
    meta?: JobMetadata
}


export type JobObject<T=any> = ClassFields<Job<T>>

export class Job<T = any> {
    constructor(
        public readonly ID: string,
        public readonly queue: string,
        public readonly status: JobStatus,
        public readonly data: T,
        public readonly createdAt: Date,
        private _metadata: JobMetadata,
    ) { }

    static create(dto: CreateJobDTO) {
        return new Job(
            randomUUIDv7(),
            dto.queue,
            JobStatus.Available,
            dto.data,
            new Date(),
            dto.meta ? dto.meta : {}
        )
    }

    static from(obj: JobObject, metadata: JobMetadata) {
        return new Job(
            obj.ID,
            obj.queue,
            obj.status,
            obj.data,
            obj.createdAt,
            metadata
        )
    }

    /**
     * Check and apply retry logic on the job object locally
     * After the retry logic, the job metadata is updated
     * @param job 
     * @returns Boolean to check if the job is allowed to retry
     */
    retry(): boolean {
        
        const { retry } = this._metadata

        if (retry === undefined)
            return false
        
        if (retry.currentAttempt && retry.currentAttempt >= retry.attempts) 
            return false
        
        if (retry.currentAttempt && retry.currentAttempt < retry.attempts)
            retry.currentAttempt++

        if (!retry.currentAttempt)
            retry.currentAttempt = 1


        return true
    }

    getMetadata(): JobMetadata {
        return this._metadata
    }

    backoffTime(): number | void {
        const { retry } = this._metadata

        if (!retry)
            return

        switch (retry.backoff.type) {
            case "fixed":
                return retry.backoff.delay
            case "exponential":
                return retry.backoff.delay * (2 ** (retry.currentAttempt ? retry.currentAttempt - 1 : 0))
        }
    }
}

