import { supabase } from "@/lib/supabase/client";
import type { Video } from "@/lib/types";

// 영상 목록(C-01): 수집된 영상을 최신순으로 조회함.
export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return data;
}

// 영상 상세: id로 영상 1건 조회.
export async function getVideoById(id: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// 오늘의 비버(C-04): 대문에 표시할 최신 영상 1건.
export async function getLatestVideo(): Promise<Video | null> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
