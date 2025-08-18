"use client";

import { SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const CategorySelect = () => {
  return (
    <Suspense fallback={<CategorySelectSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <CategorySelectSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const CategorySelectSkeleton = () => {
  return (
    <SelectContent>
      {Array.from({ length: 5 }).map((_, idx) => (
        <SelectItem key={idx} value={""} disabled={true}>
          <Skeleton />
        </SelectItem>
      ))}
    </SelectContent>
  );
};

const CategorySelectSuspense = () => {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(
    trpc.categories.getMany.queryOptions()
  );

  return (
    <SelectContent>
      {categories.map((category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>
      ))}
    </SelectContent>
  );
};
