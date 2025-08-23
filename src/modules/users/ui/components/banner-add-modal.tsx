"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { UploadDropzone } from "@/lib/uploadthing";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BannerAddModal = ({ onOpenChange, open, userId }: Props) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const onUploadComplete = () => {
    onOpenChange(false);
    queryClient.invalidateQueries(trpc.users.getOne.queryOptions({ userId }));
    toast.success("Banner uploaded!");
  };

  return (
    <ResponsiveModal
      title="Upload a banner"
      open={open}
      onOpenChange={onOpenChange}
    >
      <UploadDropzone
        endpoint="bannerUploader"
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  );
};
