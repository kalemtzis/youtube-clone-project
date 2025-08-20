import { VideoView } from "@/modules/videos/ui/views/video-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface Props {
  params: Promise<{ videoId: string }>;
}

const Page = async ({ params }: Props) => {
  const { videoId } = await params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.videos.getOne.queryOptions({ videoId }));
  // TODO: make it prefetchInfiniteQuery
  void queryClient.prefetchQuery(
    trpc.comments.getMany.queryOptions({ videoId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoView videoId={videoId} />
    </HydrationBoundary>
  );
};

export default Page;
