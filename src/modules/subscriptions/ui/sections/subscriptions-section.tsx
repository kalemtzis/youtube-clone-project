"use client";;
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { SubscriptionItem, SubscriptionItemSkeleton } from "../components/subscription-item";

export const SubscriptionsSection = () => {
  return (
    <Suspense fallback={<SubscriptionsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <SubscriptionsSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const SubscriptionsSectionSkeleton = () => {
  return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <SubscriptionItemSkeleton key={idx} />
        ))}
      </div>
  );
};

const SubscriptionsSectionSuspense = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    data: subscriptions,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useSuspenseInfiniteQuery(
    trpc.subscriptions.getMany.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  const unsubscribe = useMutation(
    trpc.subscriptions.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success("Unsubscribed");

        queryClient.invalidateQueries(
          trpc.subscriptions.getMany.infiniteQueryFilter()
        );

        queryClient.invalidateQueries(
          trpc.users.getOne.queryOptions({ userId: data.creatorId })
        );

        queryClient.invalidateQueries(
          trpc.videos.getSubscribed.infiniteQueryFilter()
        );
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        {subscriptions.pages
          .flatMap((page) => page.items)
          .map((subscription) => (
            <Link prefetch
              key={subscription.creatorId}
              href={`/users/${subscription.user.id}`}
            >
              <SubscriptionItem
                {...subscription.user}
                disabled={unsubscribe.isPending}
                onUnsubscribe={() =>
                  unsubscribe.mutate({ userId: subscription.user.id })
                }
              />
            </Link>
          ))}
      </div>

      <InfiniteScroll
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  );
};
