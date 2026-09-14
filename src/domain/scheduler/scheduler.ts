import type { WorkerInstance } from "../worker/worker"
import type { WorkerRegistry } from "../worker/worker.registry"

type WorkerID = string

export class WorkerScheduler {
    
    private workers: WorkerID[]
    private workerIndex: number
    
    constructor(
        private readonly workerRegistry: WorkerRegistry
    ) {
        this.workers = []
        this.workerIndex = 0
    }

    pushWorker(workerID: WorkerID) {
        this.workers.push(workerID)
    }

    removeWorker(workerID: string) {
        this.workers = this.workers.filter(w => w !== workerID)
    }

    /**
     * Performs a Round Robin scheduling (NEEDS BETTER IMPLEMENTATION)
     * @returns 
     */
    nextWorker(): WorkerInstance | undefined { // needs to wait for an available worker
        for (let i = 0; i < this.workersAmount; i++) {

            const currentWorkerID = this.nextWorkerID

            const workerFetched = this.workerRegistry.get(currentWorkerID!)

            if (!workerFetched) {
                this.removeWorker(currentWorkerID!)
                continue
            }

            if (!workerFetched.canWork())
                continue

            
            return workerFetched
        }
    }

    get _index(): number {
        const i = this.workerIndex
        this.workerIndex = (this.workerIndex + 1) % this.workersAmount
        return i
    }

    get nextWorkerID() {
        return this.workers[this._index]
    }

    get workersAmount(): number {
        this.clearDeadWorkers()
        return this.workers.length
    }

    get availableWorkers() {
        const availableWorkersLen = this.workers.filter(wID => {
            const w = this.workerRegistry.get(wID)
            if (!w)
                return false
            return w.canWork()
        }).length
        return availableWorkersLen
    }

    get maximumConcurrency() {
        let total = 0
        this.workers.forEach(wID => {
            const w = this.workerRegistry.get(wID)
            if (!w)
                return
            total += w.concurrency
        })
        return total
    }

    get concurrencyRunning() {
        let beingExecutend = 0
        this.workers.forEach(wID => {
            const w = this.workerRegistry.get(wID)
            if (!w)
                return
            beingExecutend += w.currentConcurrentJobs
        })
        return beingExecutend
    }

    get availableConcurrency() {
        return this.maximumConcurrency - this.concurrencyRunning
    }

    private clearDeadWorkers() {
        this.workers = this.workers.filter(w => !!this.workerRegistry.get(w))
    }
}