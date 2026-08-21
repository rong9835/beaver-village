"use client";

import { useState } from "react";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";

type VideoPlayerProps = {
  youtubeId: string;
  title: string;
  thumbnail: string | null;
};

// 기능명세서 C-02: 초기에는 썸네일만 렌더링하고, 클릭 시에만 iframe을 삽입함.
export function VideoPlayer({ youtubeId, title, thumbnail }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  const thumbnailSrc = thumbnail ?? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border-[3px] border-[#33261a]">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (thumbnailFailed) {
    return (
      <div
        className="flex aspect-video w-full items-center justify-center rounded-2xl border-2 border-dashed border-[#cbbfa3] bg-[#f7f0dd] text-center text-[17px] text-[#8a7a63]"
        style={READABLE_BODY_STYLE}
      >
        영상을 불러올 수 없어요
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border-[3px] border-[#33261a]"
      aria-label="영상 재생"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailSrc}
        alt=""
        onError={() => setThumbnailFailed(true)}
        className="h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(51,38,26,.8)] pl-1.5 text-4xl text-[#fff8ef]">
          ▶
        </span>
      </span>
    </button>
  );
}
