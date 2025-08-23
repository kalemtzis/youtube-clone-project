import { UsersView } from "@/modules/users/ui/views/users-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

interface Props {
  params: Promise<{ userId: string }>;
}

const Page = async ({ params }: Props) => {
  const { userId } = await params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.users.getOne.queryOptions({ userId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersView userId={userId} />
    </HydrationBoundary>
  );
};

export default Page;
