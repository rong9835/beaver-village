import type { Metadata } from "next";
import { getVideos } from "@/lib/videos";
import { PageFrame } from "@/components/layout/PageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { VideoCard } from "@/components/video/VideoCard";
import { NOTEBOOK_LINES_STYLE, READABLE_BODY_STYLE } from "@/lib/notebookTheme";

export const metadata: Metadata = {
  title: "영상 - 비버마을",
};

// 기능명세서 C-01: 수집된 영상을 최신순으로 보여줌. 카드를 누르면 큰 화면에서
// 볼 수 있는 상세 페이지(/videos/[id])로 이동함.
export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <PageFrame>
      <div
        className="px-4 py-6 font-[family-name:var(--font-gaegu)] sm:px-8 sm:py-8 md:px-[54px] md:pt-9 md:pb-[34px]"
        style={NOTEBOOK_LINES_STYLE}
      >
        <PageHeader current="videos" />

        <div className="my-5 h-1 bg-[#e8c9a0] sm:my-6" />

        <h1 className="mb-4 text-[28px] leading-[1.3] font-bold text-[#33261a] sm:mb-[26px] sm:text-[38px]">
          비버 영상 모아보기
        </h1>

        {videos.length === 0 && (
          <p className="text-[15px] text-[#8a7a63] sm:text-[17px]" style={READABLE_BODY_STYLE}>
            아직 모아둔 영상이 없어요. 곧 채워질 예정이에요.
          </p>
        )}

        {videos.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
