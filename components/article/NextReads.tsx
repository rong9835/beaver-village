import Link from "next/link";
import type { Article } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";

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
      <h2 className="mb-3 text-[24px] font-bold text-[#4b3a28] font-[family-name:var(--font-gaegu)]">
        다음 읽을거리
      </h2>
      <ul className="flex flex-col gap-2" style={READABLE_BODY_STYLE}>
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/library/${article.category}/${article.slug}`}
              className="block rounded-xl border-2 border-[#e8c9a0] bg-[#fdf8ea] px-3 py-2 text-[15px] text-[#33261a] hover:bg-[#f7f0dd]"
            >
              <span className="mr-2 rounded-full border border-[#7a5a3a] px-1.5 py-0.5 text-[12px] text-[#8a7a63]">
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
