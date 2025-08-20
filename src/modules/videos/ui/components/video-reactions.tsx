"use client"

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { VideosGetOneOutput } from "../../types";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

interface Props {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideosGetOneOutput["viewerReaction"];
}

export const VideoReactions = ({
  dislikes,
  likes,
  videoId,
  viewerReaction,
}: Props) => {
  const clerk = useClerk();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const like = useMutation(trpc.videoReactions.like.mutationOptions({
    onError: (error) => {
      toast.error("Something went wrong");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.videos.getOne.queryOptions({ videoId }));
      // TODO: Invalidate "liked" playlist
    }
  }));

  const dislike = useMutation(
    trpc.videoReactions.dislike.mutationOptions({
      onError: (error) => {
        toast.error("Something went wrong");

        if (error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.videos.getOne.queryOptions({ videoId })
        );
        // TODO: Invalidate "liked" playlist
      },
    })
  );

  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-l-full rounded-r-none gap-2 pr-4"
        variant="secondary"
        onClick={() => like.mutate({ videoId })}
        disabled={like.isPending || dislike.isPending}
      >
        <ThumbsUpIcon
          className={cn("size-5", viewerReaction === "like" && "fill-black")}
        />
        {likes}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        className="rounded-l-none rounded-r-full pl-3"
        variant="secondary"
        onClick={() => dislike.mutate({ videoId })}
        disabled={dislike.isPending || like.isPending}
      >
        <ThumbsDownIcon
          className={cn("size-5", viewerReaction === "dislike" && "fill-black")}
        />
        {dislikes}
      </Button>
    </div>
  );
};
