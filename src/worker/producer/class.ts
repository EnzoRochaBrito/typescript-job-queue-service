import { QueueRegistry } from "../../domain/queue/queue.registry";
import type { IQueueService } from "../../application/service/queue/queue.service.interface";
import type { QProducerWorkerMessage } from "./queueProducer";
import { Queue } from "../../domain/queue/queue";
import { JobSupervisor, type LeasedJob } from "./job.supervisor";

export class QueueProducer {

    private readonly queueProducerEmitter: Worker
    private readonly queueProducerRecord: Map<string, QueueProducerRecord>

    private readonly MAX_TICKS: number = 5

    constructor(
        private readonly queueService: IQueueService,
        private readonly queueRegistry: QueueRegistry,
        private readonly jobSupervisor: JobSupervisor
    ) {
        this.queueProducerEmitter = new Worker(new URL("./queueProducer.ts", import.meta.url).href)
        this.queueProducerRecord = new Map()

        this.loadProducerHandler()
        this.init()
    }

    async popQueue(queue: Queue) {

        const job = await this.queueService.pop(queue)

        if (!job)
            return false
        
        if (job.getMetadata().lease_time) {
            this.jobSupervisor.registerLeasedJob({
                jobID: job.ID,
                leaseTime: job.getMetadata().lease_time!,
                startedAt: Date.now()
            })
        }

        queue.sendJob(job)

        return true
    }

    private loadProducerHandler() {
        this.queueProducerEmitter.onmessage = async (ev: MessageEvent) => {
            
            const queues = this.queueRegistry.getAllQueues()
            
            queues.forEach(async (queue) => {

                const producerRecord = this.canPool(queue)

                if (!producerRecord)
                    return

                this.popQueue(queue)
                    .then(success => {
                        success ? this.recordToJob(queue.name) : this.recordToNoJob(queue.name) 
                    })
            })
        }
    }

    private canPool(queue: Queue) {
        const hasAvailableWorkers = queue.isAvailable()

        if (!hasAvailableWorkers)
            return false

        let currentProducerObject = this.queueProducerRecord.get(queue.name)

        if (!currentProducerObject) {
            
            let tickObject: QueueTickRecord;
    
            if (!hasAvailableWorkers)
                tickObject = { available: false, remainingTicks: this.MAX_TICKS }
            else
                tickObject = { available: true }

            currentProducerObject = { lastQueryHasJob: false, ...tickObject }

            this.queueProducerRecord.set(queue.name, currentProducerObject)
            
        } else if (!currentProducerObject.available) {
            this.updateTick(queue.name)
            return false   
        }

        if (currentProducerObject.lastQueryHasJob)
            return false

        return currentProducerObject
    }

    private recordToNoJob(queue: string) {
        const currentProducerObject = this.queueProducerRecord.get(queue)

        if (!currentProducerObject)
            return
        
        this.queueProducerRecord.set(queue, {
                ...currentProducerObject,
                available: false,
                remainingTicks: this.MAX_TICKS,
                lastQueryHasJob: false
            })
    }

    private recordToJob(queue: string) {
        const queueRecord = this.queueProducerRecord.get(queue)!
        this.queueProducerRecord.set(queue, {
            ...queueRecord,
            available: true,
            lastQueryHasJob: true
        })
    }

    private updateTick(queue: string) {
        const queueRecord = this.queueProducerRecord.get(queue)
        if (!queueRecord)
            return

        if (!queueRecord.available) {
            const newTick = queueRecord.remainingTicks - 1
            this.queueProducerRecord.set(queue, {
                    ...queueRecord,    
                    ...(newTick < 0 ? { available: true } : { remainingTicks: newTick })
                })
        }
    }

    triggerQueue(queue: string) {

        const currentRecord = this.queueProducerRecord.get(queue)

        if (!currentRecord)
            return

        if (!currentRecord.available)
            this.recordToNoJob(queue)

        try {
            
            const queueInstance = this.queueRegistry.get(queue)!

            if (queueInstance.isAvailable())
                this.popQueue(this.queueRegistry.get(queue)!)

        } catch (error) {
            console.log(error)
        }

    }

    private init() {
        const initMessage: QProducerWorkerMessage = {
            message: "init",
            delay: 500
        }
        this.queueProducerEmitter.postMessage(initMessage)
    }
}


type AvailableQueueTickRecord = {
    available: true
}

type UnavailableQueueTickRecord = {
    available: false,
    remainingTicks: number
}

type QueueTickRecord = 
    | AvailableQueueTickRecord
    | UnavailableQueueTickRecord
;

type QueueDBJobAcquisition = {
    lastQueryHasJob: boolean
}

type QueueProducerRecord = QueueDBJobAcquisition & QueueTickRecord