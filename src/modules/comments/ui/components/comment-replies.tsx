"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CommentItem } from "./comment-item";
import { CornerDownRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  parentId: string;
  videoId: string;
}

export const CommentReplies = ({ parentId, videoId }: Props) => {
  const trpc = useTRPC();

  const {
    data: replies,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    trpc.comments.getMany.infiniteQueryOptions(
      { videoId, parentId: parentId, limit: DEFAULT_LIMIT },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  return (
    <div className="pl-14">
      <div className="flex flex-col gap-4 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2Icon className="animate-spin size-6 text-muted-foreground" />
          </div>
        )}
        {!isLoading && replies?.pages.flatMap(page => page.items).map(reply => (
          <CommentItem comment={reply} key={reply.id} variant="reply" />
        ))}
      </div>
      {hasNextPage && (
        <Button variant="tertiary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          <CornerDownRightIcon />
          Show more replies
        </Button>
      )}
    </div>
  );
};
