"use client"

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LoaderIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

interface Props {
  playlistId: string;
}

export const PlaylistHeaderSection = ({playlistId}: Props) => {
  return (
    <Suspense fallback={<PlaylistHeaderSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <PlaylistHeaderSectionSuspense playlistId={playlistId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const PlaylistHeaderSectionSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-6 w-24"/>
      <Skeleton className="h-6 w-32"/>
    </div>
  );
}

const PlaylistHeaderSectionSuspense = ({ playlistId }: Props) => {
  const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: playlist } = useSuspenseQuery(trpc.playlists.getOne.queryOptions({ playlistId }));
  
    const remove = useMutation(
      trpc.playlists.remove.mutationOptions({
        onSuccess: () => {
          queryClient.invalidateQueries(
            trpc.playlists.getMany.infiniteQueryFilter()
          );
          queryClient.invalidateQueries(
            trpc.playlists.getVideos.infiniteQueryFilter({ playlistId })
          );
          toast.success("Playlist removed!");
          router.push("/playlists");
        },
        onError: () => {
          toast.error("Unable to delete the playlist. Try again");
        },
      })
    );

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Playlist: {playlist.name}</h1>
        <p className="text-xs text-muted-foreground">
          Videos from the playlist
        </p>
      </div>

     
        <Button
          variant="outline"
          size="icon"
          onClick={() => remove.mutate({ playlistId })}
          disabled={remove.isPending}
          className="cursor-pointer rounded-full"
        >
          {remove.isPending ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <Trash2Icon className="size-4" />
          )}
        </Button>
      
    </div>
  );
};

