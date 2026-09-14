import type { BunMessageEvent } from "bun"
import { requestWorker } from "../request"

declare const self: Worker

let timeoutID: NodeJS.Timeout

self.onmessage = (ev: BunMessageEvent<QProducerWorkerMessage>) => {
    const { message } = ev.data

    switch(message) {
        case "init":
            initProducer(ev.data.delay)
            break

        case "close":
            closeProducer()
            break
    }
}

function initProducer(delay: number = 100) {
    timeoutID = setInterval(async () => {
        self.postMessage("pool")
    }, delay)
}

function closeProducer() {
    clearInterval(timeoutID)
}

type InitQProducer = {
    message: "init",
    /**
     * Milisseconds
     */
    delay?: number,

}

type CloseQProducer = {
    message: "close"
}

type TriggerQProducer = {
    message: "trigger",
    queue: string
}

export type QProducerWorkerMessage =
    | InitQProducer
    | CloseQProducer
    | TriggerQProducer
;