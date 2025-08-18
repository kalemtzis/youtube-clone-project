"use client";

import MuxPlayer from "@mux/mux-player-react";
import Image from "next/image";

interface Props {
  playbackId?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  autoPlay?: boolean;
  onPlay?: () => void;
}

export const VideoPlayer = ({
  autoPlay,
  onPlay,
  playbackId,
  thumbnailUrl,
}: Props) => {
  if (!playbackId) return (
    <div>
      <Image src="/images/placeholder.svg" alt="placeholder" fill className="object-cover" />
    </div>
  );

  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={thumbnailUrl || "/images/placeholder.svg"}
      playerInitTime={0}
      autoPlay={autoPlay}
      thumbnailTime={0}
      className="w-full h-full object-contain"
      accentColor="#FF2056"
      onPlay={onPlay}
    />
  );
};
