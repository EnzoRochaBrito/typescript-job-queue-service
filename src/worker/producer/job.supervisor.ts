import { Readable } from "stream"
import { HeapBuilder } from "../../utils/heap"
import { secondToMillisecond } from "../../utils/date.utils"

export type LeasedJob = {
    jobID: string,
    leaseTime: number,
    startedAt: number
}

export class JobSupervisor {
    
    private readonly jobHeap: HeapBuilder<LeasedJob>
    private currentTimeout?: NodeJS.Timeout
    private currentJob: LeasedJob | undefined
    private triggerEvent?: (job: string) => Promise<void> 

    constructor() {
        this.jobHeap = new HeapBuilder<LeasedJob>({
            comparison: (left, target) => {
                const currentTime = Date.now()

                const leftRemainingTime = (left.startedAt + left.leaseTime) - currentTime
                const targetRemainingTime = (target.startedAt + target.leaseTime) - currentTime

                return leftRemainingTime > targetRemainingTime
            },
            isEqual: (left, right) => left.jobID === right.jobID
        })
    }

    registerLeasedJob(job: LeasedJob) {
        this.jobHeap.insert(job)
        this.sleepForCurrentJob()
    }

    remove(jobID: string) {
        if (this.currentJob?.jobID === jobID) {
            this.clearCurrentTimeout()
            this.currentJob = undefined
        }

        this.jobHeap.remove({
            jobID: jobID,
            leaseTime: 0,
            startedAt: 0
        })
    }

    bindTriggerEvent(evt: (job: string) => Promise<void>) {
        this.triggerEvent = evt
    }

    private sleepForCurrentJob() {
        const poppedJob = this.jobHeap.pop()
        
        if (!poppedJob)
            return

        const leaseTimeInMillisecond = secondToMillisecond(poppedJob.leaseTime)

        if (this.currentJob) {

            const currentJobTimeOffset = this.currentJob.startedAt + leaseTimeInMillisecond
            const poppedJobTimeOffset = poppedJob.startedAt + leaseTimeInMillisecond

            if (currentJobTimeOffset < poppedJobTimeOffset) {
                this.jobHeap.insert(poppedJob)
                return
            }

            this.jobHeap.insert(this.currentJob)
            this.currentJob = poppedJob
        }

        const date = Date.now()
        const remainingTime = (poppedJob.startedAt + leaseTimeInMillisecond) - date

        if (remainingTime < 0) {

            console.log("date", date)
            console.log("poppedJob.startedAt", poppedJob.startedAt)
            console.log("leaseTimeInMillisecond", leaseTimeInMillisecond)
            console.log("remainingTime", remainingTime)

            this.triggerEvent!(poppedJob.jobID)
                .then()
            setTimeout(()=>this.sleepForCurrentJob())
            return
        }

        this.clearCurrentTimeout()

        this.currentJob = poppedJob

        this.currentTimeout = setTimeout(() => {

            this.triggerEvent!(poppedJob.jobID)
                .then(_ => { })
            this.currentJob = undefined

            // set trigger here
        }, remainingTime)
    } 

    private clearCurrentTimeout() {
        clearTimeout(this.currentTimeout)
    }

    // private *readableCurrentJob() {
    //     while (true) {
    //         const job = this.jobHeap.top()
    //         if (!job) {
    //             Bun.sleep(500)
    //             continue
    //         }

    //         const jobExecutionTime = job.startedAt + job.leaseTime

    //         if (jobExecutionTime < Date.now()) {
    //             this.jobHeap.remove(job)
    //             yield job
    //         }

    //         Bun.sleep(500)
    //         continue
            
    //     }
    // }
}