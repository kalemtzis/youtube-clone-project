import { DEFAULT_LIMIT } from "@/constants";
import { SubscriptionsView } from "@/modules/subscriptions/ui/views/subscriptions-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

const Page = () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchInfiniteQuery(
    trpc.subscriptions.getMany.infiniteQueryOptions({ limit: DEFAULT_LIMIT })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SubscriptionsView />
    </HydrationBoundary>
  );
};

export default Page;
