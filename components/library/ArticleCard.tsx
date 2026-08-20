import Link from "next/link";
import type { Article } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";

type ArticleCardProps = {
  article: Article;
};

// 기능명세서 A-02: 목록 카드 한 장. 질문, 요약 2줄, 카테고리 배지를 보여줌.
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/library/${article.category}/${article.slug}`}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
    >
      <span className="w-fit rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {CATEGORY_LABELS[article.category]}
      </span>

      <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
        {article.question}
      </h2>

      {article.summary && (
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {article.summary}
        </p>
      )}
    </Link>
  );
}
