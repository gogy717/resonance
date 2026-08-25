import { initTRPC } from "@trpc/server";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
    // this runs once per request — good place to read cookies/auth                      
    return { userId: "user_123" };
});

const t = initTRPC.create(
    // transformer: superjson
);

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure; // the building block for every endpoint
export const createCallerFactory = t.createCallerFactory;