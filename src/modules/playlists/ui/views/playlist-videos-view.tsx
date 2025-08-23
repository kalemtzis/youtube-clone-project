"use client";

import { PlaylistVideosSection } from "../sections/playlist-videos-section";
import { PlaylistHeaderSection } from "../sections/playlist-header-section";

interface Props {
  playlistId: string;
}

export const PlaylistVideosView = ({ playlistId }: Props) => {
  return (
    <div className="max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <PlaylistHeaderSection playlistId={playlistId} />
      <PlaylistVideosSection playlistId={playlistId} />
    </div>
  );
};
