"use client";

import Link from "next/link";
import { CommentsGetManyOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DEFAULT_LIMIT } from "@/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MessageSquareIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";

interface Props {
  comment: CommentsGetManyOutput["items"][number];
}

export const CommentItem = ({ comment }: Props) => {
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

  return (
    <div>
      <div className="flex gap-4">
        <Link href={`/users/${comment.userId}`}>
          <UserAvatar
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

          {/* TODO: Reactions */}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {}}>
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
    </div>
  );
};
