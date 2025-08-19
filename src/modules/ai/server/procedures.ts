import { DESCRIPTION_SYSTEM_PROMPT, TITLE_SYSTEM_PROMPT } from "@/constants";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { openai } from "@/lib/openai";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const aiRouter = createTRPCRouter({
  generateThumbnail: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {}),
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
