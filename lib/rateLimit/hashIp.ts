import { createHash } from "node:crypto";

// 요청 IP를 그대로 저장하지 않고 솔트를 섞어 해시함(comments.ip_hash와 동일한 원칙,
// docs/결정사항.md D 참고). 검색 레이트리밋(search_rate_limits)뿐 아니라
// 나중에 반응 레이트리밋(D-04)에서도 재사용할 수 있도록 범용으로 작성함.
export function hashIp(ipAddress: string): string {
  const salt = process.env.IP_HASH_SALT;

  if (!salt) {
    throw new Error("IP_HASH_SALT 환경변수를 설정해주세요.");
  }

  return createHash("sha256").update(`${salt}:${ipAddress}`).digest("hex");
}
