import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { users, videoReactions, videos, videoViews } from "../../../db/schema";
import { and, count, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import z from "zod";

export const playlistsRouter = createTRPCRouter({
  getLikedVideos: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            likedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const viewerVideoReactions = db.$with("viewer-video-reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, ctx.user.id),
              eq(videoReactions.type, "like")
            )
          )
      );

      const data = await db
        .with(viewerVideoReactions)
        .select({
          ...getTableColumns(videos),
          user: users,
          likedAt: viewerVideoReactions.likedAt,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like")
            )
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike")
            )
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .innerJoin(
          viewerVideoReactions,
          eq(videos.id, viewerVideoReactions.videoId)
        )
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewerVideoReactions.likedAt, cursor.likedAt),
                  and(
                    eq(viewerVideoReactions.likedAt, cursor.likedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
        .limit(limit + 1);

        const hasMore = data.length > limit;
        const items = hasMore ? data.slice(0, -1) : data;
        const lastItem = items[items.length - 1];
        const nextCursor = hasMore
          ? {
              id: lastItem.id,
              likedAt: lastItem.likedAt,
            }
          : null;

        return {
          items,
          nextCursor,
        };
    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            viewedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { cursor, limit } = input;

      const viewerVideoViews = db.$with("viewer-video-views").as(
        db
          .select({
            videoId: videoViews.videoId,
            viewedAt: videoViews.updatedAt,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, ctx.user.id))
      );

      const data = await db
        .with(viewerVideoViews)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewedAt: viewerVideoViews.viewedAt,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "like")
            )
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, "dislike")
            )
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .innerJoin(viewerVideoViews, eq(videos.id, viewerVideoViews.videoId))
        .where(
          and(
            eq(videos.visibility, "public"),
            cursor
              ? or(
                  lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                  and(
                    eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            viewedAt: lastItem.viewedAt,
          }
        : null;

      return {
        items,
        nextCursor,
      };
    }),
});
