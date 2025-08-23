"use client";

import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from "@/modules/videos/ui/components/video-grid-card";
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from "@/modules/videos/ui/components/video-row-card";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

interface Props {
  playlistId: string;
}

export const PlaylistVideosSection = ({ playlistId }: Props) => {
  return (
    <Suspense fallback={<PlaylistVideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <PlaylistVideosSectionSuspense playlistId={playlistId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const PlaylistVideosSectionSkeleton = () => {
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

const PlaylistVideosSectionSuspense = ({ playlistId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    data: playlistVideos,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useSuspenseInfiniteQuery(
    trpc.playlists.getVideos.infiniteQueryOptions(
      { playlistId, limit: DEFAULT_LIMIT },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  const removeVideo = useMutation(
    trpc.playlists.removeVideo.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.playlists.getVideos.infiniteQueryFilter({ playlistId })
        );
        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryFilter()
        );
        queryClient.invalidateQueries(
          trpc.playlists.getOne.queryOptions({ playlistId })
        );
        queryClient.invalidateQueries(
          trpc.playlists.getManyForVideo.infiniteQueryFilter({
            videoId: data.videoId,
          })
        );
        toast.success("Video removed from the playlist");
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  if (playlistVideos.pages[0].items.length === 0) {
    return (
      <div className="flex items-center">
        <p className="text-muted-foreground">No videos</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 gap-y-10 md:hidden">
        {playlistVideos.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoGridCard
              data={video}
              key={video.id}
              onRemove={() =>
                removeVideo.mutate({ playlistId, videoId: video.id })
              }
            />
          ))}
      </div>
      <div className="hidden md:flex flex-col gap-4">
        {playlistVideos.pages
          .flatMap((page) => page.items)
          .map((video) => (
            <VideoRowCard
              data={video}
              key={video.id}
              size="compact"
              onRemove={() =>
                removeVideo.mutate({ playlistId, videoId: video.id })
              }
            />
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
