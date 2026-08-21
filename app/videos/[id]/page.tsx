import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideoById } from "@/lib/videos";
import { CommentList } from "@/components/article/CommentList";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { PageFrame } from "@/components/layout/PageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { NOTEBOOK_LINES_STYLE, READABLE_BODY_STYLE } from "@/lib/notebookTheme";

type VideoPageParams = {
  id: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<VideoPageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoById(id);

  if (!video) {
    return {};
  }

  return {
    title: `${video.title} - 비버마을`,
  };
}

// 영상 상세: 큰 화면에서 재생 + 반응(댓글, D-01/D-02) 남기기.
export default async function VideoPage({
  params,
}: {
  params: Promise<VideoPageParams>;
}) {
  const { id } = await params;
  const video = await getVideoById(id);

  if (!video) {
    notFound();
  }

  return (
    <PageFrame>
      <div
        className="flex flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-8 sm:py-8 md:px-[54px] md:pt-9 md:pb-[34px]"
        style={NOTEBOOK_LINES_STYLE}
      >
        <div className="font-[family-name:var(--font-gaegu)]">
          <PageHeader current="videos" />
        </div>

        <div className="h-1 bg-[#e8c9a0]" />

        <Link
          href="/videos"
          className="w-fit text-[14px] text-[#8a7a63] underline hover:text-[#4b3a28] sm:text-[15px]"
          style={READABLE_BODY_STYLE}
        >
          ← 영상 목록으로
        </Link>

        <VideoPlayer
          youtubeId={video.youtube_id}
          title={video.title}
          thumbnail={video.thumbnail}
        />

        <header style={READABLE_BODY_STYLE}>
          <h1 className="text-[22px] leading-[1.4] font-bold text-[#33261a] sm:text-[26px]">
            {video.title}
          </h1>
          {video.original_title && video.original_title !== video.title && (
            <p className="mt-1 text-[14px] text-[#a89a82] sm:text-[15px]">
              {video.original_title}
            </p>
          )}
          <p className="mt-2 text-[14px] text-[#8a7a63] sm:text-[15px]">
            {video.channel_name}
            {video.channel_name && video.published_at ? " · " : ""}
            {formatPublishedDate(video.published_at)}
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[14px] text-[#c2571f] underline hover:text-[#a5481a] sm:text-[15px]"
          >
            유튜브에서 보기
          </a>
        </header>

        <CommentList targetType="video" targetId={video.id} />
      </div>
    </PageFrame>
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
