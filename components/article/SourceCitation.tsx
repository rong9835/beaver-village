import type { Article } from "@/lib/types";

type SourceCitationProps = {
  article: Pick<
    Article,
    "source_title" | "source_author" | "source_year" | "source_url"
  >;
};

// 기능명세서 A-05: 4개 필드가 전부 있을 때만 출처 블록을 렌더링함.
export function SourceCitation({ article }: SourceCitationProps) {
  const hasAllFields =
    article.source_title &&
    article.source_author &&
    article.source_year &&
    article.source_url;

  if (!hasAllFields) {
    return null;
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        논문 출처
      </h2>
      <p className="text-sm text-zinc-800 dark:text-zinc-200">
        {article.source_author} ({article.source_year}). {article.source_title}
      </p>
      <a
        href={article.source_url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm text-blue-600 underline dark:text-blue-400"
      >
        원문 보기
      </a>
    </section>
  );
}
