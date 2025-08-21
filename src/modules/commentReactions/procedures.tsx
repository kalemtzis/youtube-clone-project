import { db } from "@/db";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const commentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(
      z.object({
        commentId: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [commentReaction] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, input.commentId),
            eq(commentReactions.userId, ctx.user.id),
            eq(commentReactions.type, "like")
          )
        );

      if (commentReaction) {
        const [deletedCommentReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.commentId, input.commentId),
              eq(commentReactions.userId, ctx.user.id)
            )
          )
          .returning();

        return deletedCommentReaction;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({
          userId: ctx.user.id,
          commentId: input.commentId,
          type: "like",
        })
        .onConflictDoUpdate({
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: "like",
          },
        })
        .returning();

      return createdCommentReaction;
    }),
  dislike: protectedProcedure
    .input(
      z.object({
        commentId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [commentReaction] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, input.commentId),
            eq(commentReactions.userId, ctx.user.id),
            eq(commentReactions.type, "dislike")
          )
        );

      if (commentReaction) {
        const [deletedCommentReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.commentId, input.commentId),
              eq(commentReactions.userId, ctx.user.id)
            )
          )
          .returning();

        return deletedCommentReaction;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({
          userId: ctx.user.id,
          commentId: input.commentId,
          type: "dislike",
        })
        .onConflictDoUpdate({
          target: [commentReactions.commentId, commentReactions.userId],
          set: {
            type: "dislike",
          },
        })
        .returning();

      return createdCommentReaction;
    }),
});
