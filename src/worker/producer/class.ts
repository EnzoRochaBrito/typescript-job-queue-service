import { QueueRegistry } from "../../domain/queue/queue.registry";
import type { IQueueService } from "../../application/service/queue/queue.service.interface";
import type { QProducerWorkerMessage } from "./queueProducer";
import { Queue } from "../../domain/queue/queue";
import { QueueService } from "../../../proto/jobqueue";
import { JobQueueService } from "../../application/service/queue/queue.service";

export class QueueProducer {

    private readonly queueProducerEmitter: Worker
    private readonly queueProducerRecord: Map<string, QueueProducerRecord>

    private readonly MAX_TICKS: number = 5

    constructor(
        private readonly queueService: IQueueService,
        private readonly queueRegistry: QueueRegistry
    ) {
        this.queueProducerEmitter = new Worker(new URL("./queueProducer.ts", import.meta.url).href)
        this.queueProducerRecord = new Map()
        this.loadProducerHandler()
        this.init()
    }

    async popQueue(queue: Queue) {
        const job = await this.queueService.pop(queue)

        if (!job) {
            this.recordToNoJob(queue.name)
            return false
        }

        this.recordToJob(queue.name)

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

                if (!await this.popQueue(queue))
                    return

                this.recordToJob(queue.name)
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