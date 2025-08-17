import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
      return new NextResponse("CLERK WEBHOOK SECRET not configured", {
        status: 500,
      });
    }

    const evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { data } = evt;

      await db.insert(users).values({
        clerkId: data.id,
        name: `${data.first_name} ${data.last_name}`.trim(),
        imageUrl: data.image_url,
      });
    }

    if (eventType === "user.deleted") {
      const { data } = evt;

      if (!data.id) {
        return new NextResponse("Missing user id", { status: 400 });
      }

      await db.delete(users).where(eq(users.clerkId, data.id));
    }

    if (eventType === "user.updated") {
      const { data } = evt;

      await db
        .update(users)
        .set({
          name: `${data.first_name} ${data.last_name}`.trim(),
          imageUrl: data.image_url,
        })
        .where(eq(users.clerkId, data.id));
    }

    return new NextResponse("Webhook received", { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error verifying webhook", { status: 400 });
  }
}
