import { db } from "@/db";
import { subscriptions, users, videos } from "@/db/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, getTableColumns, inArray, isNotNull } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import z from "zod";

export const usersRouter = createTRPCRouter({
  resetBanner: protectedProcedure
    .input(
      z.object({
        userId: z.uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId } = input;

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (user.bannerKey) {
        await new UTApi().deleteFiles(user.bannerKey);

        const [updatedUser] = await db
          .update(users)
          .set({
            bannerKey: null,
            bannerUrl: null,
          })
          .where(eq(users.id, user.id))
          .returning();

        return updatedUser;
      }

      throw new TRPCError({ code: "BAD_REQUEST" });
    }),
  getOne: baseProcedure
    .input(
      z.object({
        userId: z.uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;

      let uId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));

      if (user) uId = user.id;

      const viewerSubscriptions = db.$with("viewer_subscriptions").as(
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, uId ? [uId] : []))
      );

      const [existingUser] = await db
        .with(viewerSubscriptions)
        .select({
          ...getTableColumns(users),
          viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(
            Boolean
          ),
          videoCount: db.$count(videos, eq(videos.userId, users.id)),
          subscriberCount: db.$count(
            subscriptions,
            eq(subscriptions.creatorId, users.id)
          ),
        })
        .from(users)
        .leftJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.creatorId, users.id)
        )
        .where(eq(users.id, input.userId));

      if (!existingUser) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return existingUser;
    }),
});
