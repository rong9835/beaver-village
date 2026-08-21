"use client";

import { useState } from "react";

type LazyYoutubeEmbedProps = {
  youtubeVideoId: string;
};

// 기능명세서 C-02: 초기에는 썸네일만 렌더링하고, 클릭 시에만 iframe을 삽입함.
// iframe 1개당 500KB 이상 로드되어 LCP를 악화시키므로 최초 로드에서 반드시 제외해야 함.
export function LazyYoutubeEmbed({ youtubeVideoId }: LazyYoutubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  if (thumbnailFailed) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-[#cbbfa3] bg-[#f7f0dd] p-6 text-center text-[15px] text-[#8a7a63]">
        영상을 불러올 수 없어요
      </p>
    );
  }

  if (isPlaying) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
          title="유튜브 영상 재생"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg"
      aria-label="영상 재생"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        onError={() => setThumbnailFailed(true)}
        className="h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl">
          ▶
        </span>
      </span>
    </button>
  );
}
