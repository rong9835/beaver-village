import Link from "next/link";
import type { Article } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";

type ArticleCardProps = {
  article: Article;
};

// 기능명세서 A-02: 목록 카드 한 장. 질문, 요약 2줄, 카테고리 배지를 보여줌.
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/library/${article.category}/${article.slug}`}
      className="flex flex-col gap-2 rounded-2xl border-[3px] border-[#33261a] bg-white p-4 shadow-[5px_5px_0_#e8c9a0] hover:bg-[#fffdf6]"
    >
      <span className="w-fit rounded-full border-2 border-[#7a5a3a] bg-[#fdf1d8] px-3 py-0.5 text-[13px] text-[#4b3a28]">
        {CATEGORY_LABELS[article.category]}
      </span>

      <h2 className="text-[20px] font-bold text-[#33261a]">
        {article.question}
      </h2>

      {article.summary && (
        <p
          className="line-clamp-2 text-[15px] leading-[1.5] text-[#8a7a63]"
          style={READABLE_BODY_STYLE}
        >
          {article.summary}
        </p>
      )}
    </Link>
  );
}
