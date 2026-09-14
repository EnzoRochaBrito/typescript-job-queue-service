export function requestWorker<T>(worker: Worker, message: any): Promise<T> {
    return new Promise((resolve, reject) => {
        const handler = (res: any) => {
            worker.removeEventListener("message", handler)
            resolve(res)
        }
        worker.addEventListener("message", handler)
        worker.postMessage(message)
    })
}