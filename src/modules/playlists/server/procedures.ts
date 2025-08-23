import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  playlists,
  playlistVideos,
  users,
  videoReactions,
  videos,
  videoViews,
} from "../../../db/schema";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const playlistsRouter = createTRPCRouter({
  getManyForVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        cursor: z
          .object({
            id: z.string(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { cursor, limit, videoId } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          user: users,
          videosCount: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id)
          ),
          containsVideo: videoId
            ? sql<boolean>`(select exists (
            select 1 from ${playlistVideos} pv 
            where pv.playlist_id = ${playlists.id}
            and pv.video_id = ${videoId}
          ))`
            : sql<boolean>`false`,
        })
        .from(playlists)
        .innerJoin(users, eq(users.id, playlists.userId))
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        .limit(limit + 1);

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
        nextCursor,
      };
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        playlistId: z.uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const { playlistId } = input;

      const [playlist] = await db
        .select({
          ...getTableColumns(playlists),
          user: users,
        })
        .from(playlists)
        .innerJoin(users, eq(users.id, playlists.userId))
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!playlist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        });
      }

      return playlist;
    }),
  // ! TODO: add information about number of videos in the playlist and maybe a thumbnail from the first video in the playlist (populate)
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          user: users,
          videosCount: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id)
          ),
        })
        .from(playlists)
        .innerJoin(users, eq(users.id, playlists.userId))
        .where(
          and(
            eq(playlists.userId, userId),
            cursor
              ? or(
                  lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        .limit(limit + 1);

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
        nextCursor,
      };
    }),
  removeVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.uuid(),
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const { playlistId, videoId } = input;

      const [playlist] = await db
        .select({
          playlistUserId: playlists.userId,
        })
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!playlist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        });
      }

      const [video] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.videoId, video.id),
            eq(playlistVideos.playlistId, playlistId)
          )
        );

      if (!existingPlaylistVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [deletedVideo] = await db
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId)
          )
        )
        .returning();

      if (!deletedVideo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not remove video from playlist",
        });
      }

      return deletedVideo;
    }),
  remove: protectedProcedure
    .input(
      z.object({
        playlistId: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const { playlistId } = input;

      const [deletedPlaylist] = await db
        .delete(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
        .returning();

      if (!deletedPlaylist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not delete playlist",
        });
      }

      return deletedPlaylist;
    }),
  addVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.uuid(),
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const userId = ctx.user.id;

      const [playlist] = await db
        .select()
        .from(playlists)
        .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));

      if (!playlist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        });
      }

      const [video] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.videoId, video.id),
            eq(playlistVideos.playlistId, playlist.id)
          )
        );

      if (existingPlaylistVideo) {
        throw new TRPCError({ code: "CONFLICT" });
      }

      const [createdPlaylistVideo] = await db
        .insert(playlistVideos)
        .values({
          playlistId,
          videoId,
        })
        .returning();

      if (!createdPlaylistVideo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not add video to playlist",
        });
      }

      return createdPlaylistVideo;
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().max(300),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { name, description } = input;

      const [createdPlaylist] = await db
        .insert(playlists)
        .values({
          name: name,
          description,
          userId,
        })
        .returning();

      if (!createdPlaylist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not create playlist",
        });
      }

      return createdPlaylist;
    }),
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
