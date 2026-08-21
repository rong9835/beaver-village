import type { NextRequest } from "next/server";

// 검색(app/api/search)과 반응 작성(app/api/comments) 레이트리밋이 공통으로 씀.
export function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}
