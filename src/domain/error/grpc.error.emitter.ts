import type { ServerErrorResponse } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants"

class GrpcError extends Error {
    constructor(
        public readonly err: ServerErrorResponse
    ) {
        super(err.message, {
            cause: err.cause
        });
    }
}