"use client";

import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const HistoryVideosSection = () => {
  return (
    <Suspense fallback={<HistoryVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <HistoryVideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const HistoryVideosSectionSkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {Array.from({ length: 8 }).map((_, idx) => (
          <VideoGridCardSkeleton key={idx} />
        ))}
      </div>
      <div className="hidden md:flex flex-col gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <VideoRowCardSkeleton key={idx} size="compact" />
        ))}
      </div>
    </>
  );
};

const HistoryVideosSectionSuspense = () => {
  const trpc = useTRPC();

  const {
    data: history,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useSuspenseInfiniteQuery(
    trpc.playlists.getHistory.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {history.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoGridCard data={video} key={video.id} />
          ))}
      </div>
      <div className="hidden md:flex flex-col gap-4">
        {history.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoRowCard data={video} key={video.id} size="compact" />
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
