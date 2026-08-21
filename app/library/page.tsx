import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLE_CATEGORIES, getPublishedArticles } from "@/lib/articles";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { ArticleCard } from "@/components/library/ArticleCard";
import { PageFrame } from "@/components/layout/PageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { NOTEBOOK_LINES_STYLE, READABLE_BODY_STYLE } from "@/lib/notebookTheme";

export const metadata: Metadata = {
  title: "도서관 - 비버마을",
};

// 기능명세서 A-02: 도서관 목록. SSG로 발행된 전체 콘텐츠를 최신순으로 보여줌.
export default async function LibraryPage() {
  const articles = await getPublishedArticles();

  return (
    <PageFrame>
      <div
        className="px-4 py-6 font-[family-name:var(--font-gaegu)] sm:px-8 sm:py-8 md:px-[54px] md:pt-9 md:pb-[34px]"
        style={NOTEBOOK_LINES_STYLE}
      >
        <PageHeader current="library" />

        <div className="my-5 h-1 bg-[#e8c9a0] sm:my-6" />

        <h1 className="mb-3.5 text-[28px] leading-[1.3] font-bold text-[#33261a] sm:mb-[18px] sm:text-[38px]">
          도서관
        </h1>

        <div className="mb-5 flex flex-wrap items-center gap-2.5 sm:mb-[26px] sm:gap-3">
          {ARTICLE_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/library/${category}`}
              className="rounded-full border-2 border-[#7a5a3a] bg-[#fdf1d8] px-3 py-1.5 text-[15px] text-[#4b3a28] hover:bg-[#f6e2b8] sm:px-4 sm:py-2 sm:text-[17px]"
            >
              {CATEGORY_LABELS[category]}
            </Link>
          ))}
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
