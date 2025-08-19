import { db } from "@/db";
import { videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const videoViewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await db
        .select()
        .from(videoViews)
        .where(
          and(
            eq(videoViews.videoId, input.videoId),
            eq(videoViews.userId, ctx.user.id)
          )
        );

      if (record) return record;

      const [createdRecord] = await db
        .insert(videoViews)
        .values({
          userId: ctx.user.id,
          videoId: input.videoId,
        })
        .returning();

      if (!createdRecord) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return createdRecord;
    }),
});
