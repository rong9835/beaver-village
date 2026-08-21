import type { Article } from "@/lib/types";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";

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
    <section
      className="rounded-2xl border-2 border-dashed border-[#cbbfa3] bg-[#f7f0dd] p-4"
      style={READABLE_BODY_STYLE}
    >
      <h2 className="mb-2 text-[14px] font-bold text-[#8a7a63]">논문 출처</h2>
      <p className="text-[15px] text-[#33261a]">
        {article.source_author} ({article.source_year}). {article.source_title}
      </p>
      <a
        href={article.source_url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-[15px] text-[#c2571f] underline hover:text-[#a5481a]"
      >
        원문 보기
      </a>
    </section>
  );
}
