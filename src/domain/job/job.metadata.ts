export interface JobMetadata {
    retry?: JobRetryMeta,
    lifetime?: JobLifetimeMeta,
    priority?: number,
    delay?: number
}

type JobRetryMeta = {
    attempts: number,
    backoff: {
        type: "fixed" | "exponential",
        delay: number
    },
    currentAttempt?: number,
}

type JobLifetimeMeta = {
    removeOnSuccess?: {
        days: number
    } | boolean,
    removeOnFail?: boolean
}