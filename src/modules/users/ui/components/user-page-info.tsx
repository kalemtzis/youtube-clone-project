"use client";

import { UserAvatar } from "@/components/user-avatar";
import { UsersGetOneOutput } from "../../types";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription";
import { cn } from "@/lib/utils";

interface Props {
  data: UsersGetOneOutput;
}

export const UserPageInfo = ({ data }: Props) => {
  const { userId, isLoaded } = useAuth();
  const clerk = useClerk();
  const { isPending, onClick } = useSubscription({
    userId: data.id,
    isSubscribed: data.viewerSubscribed,
  });

  const handleClick = () => {
    if (data.clerkId === userId) {
      clerk.openUserProfile();
    }
  };

  return (
    <div className="py-6">
      {/* Mobile */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-center gap-3">
          <UserAvatar
            {...data}
            size="lg"
            className="h-[60px] w-[60px]"
            onClick={handleClick}
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{data.name}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{data.subscriberCount} subscribers</span>
              <span>&bull;</span>
              <span>{data.videoCount} videos</span>
            </div>
          </div>
        </div>

        {userId === data.clerkId ? (
          <Button
            variant="secondary"
            asChild
            className="w-full mt-3 rounded-full"
          >
            <Link href={`/studio`}>Go to studio</Link>
          </Button>
        ) : (
          <SubscriptionButton
            disabled={isPending || !isLoaded}
            isSubscribed={data.viewerSubscribed}
            onClick={onClick}
            className="w-full mt-3"
          />
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-start gap-4">
        <UserAvatar
          {...data}
          size="xl"
          className={cn(
            userId === data.clerkId &&
              "cursor-pointer hover:opacity-80 transition-opacity duration-300"
          )}
          onClick={handleClick}
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold">{data.name}</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
            <span>{data.subscriberCount} subscribers</span>
            <span>&bull;</span>
            <span>{data.videoCount} videos</span>
          </div>

          {userId === data.clerkId ? (
            <Button
              variant="secondary"
              asChild
              className="mt-3 rounded-full"
            >
              <Link href={`/studio`}>Go to studio</Link>
            </Button>
          ) : (
            <SubscriptionButton
              disabled={isPending || !isLoaded}
              isSubscribed={data.viewerSubscribed}
              onClick={onClick}
              className="mt-3"
            />
          )}
        </div>
      </div>
    </div>
  );
};
