"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlaylistAddModal } from "@/modules/playlists/ui/components/playlist-add-video-modal";
import {
  ListPlusIcon,
  MoreVerticalIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  videoId: string;
  variant?: "ghost" | "secondary";
  onRemove?: () => void;
}

export const VideoMenu = ({ videoId, onRemove, variant = "ghost" }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const onShare = () => {
    //const fullUrl = `${process.env.VERCEL_URL || "http://localhost:3000"}/videos/${videoId}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL}/videos/${videoId}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to the clipboard!");
  };

  return (
    <>
      <PlaylistAddModal
        videoId={videoId}
        open={isOpen}
        onOpenChange={setIsOpen}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className="rounded-full">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onShare}>
            <ShareIcon className="mr-2 size-4" />
            Share
          </DropdownMenuItem>
          {!pathname.includes("/playlists") && (
            <DropdownMenuItem onClick={() => setIsOpen(true)}>
              <ListPlusIcon className="mr-2 size-4" />
              Add to playlist
            </DropdownMenuItem>
          )}
          {onRemove && (
            <DropdownMenuItem onClick={onRemove}>
              <Trash2Icon className="mr-2 size-4" />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
