"use client";;
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from "@/modules/videos/ui/components/video-row-card";
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "@/modules/videos/ui/components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";

interface Props {
  query?: string;
  categoryId?: string;
}

export const ResultsSection = (props: Props) => {
  return (
    <Suspense
      key={`${props.query}-${props.categoryId}`}
      fallback={<ResultsSectionSkeleton />}
    >
      <ErrorBoundary fallback={<p>Error...</p>}>
        <ResultsSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

const ResultsSectionSkeleton = () => {
  return (
    <div>
      {/* Desktop */}
      <div className="hidden flex-col gap-4 md:flex">
        {Array.from({ length: 5 }).map((_, idx) => (
          <VideoRowCardSkeleton key={idx} />
        ))}
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-4 p-4 gap-y-10 md:hidden pt-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <VideoGridCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};

const ResultsSectionSuspense = (props: Props) => {
  const trpc = useTRPC();

  const {
    data: results,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSuspenseInfiniteQuery(
    trpc.search.getMany.infiniteQueryOptions(
      {
        ...props,
        limit: DEFAULT_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {results.pages
          .flatMap((page) => page.items)
          .map((result) => (
            <VideoGridCard data={result} key={result.id} />
          ))}
      </div>

      <div className="hidden md:flex flex-col gap-4">
        {results.pages
          .flatMap((page) => page.items)
          .map((result) => (
            <VideoRowCard data={result} key={result.id} />
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
