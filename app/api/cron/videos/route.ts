import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServiceClient } from "@/lib/supabase/serviceClient";
import { translateTitlesToKorean } from "@/lib/youtube/translateTitles";
import type { Video } from "@/lib/types";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const VIDEOS_PER_CHANNEL = 10;

// 기능명세서 C-03: 큐레이션 채널 목록. 채널을 늘리려면 핸들만 추가하면 됨.
const CURATED_CHANNEL_HANDLES = ["hmuraco"];

type YoutubeChannelsResponse = {
  items?: Array<{
    contentDetails: { relatedPlaylists: { uploads: string } };
  }>;
};

type YoutubePlaylistItemsResponse = {
  items?: Array<{
    snippet: {
      title: string;
      channelTitle: string;
      publishedAt: string;
      resourceId: { videoId: string };
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }>;
};

type VideoUpsertRow = Omit<Video, "id" | "created_at">;

type ChannelCollectionResult = {
  handle: string;
  upsertedCount: number;
  error?: string;
};

// 기능명세서 C-03: 큐레이션 채널의 최신 영상을 일 1회 수집해 videos 테이블에 upsert함.
// Vercel Cron이 매일 09:00 KST에 이 경로를 호출함(vercel.json).
export async function GET(request: NextRequest) {
  const authorizationHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authorizationHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "인증에 실패했어요." }, { status: 401 });
  }

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY 환경변수를 설정해주세요." },
      { status: 500 },
    );
  }

  let totalUpsertedCount = 0;
  const channelResults: ChannelCollectionResult[] = [];

  for (const channelHandle of CURATED_CHANNEL_HANDLES) {
    // 채널 1개의 실패가 전체 수집을 중단시키지 않도록 채널 단위로 try-catch를 적용함
    // (기능명세서 C-03 "중요" 항목). 실패한 채널은 로그만 남기고 다음 채널로 넘어감.
    try {
      const upsertedCount = await collectVideosFromChannel(channelHandle, youtubeApiKey);
      totalUpsertedCount += upsertedCount;
      channelResults.push({ handle: channelHandle, upsertedCount });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      console.error(`[cron/videos] "${channelHandle}" 채널 수집 실패:`, error);
      channelResults.push({ handle: channelHandle, upsertedCount: 0, error: errorMessage });
    }
  }

  // /videos와 대문(오늘의 비버, C-04)은 SSG라 DB가 바뀌어도 그 자체로는 화면이 안
  // 바뀜. 새로 수집된 게 있을 때만 캐시된 페이지를 무효화해서 다음 요청에 반영되게 함.
  if (totalUpsertedCount > 0) {
    revalidatePath("/videos");
    revalidatePath("/");
  }

  return NextResponse.json({ totalUpsertedCount, channelResults });
}

async function collectVideosFromChannel(
  channelHandle: string,
  youtubeApiKey: string,
): Promise<number> {
  const uploadsPlaylistId = await getUploadsPlaylistId(channelHandle, youtubeApiKey);
  const videoRows = await getRecentVideoRows(uploadsPlaylistId, youtubeApiKey);

  if (videoRows.length === 0) {
    return 0;
  }

  const { error } = await supabaseServiceClient
    .from("videos")
    .upsert(videoRows, { onConflict: "youtube_id" });

  if (error) {
    throw error;
  }

  return videoRows.length;
}

async function getUploadsPlaylistId(
  channelHandle: string,
  youtubeApiKey: string,
): Promise<string> {
  const requestUrl = new URL(`${YOUTUBE_API_BASE_URL}/channels`);
  requestUrl.searchParams.set("part", "contentDetails");
  requestUrl.searchParams.set("forHandle", channelHandle);
  requestUrl.searchParams.set("key", youtubeApiKey);

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`YouTube channels.list 호출 실패 (${response.status})`);
  }

  const responseBody: YoutubeChannelsResponse = await response.json();
  const channel = responseBody.items?.[0];
  if (!channel) {
    throw new Error(`채널 "@${channelHandle}"을 찾을 수 없어요.`);
  }

  return channel.contentDetails.relatedPlaylists.uploads;
}

async function getRecentVideoRows(
  uploadsPlaylistId: string,
  youtubeApiKey: string,
): Promise<VideoUpsertRow[]> {
  const requestUrl = new URL(`${YOUTUBE_API_BASE_URL}/playlistItems`);
  requestUrl.searchParams.set("part", "snippet");
  requestUrl.searchParams.set("playlistId", uploadsPlaylistId);
  requestUrl.searchParams.set("maxResults", String(VIDEOS_PER_CHANNEL));
  requestUrl.searchParams.set("key", youtubeApiKey);

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`YouTube playlistItems.list 호출 실패 (${response.status})`);
  }

  const responseBody: YoutubePlaylistItemsResponse = await response.json();
  const items = responseBody.items ?? [];

  const originalTitles = items.map((item) => item.snippet.title);

  // 번역이 실패해도(예: Claude API 일시 장애) 영상 수집 자체는 계속되어야 하므로,
  // 이 경우 원문 제목을 그대로 title에 넣는 것으로 대체함.
  let translatedTitles: string[];
  try {
    translatedTitles = await translateTitlesToKorean(originalTitles);
  } catch (error) {
    console.error("[cron/videos] 제목 번역 실패, 원문으로 대체함:", error);
    translatedTitles = originalTitles;
  }

  return items.map((item, index) => {
    const thumbnail =
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      null;

    return {
      youtube_id: item.snippet.resourceId.videoId,
      title: translatedTitles[index],
      original_title: item.snippet.title,
      thumbnail,
      channel_name: item.snippet.channelTitle,
      published_at: item.snippet.publishedAt,
    };
  });
}
