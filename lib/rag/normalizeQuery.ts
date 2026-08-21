// 검색 캐시 조회용 질문 정규화. 대소문자·공백·문장부호 차이로 캐시가
// 갈라지지 않도록 함(예: "비버 이빨 왜 주황색?" ≒ "비버 이빨 왜 주황색").
export function normalizeQuery(rawQuery: string): string {
  const lowerCased = rawQuery.toLowerCase();
  const punctuationRemoved = lowerCased.replace(/[.,!?~…"'()[\]{}]/g, "");
  const whitespaceCollapsed = punctuationRemoved.replace(/\s+/g, " ").trim();

  return whitespaceCollapsed;
}
