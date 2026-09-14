import type { WorkerInstance } from "./worker";

export class WorkerRegistry {
    private readonly worker = new Map<string, WorkerInstance>()

    add(worker: WorkerInstance) {
        this.worker.set(worker.ID, worker)
    }

    get(workerId: string) {
        return this.worker.get(workerId)
    }

    remove(workerId: string) {
        this.worker.delete(workerId)
    }
}