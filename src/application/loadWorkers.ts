import type { QueueRegistry } from "../domain/queue/queue.registry";
import type { WorkerRegistry } from "../domain/worker/worker.registry";
import { CleanupWorker } from "../worker/cleanup/class";
import { WorkerHeartbeat } from "../worker/heartbeat/class";
import { QueueProducer } from "../worker/producer/class";
import type { IQueueService } from "./service/queue/queue.service.interface";

type WorkersDependencies = {
    workerRegistry: WorkerRegistry,
    queueRegistry: QueueRegistry,
    queueService: IQueueService,
}

export function loadWorkers(dep: WorkersDependencies) {
    const cleanupWorker = new CleanupWorker()

    cleanupWorker.init()

    const heartbeatWorker = new WorkerHeartbeat(dep.workerRegistry)

    const producerWorker = new QueueProducer(dep.queueService, dep.queueRegistry)

    return {
        cleanupWorker,
        heartbeatWorker,
        producerWorker
    }
}
