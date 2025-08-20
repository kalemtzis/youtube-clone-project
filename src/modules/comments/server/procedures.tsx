import { db } from "@/db";
import { comments, commentsInsertSchema, users } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { eq, getTableColumns } from "drizzle-orm";
import z from "zod";

export const commentsRouter = createTRPCRouter({
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
      })
    )
    .query(async ({ input }) => {
      const data = await db
        .select({
          ...getTableColumns(comments),
          user: users
        })
        .from(comments)
        .where(eq(comments.videoId, input.videoId))
        .innerJoin(users, eq(users.id, comments.userId));

      return data;
    }),
});
