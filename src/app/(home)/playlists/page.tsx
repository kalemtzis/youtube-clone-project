import { DEFAULT_LIMIT } from "@/constants";
import { PlaylistsView } from "@/modules/playlists/ui/views/playlists-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

const Page = () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.playlists.getMany.infiniteQueryOptions({ limit: DEFAULT_LIMIT })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlaylistsView />
    </HydrationBoundary>
  );
};

export default Page;
