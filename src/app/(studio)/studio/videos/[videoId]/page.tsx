import { VideoView } from "@/modules/studio/ui/views/video-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ videoId: string }>;
}

const Page = async ({ params }: Props) => {
  const { videoId } = await params;

  const queryClient = getQueryClient();
  
  void queryClient.prefetchQuery(trpc.studio.getOne.queryOptions({ videoId }));
  void queryClient.prefetchQuery(trpc.categories.getMany.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideoView videoId={videoId} />
    </HydrationBoundary>
  );
};

export default Page;
