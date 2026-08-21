import Link from "next/link";
import type { Video } from "@/lib/types";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";

type TodayBeaverVideoProps = {
  video: Video | null;
};

// 기능명세서 C-04: 대문에 최신 영상 1건을 표시함. 영상 재생(C-02)은 홈 화면 매핑에
// 없는 기능이라, 여기서는 미리보기만 보여주고 클릭하면 큰 화면에서 재생할 수 있는
// 영상 상세 페이지(/videos/[id])로 이동시킴.
export function TodayBeaverVideo({ video }: TodayBeaverVideoProps) {
  if (!video) {
    return (
      <p className="text-[19px] text-[#8a7a63]" style={READABLE_BODY_STYLE}>
        아직 모아둔 영상이 없어요.
      </p>
    );
  }

  return (
    <Link
      href={`/videos/${video.id}`}
      className="flex flex-col items-start gap-3 sm:flex-row sm:gap-[22px]"
    >
      <div className="relative flex-none self-center sm:self-auto">
        <div className="absolute top-[-12px] left-1/2 z-10 h-[26px] w-[92px] -translate-x-1/2 rotate-[-4deg] border border-[rgba(160,130,80,.35)] bg-[rgba(226,199,140,.75)]" />

        <div className="h-[190px] w-full max-w-[306px] rotate-[-1.2deg] overflow-hidden border-[7px] border-white bg-[#e6ded0] shadow-[0_5px_14px_rgba(0,0,0,.15)] sm:h-[176px] sm:w-[306px]">
          {video.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[rgba(51,38,26,.8)] pl-1 text-[22px] text-[#fff8ef]">
            ▶
          </div>
        </div>
      </div>

      <div>
        <div className="text-[22px] font-bold text-[#33261a] sm:text-[26px]">오늘의 비버</div>
        <div
          className="mt-1.5 text-[17px] leading-[1.6] text-[#4b3a28] sm:text-[19px]"
          style={READABLE_BODY_STYLE}
        >
          {video.title}
        </div>
        <div className="mt-2.5 text-[15px] text-[#8a7a63] sm:text-[16px]" style={READABLE_BODY_STYLE}>
          {video.channel_name}
          {video.channel_name && video.published_at ? " · " : ""}
          {formatPublishedDate(video.published_at)}
        </div>
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
  return `${year}. ${month}. ${day}. 기록`;
}
