"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useTRPC } from "@/trpc/client";
import { useClerk, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface Props {
  videoId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  varient?: "comment" | "reply";
}

const formSchema = z.object({
  videoId: z.uuid(),
  parentId: z.uuid().nullish(),
  value: z.string(),
});

export const CommentForm = ({
  videoId,
  onSuccess,
  onCancel,
  parentId,
  varient = "comment",
}: Props) => {
  const { user } = useUser();
  const clerk = useClerk();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoId,
      parentId,
      value: "",
    },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createComment = useMutation(
    trpc.comments.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.comments.getMany.infiniteQueryFilter({ videoId })
        );
        queryClient.invalidateQueries(
          trpc.comments.getMany.infiniteQueryFilter({ videoId, parentId })
        );
        form.reset();
        toast.success("Comment added!");
        onSuccess?.();
      },
      onError: (error) => {
        if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        toast.error(error.message);
      },
    })
  );

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    createComment.mutate(values);
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex gap-4 group"
      >
        <UserAvatar
          imageUrl={user?.imageUrl || "/images/user-placeholder.svg"}
          name={user?.username || "User"}
        />

        <div className="flex-1">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      varient === "reply"
                        ? "Reply to this comment..."
                        : "Add a comment..."
                    }
                    className="resize-none bg-transparent overflow-hidden min-h-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="justify-end gap-2 flex mt-2">
            {onCancel && (
              <Button variant="ghost" type="button" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="cursor-pointer"
              disabled={createComment.isPending}
            >
              {createComment.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <>{varient === "reply" ? "Reply" : "Add comment"}</>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
