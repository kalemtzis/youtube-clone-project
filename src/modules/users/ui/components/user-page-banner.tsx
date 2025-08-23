"use client";

import { cn } from "@/lib/utils";
import { UsersGetOneOutput } from "../../types";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Edit2Icon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  data: UsersGetOneOutput;
}

export const UserPageBannerSkeleton = () => {
  return <Skeleton className="w-full max-h-[200px] h-[15vh] md:h-[25vh]" />;
};

export const UserPageBanner = ({ data }: Props) => {
  const { userId } = useAuth();

  return (
    <div className="relative group">
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
          // TODO: on click open modal to change/upload a new banner.
          <Button
            type="button"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            onClick={() => {}}
          >
            <Edit2Icon className="size-4 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
};
