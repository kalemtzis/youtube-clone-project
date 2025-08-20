import { studioRouter } from "@/modules/studio/server/procedures";
import { createTRPCRouter } from "../init";
import { categoriesRouter } from "@/modules/categories/server/procedures";
import { videosRouter } from "@/modules/videos/server/procedures";
import { aiRouter } from "@/modules/ai/server/procedures";
import { videoViewsRouter } from "@/modules/video-views/servers/procedures";
import { videoReactionsRouter } from "@/modules/video-reactions/servers/procedures";
import { subscriptionsRouter } from "@/modules/subscriptions/server/procedures";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter,
  videos: videosRouter,
  ai: aiRouter,
  videoViews: videoViewsRouter,
  videoReactions: videoReactionsRouter,
  subscriptions: subscriptionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
