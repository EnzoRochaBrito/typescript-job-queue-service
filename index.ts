import { credentials } from "@grpc/grpc-js"
import { QueueClient, QueueService } from "./proto/jobqueue"
import type { DBCleanupWorkerMessage } from "./src/worker/cleanup/dbCleanup"
import type { WorkerHeartBeatMessage, WorkerHeartBeatResult } from "./src/worker/heartbeat/workerHeartBeat"

// const DBCleanupWorker = new Worker(
//     new URL("./src/worker/dbCleanup.ts", import.meta.url).href
// )

// const init: DBCleanupWorkerMessage = {
//     message: "init",
//     delay: 3
// }

// const close: DBCleanupWorkerMessage = {
//     message: "close",
// }

// DBCleanupWorker.postMessage(init)

// setTimeout(() => DBCleanupWorker.postMessage(close), 10000)
