import { CompressImageWorker } from "./worker";

const WorkersAmount = 5

for (let index = 0; index < WorkersAmount; index++) {
    new CompressImageWorker()
}
