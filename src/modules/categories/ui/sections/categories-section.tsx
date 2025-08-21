"use client";

import { FilterCarousel } from "@/components/filter-carousel";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  categoryId?: string;
}

export const CategoriesSections = (props: Props) => {
  return (
    <Suspense fallback={<CategoriesSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

const CategoriesSectionSkeleton = () => {
  return <FilterCarousel data={[]} isLoading onSelect={() => {}} />;
};

const CategoriesSectionSuspense = ({ categoryId }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();

  const { data: categories } = useSuspenseQuery(
    trpc.categories.getMany.queryOptions()
  );

  const data = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const onSelect = (value: string | null) => {
    const url = new URL(window.location.href);

    if (value) {
      url.searchParams.set("categoryId", value);
    } else {
      url.searchParams.delete("categoryId");
    }

    router.push(url.toString());
  };

  return <FilterCarousel data={data} value={categoryId} onSelect={onSelect} />;
};
