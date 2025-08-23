import { DEFAULT_LIMIT } from "@/constants";
import { PlaylistVideosView } from "@/modules/playlists/ui/views/playlist-videos-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ playlistId: string }>;
}

const Page = async ({ params }: Props) => {
  const { playlistId } = await params;

  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.playlists.getVideos.infiniteQueryOptions({
      playlistId,
      limit: DEFAULT_LIMIT,
    })
  );

  void queryClient.prefetchQuery(
    trpc.playlists.getOne.queryOptions({ playlistId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlaylistVideosView playlistId={playlistId} />
    </HydrationBoundary>
  );
};

export default Page;
