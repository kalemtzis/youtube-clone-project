import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { videos, videoUpdateSchema } from "../../../db/schema";
import { mux } from "@/lib/mux";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { UTApi } from "uploadthing/server";

export const videosRouter = createTRPCRouter({
  restoreThumbnail: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)));

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (video.thumbnailKey) {
        await new UTApi().deleteFiles(video.thumbnailKey);

        await db
          .update(videos)
          .set({
            thumbnailKey: null,
            thumbnailUrl: null,
          })
          .where(and(eq(videos.id, input.videoId), eq(videos.userId, userId)));
      }

      if (!video.muxPlaybackId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const tempThumbnailUrl = `https://image.mux.com/${video.muxPlaybackId}/thumbnail.jpg`;

      const uploadedThumbnail = await new UTApi().uploadFilesFromUrl(
        tempThumbnailUrl
      );

      if (!uploadedThumbnail.data) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const { key: thumbnailKey, ufsUrl: thumbnailUrl } =
        uploadedThumbnail.data;

      const [updatedVideo] = await db
        .update(videos)
        .set({
          thumbnailUrl,
          thumbnailKey,
        })
        .where(and(eq(videos.id, video.id), eq(videos.userId, userId)))
        .returning();

      return updatedVideo;
    }),
  remove: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [video] = await db
        .delete(videos)
        .where(and(eq(videos.userId, userId), eq(videos.id, input.videoId)))
        .returning();

      if (!video) {
        return new TRPCError({ code: "NOT_FOUND" });
      }

      return video;
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedVideo;
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policies: ["public"],
        input: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
            ],
          },
        ],
      },
      cors_origin: "*", // TODO: in production set to your url
    });

    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: "untitle",
        muxStatus: "waiting",
        muxUploadId: upload.id,
      })
      .returning();

    return {
      video: video,
      url: upload.url,
    };
  }),
});
