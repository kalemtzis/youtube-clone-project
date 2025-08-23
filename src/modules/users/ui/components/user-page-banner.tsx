"use client";

import { cn } from "@/lib/utils";
import { UsersGetOneOutput } from "../../types";
import { useAuth } from "@clerk/nextjs";
import { Edit2Icon, RefreshCcwDotIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { BannerAddModal } from "./banner-add-modal";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BunnerButton } from "./bunner-button";

interface Props {
  data: UsersGetOneOutput;
}

export const UserPageBannerSkeleton = () => {
  return <Skeleton className="w-full max-h-[200px] h-[15vh] md:h-[25vh]" />;
};

export const UserPageBanner = ({ data }: Props) => {
  const { userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const restoreBanner = useMutation(
    trpc.users.resetBanner.mutationOptions({
      onError: () => {
        toast.error("Something went wrong");
      },
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.users.getOne.queryOptions({ userId: data.id })
        );
        toast.success("Banner restored");
      },
    })
  );

  return (
    <div className="relative group">
      <BannerAddModal open={isOpen} onOpenChange={setIsOpen} userId={data.id} />

      <div
        className={cn(
          "w-full max-h-[200px] h-[15vh] md:h-[25vh] bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl",
          data.bannerUrl ? "bg-cover bg-center" : "bg-gray-100"
        )}
        style={{
          backgroundImage: data.bannerUrl
            ? `url(${data.bannerUrl})`
            : undefined,
        }}
      >
        {data.clerkId === userId && (
          <BunnerButton
            content="Edit banner"
            className="absolute top-4 right-4"
            onClick={() => setIsOpen(true)}
          >
            <Edit2Icon className="size-4 text-white" />
          </BunnerButton>
        )}
        {data.bannerKey && (
          <BunnerButton
            disabled={restoreBanner.isPending}
            className="absolute top-4 right-16"
            onClick={() => restoreBanner.mutate({ userId: data.id })}
            content="Restore banner"
          >
            <RefreshCcwDotIcon className="size-4 text-white" />
          </BunnerButton>
        )}
      </div>
    </div>
  );
};
