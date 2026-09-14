import type { IQueueService } from "../../application/service/queue/queue.service.interface";
import { WorkerRegistry } from "../worker/worker.registry";
import { Queue } from "./queue";
import type { QueueRegistry } from "./queue.registry";


export const queueFactory = (queueRegistry: QueueRegistry, workerRegistry: WorkerRegistry, queueService: IQueueService) => 
    (name: string) => {
        const q = Queue.create({ queueName: name }, workerRegistry)

        queueService.create(q)
            .then(() => {
                queueRegistry.add(q)
            })
            
        return q
    }