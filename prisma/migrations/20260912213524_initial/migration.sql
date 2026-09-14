-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('Available', 'Executing', 'Retryable', 'Completed', 'Discarded');

-- CreateTable
CREATE TABLE "Queue" (
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "queue_name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_until" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_status_created_at_idx" ON "Job"("status", "created_at");

-- CreateIndex
CREATE INDEX "Job_status_lease_until_idx" ON "Job"("status", "lease_until");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_queue_name_fkey" FOREIGN KEY ("queue_name") REFERENCES "Queue"("name") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Create function to notify when a job is created
CREATE OR REPLACE FUNCTION notify_job_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'job_created',
        NEW.queue_name
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER job_created_trigger
AFTER INSERT ON "Job"
FOR EACH ROW
EXECUTE FUNCTION notify_job_created();
