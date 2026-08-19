import Link from "next/link";
import type { Article } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";

type NextReadsProps = {
  articles: Article[];
};

// 기능명세서 A-04: 동일 카테고리 글 3건. 조회 자체가 없으면(글이 부족하면) 섹션을 숨김.
export function NextReads({ articles }: NextReadsProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        다음 읽을거리
      </h2>
      <ul className="flex flex-col gap-2">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/library/${article.category}/${article.slug}`}
              className="block rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-700"
            >
              <span className="mr-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {CATEGORY_LABELS[article.category]}
              </span>
              {article.question}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
