"use client";;
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { PlaylistsSection } from "../sections/playlists-section";
import { PlaylistCreateModal } from "../components/create-playlist-modal";

export const PlaylistsView = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <PlaylistCreateModal onOpenChange={setIsOpen} open={isOpen} />

      <div className="flex justify-between items-center">
        <div>
          <div className="text-2xl font-bold">Playlists</div>
          <div className="text-xs text-muted-foreground">
            Your playlists will show up here.
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon />
        </Button>
      </div>
      <PlaylistsSection />
    </div>
  );
};
