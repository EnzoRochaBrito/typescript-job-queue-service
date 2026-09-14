import { Server, ServerCredentials } from "@grpc/grpc-js";
import { QueueService } from "../../proto/jobqueue";
import type { JobQueueGrpcService } from "./service/queue/queue.grpc.service";

export function startGrpcServer(grpcService: JobQueueGrpcService, port: string) {
    const server = new Server()

    const serverService: { [K in keyof QueueService]: any} = {
        createQueue: grpcService.createQueue.bind(grpcService),
        push: grpcService.push.bind(grpcService),
        listenQueue: grpcService.listenQueue.bind(grpcService),
        deleteQueue: grpcService.deleteQueue.bind(grpcService),
        hearthbeat: grpcService.hearthbeat.bind(grpcService),
        ack: grpcService.ack.bind(grpcService),
        error: grpcService.error.bind(grpcService)
    }

    server.addService(QueueService, {
        ...serverService,
    })

    server.bindAsync(
        port,
        ServerCredentials.createInsecure(),
        (error, port) => {
            if (error) {
                console.error(error);
                return;
            }

            console.log(`gRPC server listening on port ${port}`);
        }
    );

    return server
}