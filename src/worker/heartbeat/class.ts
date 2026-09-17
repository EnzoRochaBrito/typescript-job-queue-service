import type { WorkerCleaner } from "../../domain/worker/cleaner"
import type { WorkerRegistry } from "../../domain/worker/worker.registry"
import type { WorkerHeartBeatMessage, WorkerHeartBeatResult } from "./workerHeartBeat"

export class WorkerHeartbeat {

    private readonly heartbeatWorker: Worker

    constructor(
        private readonly workerRegistry: WorkerRegistry,
        private readonly workerCleaner: WorkerCleaner
    ) {
        this.heartbeatWorker = new Worker(new URL("./workerHeartBeat.ts", import.meta.url).href)
        this.loadHeartbeatMessageHandler()
    }

    beat(workerID: string) {
        const message: WorkerHeartBeatMessage = { workerID }
        if (!this.workerRegistry.get(workerID))
            return
        this.heartbeatWorker.postMessage(message)
    }

    private loadHeartbeatMessageHandler() {
        this.heartbeatWorker.onmessage = (ev: Bun.MessageEvent<WorkerHeartBeatResult>) => {
            const { data } = ev
            data.forEach(silentWorkerID => {
                this.workerCleaner.clean(this.workerRegistry.get(silentWorkerID)!)
            })
        }
    }

    terminate() {
        this.heartbeatWorker.terminate()
    }
}