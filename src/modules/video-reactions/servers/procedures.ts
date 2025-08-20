import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const videoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [reaction] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId, input.videoId),
            eq(videoReactions.userId, ctx.user.id),
            eq(videoReactions.type, "like")
          )
        );

      if (reaction) {
        const [deletedReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, ctx.user.id),
              eq(videoReactions.videoId, input.videoId)
            )
          )
          .returning();

        return deletedReaction;
      }

      const [createdReaction] = await db
        .insert(videoReactions)
        .values({
          userId: ctx.user.id,
          videoId: input.videoId,
          type: "like",
        })
        .onConflictDoUpdate({
          target: [videoReactions.videoId, videoReactions.userId],
          set: {
            type: "like",
          },
        })
        .returning();

      if (!createdReaction) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return createdReaction;
    }),
  dislike: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [reaction] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId, input.videoId),
            eq(videoReactions.userId, ctx.user.id),
            eq(videoReactions.type, "dislike")
          )
        );

      if (reaction) {
        const [deletedReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, ctx.user.id),
              eq(videoReactions.videoId, input.videoId)
            )
          )
          .returning();

        return deletedReaction;
      }

      const [createdReaction] = await db
        .insert(videoReactions)
        .values({
          userId: ctx.user.id,
          videoId: input.videoId,
          type: "dislike",
        })
        .onConflictDoUpdate({
          target: [videoReactions.videoId, videoReactions.userId],
          set: {
            type: "dislike",
          },
        })
        .returning();

      if (!createdReaction) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return createdReaction;
    }),
});
