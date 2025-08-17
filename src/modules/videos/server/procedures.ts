import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { videos } from '../../../db/schema';

export const videosRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const [video] = await db.insert(videos).values({
      userId,
      title: "untitle"
    }).returning()

    return {
      video: video
    }
  }),
});
