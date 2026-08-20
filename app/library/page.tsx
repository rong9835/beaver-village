import type { Metadata } from "next";
import { getPublishedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/library/ArticleCard";

export const metadata: Metadata = {
  title: "도서관 - 비버마을",
};

// 기능명세서 A-02: 도서관 목록. SSG로 발행된 전체 콘텐츠를 최신순으로 보여줌.
export default async function LibraryPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        도서관
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
