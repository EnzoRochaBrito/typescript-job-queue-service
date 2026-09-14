declare const self: Worker

type WorkerID = string
type LastHeartbeat = Date

const workerLastHeartbeat: Map<WorkerID, LastHeartbeat> = new Map()

export type WorkerHeartBeatMessage = {
    workerID: WorkerID
}

export type WorkerHeartBeatResult = WorkerID[]

/**
 * Max time a worker can stay connected without sending a heartbeat
 */
const HEARTBEAT_MAX_TIME = 2000

let deadWorkerArray = new Array<WorkerID>()

setInterval(() => {
    workerLastHeartbeat.keys()
        .forEach(workerID => {
            const lastHeartBeat = workerLastHeartbeat.get(workerID)!
            const differenceInSeconds = (new Date().getTime() - lastHeartBeat.getTime())
            if (differenceInSeconds > HEARTBEAT_MAX_TIME) {
                deadWorkerArray.push(workerID)
            }
        })
    
    if (deadWorkerArray.length !== 0) {
        self.postMessage(deadWorkerArray)
        deadWorkerArray
            .forEach(deadID => {
                workerLastHeartbeat.delete(deadID)
            })
        deadWorkerArray = []
    }
}, 1000)

self.onmessage = (ev: Bun.MessageEvent<WorkerHeartBeatMessage>) => {
    const { workerID } = ev.data
    workerLastHeartbeat.set(workerID, new Date())
}
