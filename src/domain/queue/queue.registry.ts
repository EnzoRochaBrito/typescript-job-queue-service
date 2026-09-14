import type { Queue } from "./queue"

type QueueID = string

export class QueueRegistry {
    private readonly queue = new Map<QueueID, Queue>()

    add(queue: Queue) {
        this.queue.set(queue.name, queue)
    }

    get(queueName: QueueID) {
        return this.queue.get(queueName)
    }

    remove(queueName: string) {
        this.queue.delete(queueName)
    }

    getAllQueues() {
        return this.queue.values()
    }

    get queuesIDs() {
        return this.queue.keys()
    }
}