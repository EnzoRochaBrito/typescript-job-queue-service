import { PrismaPg } from "@prisma/adapter-pg"
import { JobStatus, PrismaClient } from "../../../prisma/generated/prisma/client"
import type PG from "pg"

declare const self: Worker

let workerDBConn: PrismaClient | undefined = undefined
let poolIntervalID: NodeJS.Timeout | undefined = undefined
let isInited: boolean = false

const getCleanupDateLimit = (days: number) => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - days)
    return targetDate
}

async function cleanDb(c: PrismaClient, ageInDays: number = 7) {
    await c.job.deleteMany({
        where: {
            status: {
                in: [JobStatus.Discarded, JobStatus.Completed]
            },
            created_at: {
                lt: getCleanupDateLimit(ageInDays)
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
            if (poolIntervalID === undefined) {
                const { jobAge } = ev.data
                poolIntervalID = setInterval(
                    () => cleanDb(workerDBConn!, jobAge), ev.data.delay ? ev.data.delay * 1000 : 60000
                )
            }

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
    delay?: number,
    /**
     * In days
     */
    jobAge?: number,
}

type CloseDBCleanupWorker = {
    message: "close"
}

export type DBCleanupWorkerMessage = 
    | InitDBCleanupWorker
    | CloseDBCleanupWorker
;