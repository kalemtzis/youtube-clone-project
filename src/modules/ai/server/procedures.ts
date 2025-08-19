import { DESCRIPTION_SYSTEM_PROMPT, TITLE_SYSTEM_PROMPT } from "@/constants";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { openai } from "@/lib/openai";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import z from "zod";

export const aiRouter = createTRPCRouter({
  generateThumbnail: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        prompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [video] = await db
        .select()
        .from(videos)
        .where(
          and(eq(videos.id, input.videoId), eq(videos.userId, ctx.user.id))
        );

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const res = (await openai.images.generate({
        model: "dall-e-3",
        n: 1,
        size: "1792x1024",
        prompt: input.prompt,
        response_format: "url",
        quality: "standard",
      })) as { data: { url: string }[] };

      const tempThumbnailUrl = res.data[0].url;

      if (!tempThumbnailUrl) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const utapi = new UTApi();

      const { data, error } = await utapi.uploadFilesFromUrl(tempThumbnailUrl);

      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      if (video.thumbnailKey) {
        await utapi.deleteFiles(video.thumbnailKey);
        await db
          .update(videos)
          .set({
            thumbnailKey: null,
            thumbnailUrl: null,
          })
          .where(
            and(eq(videos.id, input.videoId), eq(videos.userId, ctx.user.id))
          );
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          thumbnailKey: data.key,
          thumbnailUrl: data.ufsUrl,
        })
        .where(
          and(eq(videos.id, input.videoId), eq(videos.userId, ctx.user.id))
        ).returning();

      return updatedVideo;
    }),
  generateDescription: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [video] = await db
        .select()
        .from(videos)
        .where(
          and(eq(videos.id, input.videoId), eq(videos.userId, ctx.user.id))
        );

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
      const response = await fetch(trackUrl);
      const transcript = await response.text();

      const res = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: DESCRIPTION_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
      });

      const description = res.choices[0].message.content;

      if (!description) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          description,
        })
        .where(
          and(eq(videos.id, input.videoId), eq(videos.userId, ctx.user.id))
        )
        .returning();

      return updatedVideo;
    }),
  generateTitle: protectedProcedure
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

      const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
      const response = await fetch(trackUrl);
      const transcript = await response.text();

      if (!transcript) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const res = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: TITLE_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
      });

      const title = res.choices[0].message.content;

      if (!title) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title,
        })
        .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)))
        .returning();

      return updatedVideo;
    }),
});
