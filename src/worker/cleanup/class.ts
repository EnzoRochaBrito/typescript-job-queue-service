import type { PrismaDatabaseConnection } from "../../infra/db/prisma.db"
import type { DBCleanupWorkerMessage } from "./dbCleanup"


export class CleanupWorker {

    private readonly cleanupWorker: Worker

    constructor() {
        this.cleanupWorker = new Worker(new URL("./dbCleanup.ts", import.meta.url).href)
    }

    init() {
        this.cleanupWorker.postMessage({
            message: "init",
            delay: 60 // seconds
        } as DBCleanupWorkerMessage)
    }

    close() {
        this.cleanupWorker.postMessage({
            message: "close"
        } as DBCleanupWorkerMessage)
    }

    terminate() {
        this.cleanupWorker.terminate()
    }
}