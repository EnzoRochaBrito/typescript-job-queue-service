import PG from "pg";
import { eventBus } from "../eventBus";

export async function loadDBListener(databaseUrl: string) {
    const dbListener = new PG.Client(databaseUrl)

    await dbListener.connect()

    await dbListener.query("LISTEN job_created")

    dbListener
        .on("notification", m => {
            const { channel, payload } = (m as any as Events)
            switch (channel) {
                case "job_created":
                    eventBus.emit("queue:job:new", {
                        queueName: payload
                    })
                    break
            }
        })
    return dbListener
}


type CreatedJobEvent = {
    channel: "job_created",
    /**
     * Queue name
     */
    payload: string
}

type Events = 
    | CreatedJobEvent