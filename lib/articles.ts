import { supabase } from "@/lib/supabase/client";
import type { Article, ArticleCategory } from "@/lib/types";

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  "body",
  "behavior",
  "ecology",
  "human",
];

export function isArticleCategory(value: string): value is ArticleCategory {
  return ARTICLE_CATEGORIES.includes(value as ArticleCategory);
}

// 정적 페이지 생성(generateStaticParams)에 쓰는 목록.
// 발행되지 않은 글은 애초에 페이지 자체를 만들지 않음.
export async function getPublishedArticleParams() {
  const { data, error } = await supabase
    .from("articles")
    .select("slug, category")
    .eq("published", true);

  if (error) {
    throw error;
  }

  return data;
}

// 상세 페이지 본문 조회. published가 아니거나 존재하지 않으면 null을 돌려줌.
export async function getPublishedArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// 도서관 목록(A-02): 발행된 전체 콘텐츠를 최신순으로 조회함.
export async function getPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

// 카테고리 필터(A-03): 특정 카테고리의 발행된 콘텐츠만 최신순으로 조회함.
export async function getPublishedArticlesByCategory(
  category: ArticleCategory,
): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

// 다음 읽을거리(A-04): 동일 카테고리에서 현재 글을 제외한 최신 3건.
export async function getNextReads(
  category: ArticleCategory,
  excludeArticleId: string,
): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .eq("category", category)
    .neq("id", excludeArticleId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    throw error;
  }

  return data;
}
