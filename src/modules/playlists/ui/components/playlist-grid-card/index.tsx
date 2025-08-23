import Link from "next/link";
import { PlaylistGetManyOutput } from "../../../types";
import {
  PlaylistThumbnail,
  PlaylistThumbnailSkeleton,
} from "./playlist-thumbnail";
import { PlaylistInfo, PlaylistInfoSkeleton } from "./playlist-info";

interface Props {
  data: PlaylistGetManyOutput["items"][number];
}

export const PlaylistGridCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <PlaylistThumbnailSkeleton />
      <PlaylistInfoSkeleton />
    </div>
  );
};

export const PlaylistGridCard = ({ data }: Props) => {
  return (
    <Link prefetch href={`/playlists/${data.id}`}>
      <div className="flex flex-col gap-2 w-full group">
        <PlaylistThumbnail
          imageUrl={data.thumbnailUrl}
          title={data.name}
          videoCount={data.videosCount}
        />
        <PlaylistInfo data={data} />
      </div>
    </Link>
  );
};
