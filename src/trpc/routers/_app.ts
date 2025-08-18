import { studioRouter } from "@/modules/studio/server/procedures";
import { createTRPCRouter } from "../init";
import { categoriesRouter } from "@/modules/categories/server/procedures";
import { videosRouter } from "@/modules/videos/server/procedures";
import { aiRouter } from "@/modules/ai/server/procedures";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter,
  videos: videosRouter,
  ai: aiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
