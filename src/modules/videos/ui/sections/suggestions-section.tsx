"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from "../components/video-row-card";
import { VideoGridCard } from "../components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  videoId: string;
  isManual?: boolean;
}

export const SuggestionsSection = (props: Props) => {
  return (
    <Suspense fallback={<SuggestionsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <SuggestionsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

const SuggestionsSectionSkeleton = () => {
  return (
    <>
      <div className="hidden md:block space-y-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <VideoRowCardSkeleton key={idx} size="compact" />
        ))}
      </div>

      <div className="block md:hidden space-y-10">
        {Array.from({length: 8}).map((_, idx) => (
          <VideoRowCardSkeleton key={idx} />
        ))}
      </div>
    </>
  );
};

const SuggestionsSectionSuspense = ({ videoId, isManual }: Props) => {
  const trpc = useTRPC();

  const {
    data: suggestions,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery(
    trpc.suggestions.getMany.infiniteQueryOptions(
      { videoId, limit: DEFAULT_LIMIT },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  return (
    <>
      <div className="hidden md:block space-y-3">
        {suggestions.pages
          .flatMap((page) => page.items)
          .map((sugg) => (
            <VideoRowCard data={sugg} key={sugg.id} size="compact" />
          ))}
      </div>

      <div className="block md:hidden space-y-10">
        {suggestions.pages
          .flatMap((page) => page.items)
          .map((sugg) => (
            <VideoGridCard data={sugg} key={sugg.id} />
          ))}
      </div>
      <InfiniteScroll
        isManual={isManual}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  );
};
