import { db } from "@/db";
import { commentReactions, comments, users, videos } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm";
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

      return deletedComment;
    }),
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        parentId: z.uuid().nullish(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, input.parentId ? [input.parentId] : []));

      if (!existingComment && input.parentId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingComment?.parentId && input.parentId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [comment] = await db
        .insert(comments)
        .values({
          userId: ctx.user.id,
          parentId: input.parentId,
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
        parentId: z.uuid().nullish(),
        cursor: z
          .object({
            id: z.uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, videoId, cursor } = input;
      const { clerkUserId } = ctx;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));

      if (user) userId = user.id;

      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : []))
      );

      const videoInfo = db.$with("video_info").as(
        db
          .select({
            creatorId: users.clerkId,
            videoId: videos.id,
          })
          .from(videos)
          .innerJoin(users, eq(users.id, videos.userId))
          .where(eq(videos.id, videoId))
      );

      const replies = db.$with("replies").as(
        db
          .select({
            parentId: comments.parentId,
            count: count(comments.id).as("count"),
          })
          .from(comments)
          .where(isNotNull(comments.parentId))
          .groupBy(comments.parentId)
      );

      const [[totalData], data] = await Promise.all([
        db
          .select({
            count: count(),
          })
          .from(comments)
          .where(and(eq(comments.videoId, videoId), isNull(comments.parentId))),
        db
          .with(viewerReactions, replies, videoInfo)
          .select({
            ...getTableColumns(comments),
            user: users,
            viewerReaction: viewerReactions.type,
            replyCount: replies.count,
            createorId: videoInfo.creatorId,
            likeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, "like"),
                eq(commentReactions.commentId, comments.id)
              )
            ),
            dislikeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, "dislike"),
                eq(commentReactions.commentId, comments.id)
              )
            ),
          })
          .from(comments)
          .innerJoin(users, eq(users.id, comments.userId))
          .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
          .leftJoin(replies, eq(comments.id, replies.parentId))
          .leftJoin(videoInfo, eq(videoInfo.videoId, comments.videoId))
          .where(
            and(
              eq(comments.videoId, videoId),
              input.parentId
                ? eq(comments.parentId, input.parentId)
                : isNull(comments.parentId),
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
