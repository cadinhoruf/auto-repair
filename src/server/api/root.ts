import { budgetRouter } from "@/server/api/routers/budget";
import { cashFlowRouter } from "@/server/api/routers/cashFlow";
import { clientRouter } from "@/server/api/routers/client";
import { serviceOrderRouter } from "@/server/api/routers/serviceOrder";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	client: clientRouter,
	serviceOrder: serviceOrderRouter,
	cashFlow: cashFlowRouter,
	budget: budgetRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.client.list();
 */
export const createCaller = createCallerFactory(appRouter);
