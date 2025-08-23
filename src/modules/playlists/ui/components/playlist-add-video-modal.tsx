"use client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2Icon, SquareCheckIcon, SquareIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistAddModal = ({ onOpenChange, open, videoId }: Props) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const {
    data: playlists,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    trpc.playlists.getManyForVideo.infiniteQueryOptions(
      { videoId, limit: DEFAULT_LIMIT },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!videoId && open,
      }
    )
  );

  const addVideo = useMutation(
    trpc.playlists.addVideo.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryFilter()
        );
        queryClient.invalidateQueries(
          trpc.playlists.getManyForVideo.infiniteQueryFilter({ videoId })
        );
        queryClient.invalidateQueries(
          trpc.playlists.getOne.queryOptions({ playlistId: data.playlistId })
        );
        queryClient.invalidateQueries(
          trpc.playlists.getVideos.infiniteQueryFilter({
            playlistId: data.playlistId,
          })
        );
        toast.success("Video added to the playlist");
      },
      onError: () => {
        toast.error("Something went wrong. Try again!");
      },
    })
  );

  const removeVideo = useMutation(
    trpc.playlists.removeVideo.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryFilter()
        );
        queryClient.invalidateQueries(
          trpc.playlists.getManyForVideo.infiniteQueryFilter({ videoId })
        );
        queryClient.invalidateQueries(
          trpc.playlists.getOne.queryOptions({ playlistId: data.playlistId })
        );
        queryClient.invalidateQueries(
          trpc.playlists.getVideos.infiniteQueryFilter({
            playlistId: data.playlistId,
          })
        );
        toast.success("Video removed from the playlist");
      },
      onError: () => {
        toast.error("Something went wrong. Try again!");
      },
    })
  );

  const handleClick = (playlistId: string, isInPlaylist: boolean) => {
    if (isInPlaylist) {
      removeVideo.mutate({ playlistId, videoId });
    } else {
      addVideo.mutate({ playlistId, videoId });
    }
  };

  return (
    <ResponsiveModal
      title="Add to playlist"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading &&
          playlists?.pages
            .flatMap((page) => page.items)
            .map((playlist) => (
              <Button
                key={playlist.id}
                variant="ghost"
                className="w-full justify-start px-2 [&_svg]:size-5"
                size="lg"
                disabled={addVideo.isPending || removeVideo.isPending}
                onClick={() => handleClick(playlist.id, playlist.containsVideo)}
              >
                {playlist.containsVideo ? (
                  <SquareCheckIcon className="mr-2" />
                ) : (
                  <SquareIcon className="mr-2" />
                )}
                {playlist.name}
              </Button>
            ))}
        {!isLoading && (
          <InfiniteScroll
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isManual
          />
        )}
      </div>
    </ResponsiveModal>
  );
};
