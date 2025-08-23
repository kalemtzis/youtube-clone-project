import Link from "next/link";
import { VideosGetManyOutput } from "../../types";
import { VideoThumbnail, VideoThumbnailSkeleton } from "./video-thumbnail";
import { VideoInfo, VideoInfoSkeleton } from "./video-info";

interface Props {
  data: VideosGetManyOutput["items"][number];
  onRemove?: () => void;
}

export const VideoGridCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <VideoThumbnailSkeleton />
      <VideoInfoSkeleton />
    </div>
  )
}

export const VideoGridCard = ({ data, onRemove }: Props) => {
  return (
    <div className="flex flex-col gap-2 w-full group">
      <Link prefetch href={`/videos/${data.id}`}>
        <VideoThumbnail
          imageUrl={data.thumbnailUrl}
          previewUrl={data.previewUrl}
          title={data.title}
          duration={data.duration}
        />
      </Link>
      <VideoInfo data={data} onRemove={onRemove} />
    </div>
  );
};
