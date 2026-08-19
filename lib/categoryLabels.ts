import type { ArticleCategory } from "@/lib/types";

// URL에 쓰이는 영문 category 값을 화면에 보여줄 한글 라벨로 변환함.
export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  body: "몸",
  behavior: "행동",
  ecology: "생태",
  human: "사람과의 관계",
};
