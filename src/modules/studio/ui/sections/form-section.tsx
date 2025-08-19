"use client";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CopyCheckIcon,
  CopyIcon,
  Globe2Icon,
  ImagePlusIcon,
  LoaderCircleIcon,
  LockIcon,
  MoreVerticalIcon,
  RotateCcwIcon,
  SparkleIcon,
  SparklesIcon,
  Trash,
} from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { videoUpdateSchema } from "@/db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "../../../categories/ui/components/category-select";
import { toast } from "sonner";
import { VideoPlayer } from "@/modules/videos/ui/components/video-player";
import Link from "next/link";
import { cn, snakeCaseToTitle } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { THUMBNAIL_FALLBACK } from "@/constants";
import { ThumbnailUploadModal } from "../components/thumbnail-upload-modal";
import { ThumbnailGenerateModal } from "../components/thumbnail-generate-modal copy";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  videoId: string;
}

export const FormSection = ({ videoId }: Props) => {
  return (
    <Suspense fallback={<FromSectionSekelton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const FromSectionSekelton = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="gird grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="space-y-8 lg:col-span-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-[220px] w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-[84px] w-[153px]" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-y-8 lg:col-span-2">
        <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden">
          <Skeleton className="aspect-video" />
          <div className="px-4 py-4 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
};

const FormSectionSuspense = ({ videoId }: Props) => {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [thumbnailGenerateModalOpen, setThumbnailGenerateModalOpen] =
    useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: video } = useSuspenseQuery(
    trpc.studio.getOne.queryOptions({ videoId })
  );

  const update = useMutation(
    trpc.videos.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.studio.getMany.queryFilter());
        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ videoId })
        );
        toast.success("Video updated!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const remove = useMutation(
    trpc.videos.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.studio.getMany.queryFilter());
        toast.success("Video deleted!");
        router.push("/studio");
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  const generateTitle = useMutation(
    trpc.ai.generateTitle.mutationOptions({
      onMutate: () => {
        toast.message("Genaration started", {
          description: "This may take some time",
        });
      },
      onSuccess: (updatedVideo) => {
        queryClient.invalidateQueries(trpc.studio.getMany.queryFilter());
        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ videoId })
        );
        form.reset(updatedVideo);
        toast.success("Title created!");
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  const generateDescription = useMutation(
    trpc.ai.generateDescription.mutationOptions({
      onMutate: () => {
        toast.message("Genaration started", {
          description: "This may take some time",
        });
      },
      onSuccess: (updatedVideo) => {
        toast.success("Description created!");
        queryClient.invalidateQueries(trpc.studio.getMany.queryFilter());
        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ videoId })
        );
        form.reset(updatedVideo);
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  const restoreThumbnail = useMutation(
    trpc.videos.restoreThumbnail.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.studio.getMany.queryFilter());
        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ videoId })
        );
        toast.success("Thumbnail restored successfully!");
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    })
  );

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    resolver: zodResolver(videoUpdateSchema),
    defaultValues: video,
  });

  const onSubmit = (values: z.infer<typeof videoUpdateSchema>) => {
    update.mutate(values);
  };

  const fullUrl = `${
    process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL
  }/videos/${videoId} `;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);
    toast.message("URL copy to clipboard");

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <>
      <ThumbnailUploadModal
        open={thumbnailModalOpen}
        onOpenChange={setThumbnailModalOpen}
        videoId={videoId}
      />
      <ThumbnailGenerateModal
        open={thumbnailGenerateModalOpen}
        onOpenChange={setThumbnailGenerateModalOpen}
        videoId={videoId}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Video Details</h1>
              <p className="text-muted-foreground text-xs">
                Manage your video details
              </p>
            </div>

            <div className="flex items-center gap-x-2">
              <Button
                type="submit"
                disabled={update.isPending}
                className="cursor-pointer"
              >
                Save
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => remove.mutate({ videoId })}
                  >
                    <Trash className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="space-y-8 lg:col-span-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className={cn(
                        "flex items-center cursor-pointer transition-opacity",
                        (generateTitle.isPending || !video.muxTrackId) &&
                          "opacity-70 pointer-events-none cursor-not-allowed"
                      )}
                      onClick={() => generateTitle.mutate({ videoId })}
                    >
                      Title
                      <Button
                        variant="outline"
                        type="button"
                        className="rounded-full cursor-pointer"
                        disabled={generateTitle.isPending || !video.muxTrackId}
                      >
                        {generateTitle.isPending ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : (
                          <SparklesIcon />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {generateTitle.isPending
                            ? "Generating..."
                            : "Generate"}
                        </span>
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Add a title to your video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className={cn(
                        "flex items-center cursor-pointer transition-opacity",
                        (generateDescription.isPending || !video.muxTrackId) &&
                          "opacity-70 pointer-events-none cursor-not-allowed"
                      )}
                      onClick={() => generateDescription.mutate({ videoId })}
                    >
                      Description
                      <Button
                        variant="outline"
                        type="button"
                        className="rounded-full cursor-pointer"
                        disabled={
                          generateDescription.isPending || !video.muxTrackId
                        }
                      >
                        {generateDescription.isPending ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : (
                          <SparklesIcon />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {generateDescription.isPending
                            ? "Generating..."
                            : "Generate"}
                        </span>
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={10}
                        className="resize-none pr-10"
                        placeholder="Add a description to your video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                        <Image
                          alt="thumbnail"
                          src={video.thumbnailUrl || THUMBNAIL_FALLBACK}
                          fill
                          className="object-cover"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 cursor-pointer rounded-full opcacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                            >
                              <MoreVerticalIcon className="text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => setThumbnailModalOpen(true)}
                            >
                              <ImagePlusIcon className="size-4 mr-1" />
                              Change
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                setThumbnailGenerateModalOpen(true)
                              }
                            >
                              <SparkleIcon className="size-4 mr-1" />
                              AI-Generated
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                restoreThumbnail.mutate({ videoId })
                              }
                              disabled={restoreThumbnail.isPending}
                            >
                              <RotateCcwIcon className="size-4 mr-1" />
                              Restore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>

                      <CategorySelect />
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-y-8 lg:col-span-2">
              <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden h-fit">
                <div className="aspect-video overflow-hidden relative">
                  <VideoPlayer
                    playbackId={video.muxPlaybackId}
                    thumbnailUrl={video.thumbnailUrl}
                  />
                </div>

                <div className="p-4 flex flex-col gap-y-6">
                  <div className="flex justify-between items-center gap-x-2">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">
                        Video Link
                      </p>
                      <div className="flex items-center gap-x-2">
                        <Link href={`/videos/${videoId}`}>
                          <p className="line-clamp-1 text-sm text-blue-500">
                            {fullUrl}
                          </p>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 cursor-pointer"
                          onClick={handleCopyUrl}
                          disabled={isCopied}
                        >
                          {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-xs text-muted-foreground">
                        Video Status
                      </p>
                      <p className="text-sm">
                        {snakeCaseToTitle(video.muxStatus || "preparing")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-xs text-muted-foreground">
                        Subtitles Status
                      </p>
                      <p className="text-sm">
                        {snakeCaseToTitle(
                          video.muxTrackStatus || "no_subtitles"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Visibility" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="private">
                          <LockIcon className="size-4 mr-2" />
                          Private
                        </SelectItem>
                        <SelectItem value="public">
                          <Globe2Icon className="size-4 mr-2" />
                          Public
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
