"use client";
import Link from "next/link";
import { CommentsGetManyOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
} from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";

interface Props {
  comment: CommentsGetManyOutput["items"][number];
  variant?: "reply" | "comment";
}

export const CommentItem = ({ comment, variant = "comment" }: Props) => {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);

  const { userId } = useAuth();
  const clerk = useClerk();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const remove = useMutation(
    trpc.comments.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Comment deleted!");
        queryClient.invalidateQueries(
          trpc.comments.getMany.infiniteQueryFilter({
            videoId: comment.videoId,
          })
        );
      },
      onError: (error) => {
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        toast.error("Something went wrong");
      },
    })
  );

  const like = useMutation(
    trpc.commentReactions.like.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.comments.getMany.infiniteQueryFilter({
            videoId: comment.videoId,
          })
        );
      },
      onError: (error) => {
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        toast.error("Something went wrong");
      },
    })
  );

  const dislike = useMutation(
    trpc.commentReactions.dislike.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.comments.getMany.infiniteQueryFilter({
            videoId: comment.videoId,
          })
        );
      },
      onError: (error) => {
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        toast.error("Something went wrong");
      },
    })
  );

  return (
    <div>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
            size={variant === "reply" ? "sm" : "default"}
            imageUrl={comment.user.imageUrl}
            name={comment.user.name}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
            </div>
          </Link>

          <p className="text-sm">{comment.value}</p>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <Button
                className="size-8"
                size="icon"
                variant="ghost"
                onClick={() => like.mutate({ commentId: comment.id })}
                disabled={like.isPending}
              >
                <ThumbsUpIcon
                  className={cn(
                    comment.viewerReaction === "like" && "fill-black"
                  )}
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {comment.likeCount}
              </span>

              <Button
                className="size-8"
                size="icon"
                variant="ghost"
                onClick={() => dislike.mutate({ commentId: comment.id })}
                disabled={dislike.isPending}
              >
                <ThumbsDownIcon
                  className={cn(
                    comment.viewerReaction === "dislike" && "fill-black"
                  )}
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {comment.dislikeCount}
              </span>
            </div>

            {variant === "comment" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setIsReplyOpen(true)}
              >
                Reply
              </Button>
            )}
          </div>
        </div>
        {/* TODO: hide it propetrly */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsReplyOpen(true)}>
              <MessageSquareIcon className="size-4" />
              Replay
            </DropdownMenuItem>

            {comment.user.clerkId === userId && (
              <DropdownMenuItem
                onClick={() => remove.mutate({ id: comment.id })}
              >
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isReplyOpen && variant === "comment" && (
        <div className="mt-4 pl-14">
          <CommentForm
            varient="reply"
            parentId={comment.id}
            videoId={comment.videoId}
            onCancel={() => setIsReplyOpen(false)}
            onSuccess={() => {
              setIsReplyOpen(false);
              setIsRepliesOpen(true);
            }}
          />
        </div>
      )}

      {comment.replyCount > 0 && variant === "comment" && (
        <div className="pl-14">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setIsRepliesOpen((prev) => !prev)}
          >
            {isRepliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {comment.replyCount} replies
          </Button>
        </div>
      )}

      {comment.replyCount > 0 && variant === "comment" && isRepliesOpen && (
        <CommentReplies parentId={comment.id} videoId={comment.videoId} />
      )}
    </div>
  );
};
