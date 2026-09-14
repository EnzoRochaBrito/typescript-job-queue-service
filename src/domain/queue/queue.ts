import { Dispatcher } from "../dispatcher/dispatcher";
import type { Job } from "../job/job";
import { WorkerScheduler } from "../scheduler/scheduler";
import type { WorkerInstance } from "../worker/worker";
import { WorkerRegistry } from "../worker/worker.registry";

export class Queue {

    private readonly _scheduler: WorkerScheduler
    private readonly _dispatcher: Dispatcher

    constructor(
        public readonly name: string,
        workerRegistry: WorkerRegistry,
        readonly rateLimit: number = 10
    ) {
        this._scheduler = new WorkerScheduler(workerRegistry),
        this._dispatcher = new Dispatcher(this._scheduler)
    }

    pushWorker(worker: WorkerInstance) {
        this._scheduler.pushWorker(worker.ID)
    }

    removeWorker(workerID: string) {
        this._scheduler.removeWorker(workerID)
    }

    sendJob(job: Job) {
        this._dispatcher.sendJob(job)
    }

    getAvailableWorkers() {
        return this._scheduler.availableWorkers
    }

    isAvailable() {
        if (this._scheduler.maximumConcurrency <= this.rateLimit)
            return this._scheduler.availableWorkers > 0
        else
            return this.rateLimitAllow()
    }

    private rateLimitAllow() {
        return this._scheduler.concurrencyRunning <= this.rateLimit
    }

    static create(data: {
        queueName: string
    }, workerRegistry: WorkerRegistry) {
        return new Queue(
            data.queueName,
            workerRegistry
        )
    }
}