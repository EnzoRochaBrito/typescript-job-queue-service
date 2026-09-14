import { credentials } from "@grpc/grpc-js"
import { QueueClient } from "../../../proto/jobqueue"
import type { ClassFields } from "../../types/extract.class.fields"
import type { Job, JobDTO } from "../../domain/job/job"

type Connection = {
    address: string
}

type Handler = (job: ClassFields<Job>) => void | Promise<void>

export abstract class WorkerClient<T=any> {

    private readonly queueClient: QueueClient

    private heartbeatIntervalID: NodeJS.Timeout
    protected workerID: string = ""

    constructor(
        queue: string,
        connection: Connection,
        public readonly concurrency: number = 1
    ) {
        this.queueClient = new QueueClient(connection.address, credentials.createInsecure())
        this.connect(queue)
        this.heartbeatIntervalID = this.startHeartbeat()
    }

    abstract execute(job: ClassFields<Job<T>>): void;

    protected ack(job: ClassFields<Job<T>>): void {
        this.queueClient.ack({
            jobID: job.ID,
            workerID: this.workerID
        }, () => {})
    }

    protected error(job: ClassFields<Job<T>>): void {
        this.queueClient.error({
            jobID: job.ID,
            workerID: this.workerID
        }, () => {})
    }

    private connect(queue: string) {
        const stream = this.queueClient.listenQueue({
            queue,
            concurrency: this.concurrency
        })

        const handleStream = (data: any) => {
            if (data.queueConnectResponse)
                this.workerID = data.queueConnectResponse.workerId
            else
                this.execute(data.jobDataResponse.jobData)
        }

        stream
            .on("data", handleStream)
            .on("close", () => {
                this.stopHeartbeat()
                stream.removeListener("data", handleStream)
                this.connect(queue)
            })
    }

    private startHeartbeat() {
        return setInterval(() => {
            this.queueClient.hearthbeat({
                worker: this.workerID
            }, (e,r) => {})
        }, 800)
    }

    private stopHeartbeat() {
        clearInterval(this.heartbeatIntervalID)
    }
}