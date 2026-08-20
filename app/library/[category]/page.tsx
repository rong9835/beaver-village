import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ARTICLE_CATEGORIES,
  getPublishedArticlesByCategory,
  isArticleCategory,
} from "@/lib/articles";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { ArticleCard } from "@/components/library/ArticleCard";

type CategoryPageParams = {
  category: string;
};

// 기능명세서 A-03: 4개 카테고리 페이지를 빌드 시점에 미리 생성함.
export async function generateStaticParams() {
  return ARTICLE_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { category } = await params;

  if (!isArticleCategory(category)) {
    return {};
  }

  return {
    title: `${CATEGORY_LABELS[category]} - 도서관 - 비버마을`,
  };
}

// 기능명세서 A-03: 카테고리 필터. SSG로 해당 카테고리의 발행된 콘텐츠만 보여줌.
export default async function LibraryCategoryPage({
  params,
}: {
  params: Promise<CategoryPageParams>;
}) {
  const { category } = await params;

  if (!isArticleCategory(category)) {
    notFound();
  }

  const articles = await getPublishedArticlesByCategory(category);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        도서관 · {CATEGORY_LABELS[category]}
      </h1>

      {articles.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          곧 채워질 예정이에요.
        </p>
      )}

      {articles.length > 0 && (
        <ul className="flex flex-col gap-3">
          {articles.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
