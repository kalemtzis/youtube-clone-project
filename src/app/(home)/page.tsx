import { HomeView } from "@/modules/home/ui/views/home-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    categoryId?: string;
  }>;
}

const Home = async ({ searchParams }: Props) => {
  const { categoryId } = await searchParams;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.categories.getMany.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <HomeView categoryId={categoryId} />
    </HydrationBoundary>
  );
};

export default Home;
