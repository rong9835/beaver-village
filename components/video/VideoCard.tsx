import Link from "next/link";
import type { Video } from "@/lib/types";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";

type VideoCardProps = {
  video: Video;
};

// 목록 카드는 미리보기 역할만 함. 클릭하면 큰 화면에서 볼 수 있는 상세 페이지로 이동함.
export function VideoCard({ video }: VideoCardProps) {
  const thumbnailSrc =
    video.thumbnail ?? `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;

  return (
    <Link
      href={`/videos/${video.id}`}
      className="flex flex-col gap-3 rounded-2xl border-[3px] border-[#33261a] bg-white p-3 shadow-[5px_5px_0_#e8c9a0] hover:bg-[#fffdf6]"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#e6ded0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnailSrc} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(51,38,26,.8)] pl-1 text-2xl text-[#fff8ef]">
            ▶
          </span>
        </span>
      </div>

      <div style={READABLE_BODY_STYLE}>
        <p className="text-[17px] leading-[1.4] font-bold text-[#33261a]">
          {video.title}
        </p>
        {video.original_title && video.original_title !== video.title && (
          <p className="mt-0.5 text-[13px] text-[#a89a82]">{video.original_title}</p>
        )}
        <p className="mt-1 text-[14px] text-[#8a7a63]">
          {video.channel_name}
          {video.channel_name && video.published_at ? " · " : ""}
          {formatPublishedDate(video.published_at)}
        </p>
      </div>
    </Link>
  );
}

function formatPublishedDate(publishedAt: string | null): string {
  if (!publishedAt) {
    return "";
  }

  const date = new Date(publishedAt);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}. ${month}. ${day}.`;
}
