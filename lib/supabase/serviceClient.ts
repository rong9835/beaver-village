import { createClient } from "@supabase/supabase-js";

// 주의: 이 클라이언트는 RLS를 완전히 우회하는 service_role 키를 사용함.
// 아래 두 곳 전용이며, 그 외 app/ 아래에서는 import하지 않는다:
// - 논문 삽입 스크립트(scripts/ingest-paper.ts)
// - 영상 자동 수집 크론(app/api/cron/videos/route.ts) — videos 테이블은 RLS상
//   anon에게 쓰기 정책이 아예 없고 "Cron(service_role)만 수행"하도록 설계됨
//   (supabase/migrations/20260819000100_enable_rls.sql 주석 참고). 이 경로는 시크릿
//   헤더로 인증된 SYSTEM 전용 호출이라 익명 사용자가 도달할 수 없음.
// 검색 API(app/api/search/route.ts)는 SECURITY DEFINER 함수(upsert_search_cache,
// check_search_rate_limit)를 통해 기존 anon 클라이언트(lib/supabase/client.ts)로만
// 캐시·레이트리밋을 다룬다. 근거: docs/결정사항.md I
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정해주세요.",
  );
}

export const supabaseServiceClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
);
