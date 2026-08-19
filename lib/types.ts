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
