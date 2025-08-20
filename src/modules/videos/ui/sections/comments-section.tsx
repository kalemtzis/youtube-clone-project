"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { CommentItem } from "@/modules/comments/ui/components/comment-item";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  videoId: string;
}

export const CommentsSection = ({ videoId }: Props) => {
  return (
    <Suspense fallback={<CommentsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <CommentsSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const CommentsSectionSkeleton = () => {
  return (
    <div>
      <Skeleton />
    </div>
  );
};

const CommentsSectionSuspense = ({ videoId }: Props) => {
  const trpc = useTRPC();
  const { data: comments } = useSuspenseQuery(
    trpc.comments.getMany.queryOptions({ videoId })
  );
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-6">
        <h1>{0} comments</h1>
        <CommentForm videoId={videoId} />
        <div className="flex flex-col gap-4 mt-2">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
};
