import { DEFAULT_LIMIT } from "@/constants";
import { LikedVideosView } from "@/modules/playlists/ui/views/liked-videos-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

const Page = () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.playlists.getLikedVideos.infiniteQueryOptions({ limit: DEFAULT_LIMIT })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LikedVideosView />
    </HydrationBoundary>
  );
};

export default Page;
