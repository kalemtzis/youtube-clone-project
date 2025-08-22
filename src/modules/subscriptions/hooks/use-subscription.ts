"use client";

import { useTRPC } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  userId: string;
  isSubscribed: boolean;
  fromVideoId?: string;
}

export const useSubscription = ({
  isSubscribed,
  userId,
  fromVideoId,
}: Props) => {
  const clerk = useClerk();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const subscribe = useMutation(
    trpc.subscriptions.create.mutationOptions({
      onSuccess: () => {
        toast.success("Subscribed");

        // TODO: reinvalidate subscriptions.getMany and users.getOne

        if (fromVideoId) {
          queryClient.invalidateQueries(
            trpc.videos.getOne.queryOptions({ videoId: fromVideoId })
          );
        }
      },
      onError: (error) => {
        toast.error("Somethign went wrong");

        if (error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
      },
    })
  );
  const unsubscribe = useMutation(
    trpc.subscriptions.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Unsubscribed");

        // TODO: reinvalidate subscriptions.getMany and users.getOne
        queryClient.invalidateQueries(
          trpc.videos.getSubscribed.infiniteQueryFilter()
        );

        if (fromVideoId) {
          queryClient.invalidateQueries(
            trpc.videos.getOne.queryOptions({ videoId: fromVideoId })
          );
        }
      },
      onError: (error) => {
        toast.error("Something went wrong");

        if (error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
      },
    })
  );

  const isPending = subscribe.isPending || unsubscribe.isPending;

  const onClick = () => {
    if (isSubscribed) unsubscribe.mutate({ userId });
    else subscribe.mutate({ userId });
  };

  return {
    isPending,
    onClick,
  };
};
