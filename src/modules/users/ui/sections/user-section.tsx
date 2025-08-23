"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserPageBanner } from "../components/user-page-banner";
import { UserPageInfo } from "../components/user-page-info";

interface Props {
  userId: string;
}

export const UserSection = (props: Props) => {
  return (
    <Suspense fallback={<UserSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <UserSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  )
}

const UserSectionSkeleton = () => {
  return (
    <div>Loading...</div>
  )
}

const UserSectionSuspense = ({userId}: Props) => {
  const trpc = useTRPC();

  const { data: user } = useSuspenseQuery(trpc.users.getOne.queryOptions({ userId }));
  return (
    <div className="flex flex-col">
      <UserPageBanner data={user} />
      <UserPageInfo data={user} />
    </div>
  )
}