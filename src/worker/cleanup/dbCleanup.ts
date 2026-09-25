import { PrismaPg } from "@prisma/adapter-pg"
import { JobStatus, PrismaClient } from "../../../prisma/generated/prisma/client"
import type PG from "pg"

declare const self: Worker

let workerDBConn: PrismaClient | undefined = undefined
let poolIntervalID: NodeJS.Timeout | undefined = undefined
let isInited: boolean = false

const defaultCleanupTime = () => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - 7)
    return targetDate
}

async function cleanDb(c: PrismaClient, date: Date = defaultCleanupTime()) {
    await c.job.deleteMany({
        where: {
            status: {
                in: [JobStatus.Discarded, JobStatus.Completed]
            },
            created_at: {
                lt: date
            }
        }
    })
}

async function bootPrismaClient() {
    await workerDBConn?.$connect()
}

async function disconnectPrismaClinet() {
    await workerDBConn?.$disconnect()
}

self.onmessage = async (ev: Bun.MessageEvent<DBCleanupWorkerMessage>) => {
    const { message } = ev.data

    switch (message) {
        case "init":
            if (isInited)
                return

            isInited = true

            const config: PG.PoolConfig = {
                connectionString: process.env.DATABASE_URL!,
                max: 1
            }

            if (workerDBConn === undefined)
                workerDBConn = new PrismaClient({
                    adapter: new PrismaPg(config),
                })
            
            await bootPrismaClient()

            if (poolIntervalID === undefined)
                poolIntervalID = setInterval(() => cleanDb(workerDBConn!), ev.data.delay ? ev.data.delay * 1000 : 60000)

            break

        case "close":
            if (!isInited)
                return

            isInited = false

            clearInterval(poolIntervalID)

            await disconnectPrismaClinet()
    }
}


type InitDBCleanupWorker = {
    message: "init",
    /**
     * In seconds
     */
    delay?: number
}

type CloseDBCleanupWorker = {
    message: "close"
}

export type DBCleanupWorkerMessage = 
    | InitDBCleanupWorker
    | CloseDBCleanupWorker
;