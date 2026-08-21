// Supabase 테이블/뷰와 1:1로 대응하는 타입
// 근거: supabase/migrations/20260819000000_init_schema.sql

export type ArticleCategory = "body" | "behavior" | "ecology" | "human";

export type Article = {
  id: string;
  slug: string;
  category: ArticleCategory;
  question: string;
  content: string;
  summary: string | null;
  source_title: string | null;
  source_author: string | null;
  source_year: number | null;
  source_url: string | null;
  // videos 테이블을 참조하는 FK가 아님. docs/결정사항.md A 참고
  youtube_video_id: string | null;
  published: boolean;
  created_at: string;
};

export type Video = {
  id: string;
  youtube_id: string;
  // 한국어로 번역된 제목. 원문(수집 당시 유튜브 제목)은 original_title에 따로 보존함.
  title: string;
  original_title: string | null;
  thumbnail: string | null;
  channel_name: string | null;
  published_at: string | null;
  created_at: string;
};

export type CommentTargetType = "article" | "video" | "guestbook";

// comments_public 뷰: ip_hash를 제외한 공개 조회용 컬럼만 노출됨
export type PublicComment = {
  id: string;
  target_type: CommentTargetType;
  target_id: string | null;
  content: string;
  approved: boolean;
  created_at: string;
};

// 검색(RAG)용 타입. 근거: supabase/migrations/20260820000000_add_paper_search.sql
// docs/결정사항.md I 참고

export type PaperLicense = "CC-BY" | "CC-BY-SA" | "public-domain" | "PMC-OA";

export type Paper = {
  id: string;
  title: string;
  authors: string;
  publish_year: number | null;
  source_url: string;
  license: PaperLicense;
  full_text: string;
  created_at: string;
};

// match_paper_chunks() RPC의 반환 행 하나
export type MatchedChunk = {
  chunk_id: string;
  content: string;
  similarity: number;
  paper_id: string;
  paper_title: string;
  paper_authors: string;
  paper_publish_year: number | null;
  paper_source_url: string;
};

export type SearchSource = {
  paperId: string;
  title: string;
  authors: string;
  publishYear: number | null;
  sourceUrl: string;
};

export type SearchCacheEntry = {
  id: string;
  normalized_query: string;
  answer: string;
  paper_ids: string[];
  hit_count: number;
  created_at: string;
};
