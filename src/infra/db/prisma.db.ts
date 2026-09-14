import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


export class PrismaDatabaseConnection extends PrismaClient {
    constructor(url: string) {
        super({
            adapter: new PrismaPg({
                connectionString: url,
             })
        });
        this.$connect()
    }
}