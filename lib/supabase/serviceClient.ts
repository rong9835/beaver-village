import { createClient } from "@supabase/supabase-js";

// 주의: 이 클라이언트는 RLS를 완전히 우회하는 service_role 키를 사용함.
// 아래 네 곳 전용이며, 그 외 app/ 아래에서는 import하지 않는다:
// - 논문 삽입 스크립트(scripts/ingest-paper.ts)
// - 영상 자동 수집 크론(app/api/cron/videos/route.ts) — videos 테이블은 RLS상
//   anon에게 쓰기 정책이 아예 없고 "Cron(service_role)만 수행"하도록 설계됨
//   (supabase/migrations/20260819000100_enable_rls.sql 주석 참고). 이 경로는 시크릿
//   헤더로 인증된 SYSTEM 전용 호출이라 익명 사용자가 도달할 수 없음.
// - 검색 API(app/api/search/route.ts)의 upsert_search_cache / check_generation_budget
//   호출. 두 함수 다 SECURITY DEFINER지만, 그건 "테이블 RLS를 우회한다"는 뜻일 뿐
//   "누가 이 함수를 부를 수 있는가"와는 별개임 — anon에게 EXECUTE 권한을 주면
//   앱 검증을 거치지 않고 누구나 직접 rpc()로 캐시를 오염시키거나 예산 카운터를
//   소진시킬 수 있었음(2026-08-21 보안 수정, 근거: docs/결정사항.md I 후속 수정).
//   그래서 두 함수의 anon/authenticated/PUBLIC EXECUTE 권한을 회수하고 여기서만 호출한다.
//   check_search_rate_limit은 여전히 anon 클라이언트(lib/supabase/client.ts)로 호출함
//   — 인자를 조작해도 호출자 자신의 요청 한도만 바뀌어 위험도가 다르기 때문.
// - 반응 API(app/api/comments/route.ts)의 check_comment_daily_limit 호출. 위와 같은
//   이유(공유 카운터를 증가시키는 함수)로 anon/authenticated/PUBLIC 모두 EXECUTE 권한이
//   없음(20260821000400 마이그레이션). check_comment_rate_limit·check_comment_duplicate는
//   호출자 자신에게만 영향을 주는 읽기 성격이라 여전히 anon 클라이언트로 호출한다.
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
