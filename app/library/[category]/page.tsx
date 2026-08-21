import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ARTICLE_CATEGORIES,
  getPublishedArticlesByCategory,
  isArticleCategory,
} from "@/lib/articles";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { ArticleCard } from "@/components/library/ArticleCard";
import { PageFrame } from "@/components/layout/PageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { NOTEBOOK_LINES_STYLE, READABLE_BODY_STYLE } from "@/lib/notebookTheme";

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
    <PageFrame>
      <div
        className="px-4 py-6 font-[family-name:var(--font-gaegu)] sm:px-8 sm:py-8 md:px-[54px] md:pt-9 md:pb-[34px]"
        style={NOTEBOOK_LINES_STYLE}
      >
        <PageHeader current="library" />

        <div className="my-5 h-1 bg-[#e8c9a0] sm:my-6" />

        <h1 className="mb-3.5 text-[26px] leading-[1.3] font-bold text-[#33261a] sm:mb-[18px] sm:text-[38px]">
          도서관 · {CATEGORY_LABELS[category]}
        </h1>

        <div className="mb-5 flex flex-wrap items-center gap-2.5 sm:mb-[26px] sm:gap-3">
          <Link
            href="/library"
            className="rounded-full border-2 border-[#7a5a3a] px-3 py-1.5 text-[15px] text-[#4b3a28] hover:bg-[#f6e2b8] sm:px-4 sm:py-2 sm:text-[17px]"
          >
            전체
          </Link>
          {ARTICLE_CATEGORIES.map((categoryOption) => {
            const isCurrentCategory = categoryOption === category;

            return (
              <Link
                key={categoryOption}
                href={`/library/${categoryOption}`}
                className={
                  isCurrentCategory
                    ? "rounded-full border-2 border-[#7a5a3a] bg-[#e2703a] px-3 py-1.5 text-[15px] font-bold text-[#fff8ef] sm:px-4 sm:py-2 sm:text-[17px]"
                    : "rounded-full border-2 border-[#7a5a3a] bg-[#fdf1d8] px-3 py-1.5 text-[15px] text-[#4b3a28] hover:bg-[#f6e2b8] sm:px-4 sm:py-2 sm:text-[17px]"
                }
              >
                {CATEGORY_LABELS[categoryOption]}
              </Link>
            );
          })}
        </div>

        {articles.length === 0 && (
          <p className="text-[15px] text-[#8a7a63] sm:text-[17px]" style={READABLE_BODY_STYLE}>
            곧 채워질 예정이에요.
          </p>
        )}

        {articles.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageFrame>
  );
}
