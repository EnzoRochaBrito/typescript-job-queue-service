import { describe, expect, test } from "bun:test"
import { Job } from "./job"


describe("Job Class", () => {

    test("Job Retry Logic (No Retry)", () => {

        const noRetryJob = Job.create({
            data: new Date(),
            queue: ""
        })

        expect(noRetryJob.retry()).toBeFalse()
    })

    test("Job Retry Logic (With Retry)", () => {
        const RETRY_ATTEMPTS = 5 as const

        const retryJob = Job.create({
            data: new Date(),
            queue: "",
            meta: {
                retry: {
                    attempts: RETRY_ATTEMPTS,
                    backoff: {
                        delay: 0,
                        type: "fixed"
                    }
                }
            }
        })

        for (let i = 0; i < RETRY_ATTEMPTS; i++) {
            expect(retryJob.retry()).toBeTrue()
        }

        expect(retryJob.retry()).toBeFalse()
    })

    test("Job Retry Logic (Fixed Backoff)", () => {
        
        const RETRY_ATTEMPTS = 5 as const
        const FIXED_BACKOFF = 1000

        const fixedRetry = Job.create({
            data: new Date(),
            queue: "",
            meta: {
                retry: {
                    attempts: RETRY_ATTEMPTS,
                    backoff: {
                        delay: FIXED_BACKOFF,
                        type: "fixed"
                    }
                }
            }
        })

        while (fixedRetry.retry()) { continue }

        expect(fixedRetry.backoffTime() === FIXED_BACKOFF).toBeTrue()

    }) 

    test("Job Retry Logic (Exponential Backoff)", () => {
        
        const RETRY_ATTEMPTS = 5 as const
        const BACKOFF_TIME = 1000

        const expRetry = Job.create({
            data: new Date(),
            queue: "",
            meta: {
                retry: {
                    attempts: RETRY_ATTEMPTS,
                    backoff: {
                        delay: BACKOFF_TIME,
                        type: "exponential"
                    }
                }
            }
        })

        while (expRetry.retry()) { }

        /**
         * Exponential backoff
         * T * ( 2 ** Attempt - 1 ), 
         * 
         * Attempt >= 1
         * 
         * Ex: 
         *      backoff time (BT) = 1s
         *      1th attempt: BT = 1s
         *      2th attempt: BT = 2s
         *      3th attempo: BT = 4s
         */


        expect(expRetry.backoffTime() === (BACKOFF_TIME * (2 ** (RETRY_ATTEMPTS - 1)))).toBeTrue()

    }) 

})