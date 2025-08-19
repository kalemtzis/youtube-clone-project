"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { UploadDropzone } from "@/lib/uploadthing";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThumbnailUploadModal = ({
  onOpenChange,
  open,
  videoId,
}: Props) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const onUploadComplete = () => {
    onOpenChange(false);
    queryClient.invalidateQueries(trpc.studio.getMany.queryFilter());
    queryClient.invalidateQueries(
      trpc.studio.getOne.queryOptions({ videoId: videoId })
    );
    toast.success("Thumbnail uploaded!");
  };

  return (
    <ResponsiveModal
      title="upload a thumbnail"
      open={open}
      onOpenChange={onOpenChange}
    >
      <UploadDropzone
        endpoint="thumbnailUploader"
        input={{ videoId }}
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  );
};
