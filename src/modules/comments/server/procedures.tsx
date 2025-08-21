import { db } from "@/db";
import { comments, commentsInsertSchema, users, videos } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import z from "zod";

export const commentsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [deletedComment] = await db
        .delete(comments)
        .where(and(eq(comments.id, input.id), eq(comments.userId, ctx.user.id)))
        .returning();

      if (!deletedComment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return deletedComment;
    }),
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await db
        .insert(comments)
        .values({
          userId: ctx.user.id,
          videoId: input.videoId,
          value: input.value,
        })
        .returning();

      return comment;
    }),
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        // TODO: add cursor and limit for pagination
        cursor: z
          .object({
            id: z.uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { limit, videoId, cursor } = input;

      const [[totalData], data] = await Promise.all([
        db
          .select({
            count: count(),
          })
          .from(comments)
          .where(eq(comments.videoId, videoId)),
        db
          .select({
            ...getTableColumns(comments),
            user: users,
            totalCount: db.$count(comments, eq(comments.videoId, videoId)),
          })
          .from(comments)
          .where(
            and(
              eq(comments.videoId, videoId),
              cursor
                ? or(
                    lt(comments.updatedAt, cursor.updatedAt),
                    and(
                      eq(comments.updatedAt, cursor.updatedAt),
                      lt(comments.id, cursor.id)
                    )
                  )
                : undefined
            )
          )
          .innerJoin(users, eq(users.id, comments.userId))
          .orderBy(desc(comments.updatedAt), desc(comments.id))
          .limit(limit + 1),
      ]);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
        : null;

      return {
        items,
        totalCount: totalData.count,
        nextCursor,
      };
    }),
});
