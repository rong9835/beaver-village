import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { embedText } from "@/lib/rag/embed";
import { generateAnswer } from "@/lib/rag/generateAnswer";
import { normalizeQuery } from "@/lib/rag/normalizeQuery";
import { hashIp } from "@/lib/rateLimit/hashIp";
import { getRequestIp } from "@/lib/rateLimit/getRequestIp";
import type { MatchedChunk, SearchSource } from "@/lib/types";

const QUERY_MIN_LENGTH = 1;
const QUERY_MAX_LENGTH = 100;

const MATCH_COUNT = 5;
const DEFAULT_SIMILARITY_THRESHOLD = 0.25;

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

// Voyage 임베딩은 무료 토큰이 넉넉해서 사실상 위험이 없지만, Claude 생성 호출은
// 매번 바로 과금됨. 버그·악용으로 폭주해도 최악의 비용을 막기 위한 자체 월간 상한선.
// 근거: docs/결정사항.md I
const MONTHLY_GENERATION_CAP = 1000;

type SearchResponseBody = {
  answer: string | null;
  sources: SearchSource[];
};

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const trimmedQuery = rawQuery.trim();

  if (
    trimmedQuery.length < QUERY_MIN_LENGTH ||
    trimmedQuery.length > QUERY_MAX_LENGTH
  ) {
    return NextResponse.json(
      { error: "질문은 1자 이상 100자 이하로 입력해주세요." },
      { status: 400 },
    );
  }

  const requestIp = getRequestIp(request);
  const ipHash = hashIp(requestIp);

  const { data: isAllowed, error: rateLimitError } = await supabase.rpc(
    "check_search_rate_limit",
    {
      p_ip_hash: ipHash,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    },
  );

  if (rateLimitError) {
    throw rateLimitError;
  }

  if (!isAllowed) {
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const normalizedQuery = normalizeQuery(trimmedQuery);

  const { data: cachedEntry, error: cacheReadError } = await supabase
    .from("search_cache")
    .select("answer, paper_ids")
    .eq("normalized_query", normalizedQuery)
    .maybeSingle();

  if (cacheReadError) {
    throw cacheReadError;
  }

  if (cachedEntry) {
    const { error: cacheHitError } = await supabase.rpc(
      "upsert_search_cache",
      {
        p_normalized_query: normalizedQuery,
        p_answer: cachedEntry.answer,
        p_paper_ids: cachedEntry.paper_ids,
      },
    );

    if (cacheHitError) {
      throw cacheHitError;
    }

    const sources = await getSourcesByPaperIds(cachedEntry.paper_ids);
    const responseBody: SearchResponseBody = {
      answer: cachedEntry.answer,
      sources,
    };
    return NextResponse.json(responseBody);
  }

  // Voyage/Claude 같은 외부 API는 일시적으로 느리거나 요청 한도를 넘겨 실패할 수 있음.
  // 이 경우 그냥 예외를 던져서 500으로 죽게 두면 사용자에게 원인 모를 에러만 보이므로,
  // 여기서 잡아서 "잠시 후 다시 시도해주세요" 같은 명확한 메시지로 바꿔줌.
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedText(trimmedQuery);
  } catch {
    return NextResponse.json(
      { error: "검색 서비스가 일시적으로 바빠요. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    );
  }

  const similarityThreshold = getSimilarityThreshold();

  const { data: matchedChunks, error: matchError } = await supabase.rpc(
    "match_paper_chunks",
    {
      query_embedding: queryEmbedding,
      match_count: MATCH_COUNT,
      similarity_threshold: similarityThreshold,
    },
  );

  if (matchError) {
    throw matchError;
  }

  const typedMatchedChunks = matchedChunks as MatchedChunk[];

  if (typedMatchedChunks.length === 0) {
    const emptyResponseBody: SearchResponseBody = { answer: null, sources: [] };
    return NextResponse.json(emptyResponseBody);
  }

  const monthKey = getCurrentMonthKey();

  const { data: isUnderBudget, error: budgetError } = await supabase.rpc(
    "check_generation_budget",
    {
      p_month_key: monthKey,
      p_max_generations: MONTHLY_GENERATION_CAP,
    },
  );

  if (budgetError) {
    throw budgetError;
  }

  if (!isUnderBudget) {
    return NextResponse.json(
      {
        error:
          "이번 달 검색 답변 생성 한도에 도달했어요. 다음 달에 다시 이용해주세요.",
      },
      { status: 503 },
    );
  }

  let generatedAnswer: Awaited<ReturnType<typeof generateAnswer>>;
  try {
    generatedAnswer = await generateAnswer(trimmedQuery, typedMatchedChunks);
  } catch {
    return NextResponse.json(
      { error: "검색 서비스가 일시적으로 바빠요. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    );
  }

  // 검색된 청크가 있어도 실제로 질문과 관련된 내용이 없다고 Claude가 판단하면
  // (grounded === false), 관련 없는 출처를 답 없이 붙여서 보여주는 대신
  // 매칭 0건일 때와 같은 빈 상태(B-03)로 처리함. 이 경우는 재사용 가치가 낮아 캐시하지 않음.
  if (!generatedAnswer.grounded) {
    const notGroundedResponseBody: SearchResponseBody = {
      answer: null,
      sources: [],
    };
    return NextResponse.json(notGroundedResponseBody);
  }

  const paperIds = getUniquePaperIds(typedMatchedChunks);

  const { error: cacheWriteError } = await supabase.rpc(
    "upsert_search_cache",
    {
      p_normalized_query: normalizedQuery,
      p_answer: generatedAnswer.answer,
      p_paper_ids: paperIds,
    },
  );

  if (cacheWriteError) {
    throw cacheWriteError;
  }

  const sources = getSourcesFromMatchedChunks(typedMatchedChunks);
  const responseBody: SearchResponseBody = {
    answer: generatedAnswer.answer,
    sources,
  };
  return NextResponse.json(responseBody);
}

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getSimilarityThreshold(): number {
  const envValue = process.env.SEARCH_SIMILARITY_THRESHOLD;
  if (!envValue) {
    return DEFAULT_SIMILARITY_THRESHOLD;
  }
  return Number(envValue);
}

function getUniquePaperIds(matchedChunks: MatchedChunk[]): string[] {
  const paperIdSet = new Set<string>();
  for (const chunk of matchedChunks) {
    paperIdSet.add(chunk.paper_id);
  }
  return Array.from(paperIdSet);
}

function getSourcesFromMatchedChunks(
  matchedChunks: MatchedChunk[],
): SearchSource[] {
  const sourcesByPaperId = new Map<string, SearchSource>();

  for (const chunk of matchedChunks) {
    if (sourcesByPaperId.has(chunk.paper_id)) {
      continue;
    }
    sourcesByPaperId.set(chunk.paper_id, {
      paperId: chunk.paper_id,
      title: chunk.paper_title,
      authors: chunk.paper_authors,
      publishYear: chunk.paper_publish_year,
      sourceUrl: chunk.paper_source_url,
    });
  }

  return Array.from(sourcesByPaperId.values());
}

async function getSourcesByPaperIds(
  paperIds: string[],
): Promise<SearchSource[]> {
  if (paperIds.length === 0) {
    return [];
  }

  const { data: papers, error } = await supabase
    .from("papers")
    .select("id, title, authors, publish_year, source_url")
    .in("id", paperIds);

  if (error) {
    throw error;
  }

  return papers.map((paper) => ({
    paperId: paper.id,
    title: paper.title,
    authors: paper.authors,
    publishYear: paper.publish_year,
    sourceUrl: paper.source_url,
  }));
}
