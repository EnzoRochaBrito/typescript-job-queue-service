import { WorkerRegistry } from "../domain/worker/worker.registry";
import { QueueRegistry } from "../domain/queue/queue.registry";
import type { EventBus } from "../infra/eventBus/event.bus";
import type { QueueEvents } from "../infra/eventBus/events";
import { JobQueueService } from "./service/queue/queue.service";
import { JobQueueGrpcService } from "./service/queue/queue.grpc.service";
import { loadQueuesToRegistry } from "../infra/db/load.database";
import { loadWorkers } from "./loadWorkers";
import type { QueueProducer } from "../worker/producer/class";
import { eventBus } from "../infra/eventBus";
import { loadDBListener } from "../infra/db/db.event.listener";
import { startGrpcServer } from "./startGrpcServer";
import { PrismaDatabaseConnection } from "../infra/db/prisma.db";
import { queueFactory } from "../domain/queue/factory";

type BootstrapConfig = {
    databaseUrl: string,
    grpcPort: string
}

export async function bootstrap(config: BootstrapConfig) {

    const workerRegistry = new WorkerRegistry()
    const queueRegistry = new QueueRegistry()

    const databaseConnection = new PrismaDatabaseConnection(config.databaseUrl)

    const queueService = new JobQueueService(databaseConnection)

    const grpcQueueController = new JobQueueGrpcService(
        queueService,
        workerRegistry,
        queueRegistry
    )

    const { cleanupWorker, heartbeatWorker, producerWorker } = loadWorkers({
        queueRegistry: queueRegistry,
        queueService: queueService,
        workerRegistry: workerRegistry
    })

    loadCreatedJobEventHandler(eventBus, producerWorker)

    eventBus.on("queue:available", ({ queueName }) => {
        producerWorker.popQueue(queueRegistry.get(queueName)!)
    })

    const dbListener = loadDBListener(config.databaseUrl)

    loadQueuesToRegistry(databaseConnection, queueRegistry, workerRegistry)
        .then(() => {
            console.log("QUEUES LOADED")
        });


    const grpcServer = startGrpcServer(grpcQueueController, config.grpcPort)

    const qFactory = queueFactory(queueRegistry, workerRegistry, queueService)

    return {
        queueService,
        queueFactory: qFactory
    }
}

function loadCreatedJobEventHandler(
    eventBus: EventBus<QueueEvents>,
    queueProducer: QueueProducer
) {
    eventBus.on("queue:job:new", ({
        queueName
    }) => {
        queueProducer.triggerQueue(queueName)
    })
}