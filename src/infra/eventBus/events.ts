export type QueueEvents = {
    "queue:job:new": {
        queueName: string
    },
    "queue:available": {
        queueName: string
    }
}

export type EventImplementation<T extends keyof QueueEvents> = (arg: QueueEvents[T]) => void
