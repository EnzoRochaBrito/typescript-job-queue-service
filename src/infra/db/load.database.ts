import { Queue } from "../../domain/queue/queue";
import type { QueueRegistry } from "../../domain/queue/queue.registry";
import type { WorkerRegistry } from "../../domain/worker/worker.registry";
import type { PrismaDatabaseConnection } from "./prisma.db";

export async function loadQueuesToRegistry(db: PrismaDatabaseConnection, qr: QueueRegistry, wr: WorkerRegistry) {
    const queues = await db.queue.findMany({
        select: {
            name: true
        }
    })

    if (!queues)
        return

    queues.forEach(({ name }) => {
        qr.add(Queue.create({ queueName: name }, wr))
        console.log(`${ name } was loaded to registry.`)
    })
}