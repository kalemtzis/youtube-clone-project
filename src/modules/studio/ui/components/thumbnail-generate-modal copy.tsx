"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface Props {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  prompt: z.string().min(10),
});

export const ThumbnailGenerateModal = ({
  onOpenChange,
  open,
  videoId,
}: Props) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const generateThumbnail = useMutation(
    trpc.ai.generateThumbnail.mutationOptions({
      onMutate: () => {
        toast.message("Genaration started", {
          description: "This may take some time",
        });
      },
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
        queryClient.invalidateQueries(trpc.studio.getMany.queryFilter());
        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ videoId })
        );
        toast.success("Thumbnail created!");
      },
      onError: () => {
        form.reset();
        onOpenChange(false);
        toast.error("Something went wrong");
      },
    })
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateThumbnail.mutate({ videoId, prompt: values.prompt });
  };

  return (
    <ResponsiveModal
      title="upload a thumbnail"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="A description of wanted thumbnail"
                    className="resize-none"
                    cols={30}
                    rows={5}
                    disabled={generateThumbnail.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={generateThumbnail.isPending} className="cursor-pointer">
              {generateThumbnail.isPending ? <Loader2Icon className="animate-spin" /> : "Generate"}
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
};
