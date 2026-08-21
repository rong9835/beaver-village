import { supabase } from "@/lib/supabase/client";
import { generateDailyFactText } from "@/lib/rag/generateDailyFact";
import { getRandomBeaverPhoto, type UnsplashPhoto } from "@/lib/unsplash";

export type DailyBeaverFact = {
  fact: string;
  paperTitle: string;
  paperAuthors: string;
  paperYear: number | null;
  paperSourceUrl: string;
  photo: UnsplashPhoto | null;
};

// 오늘 날짜를 기준으로 논문 발췌문 하나를 결정적으로 골라, 그 안 내용만으로
// "오늘의 비버상식" 한 줄을 만듦. 대문(app/page.tsx)이 하루 한 번만 다시 그려지도록
// (revalidate = 86400) 캐싱해서, 매 요청마다 Claude를 부르지 않게 함.
export async function getDailyBeaverFact(): Promise<DailyBeaverFact | null> {
  const { count, error: countError } = await supabase
    .from("paper_chunks")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw countError;
  }

  if (!count || count === 0) {
    return null;
  }

  const chunkIndex = getDayOfYear(new Date()) % count;

  const { data: chunkRows, error: chunkError } = await supabase
    .from("paper_chunks")
    .select("content, paper_id")
    .order("paper_id", { ascending: true })
    .order("chunk_index", { ascending: true })
    .range(chunkIndex, chunkIndex);

  if (chunkError) {
    throw chunkError;
  }

  const chunk = chunkRows?.[0];
  if (!chunk) {
    return null;
  }

  const { data: paper, error: paperError } = await supabase
    .from("papers")
    .select("title, authors, publish_year, source_url")
    .eq("id", chunk.paper_id)
    .single();

  if (paperError) {
    throw paperError;
  }

  const [fact, photo] = await Promise.all([
    generateDailyFactText(chunk.content),
    getRandomBeaverPhoto(),
  ]);

  return {
    fact,
    paperTitle: paper.title,
    paperAuthors: paper.authors,
    paperYear: paper.publish_year,
    paperSourceUrl: paper.source_url,
    photo,
  };
}

function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diffMs = date.getTime() - startOfYear.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
