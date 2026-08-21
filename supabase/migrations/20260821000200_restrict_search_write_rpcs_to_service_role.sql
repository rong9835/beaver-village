-- 보안 수정: upsert_search_cache / check_generation_budget를 anon 직접 호출로부터 막음.
--
-- 문제: 두 함수 모두 SECURITY DEFINER라서 테이블 RLS는 우회하지만, "누가 이 함수를
-- 호출할 수 있는가"는 별개 문제(GRANT EXECUTE)임. anon에게 EXECUTE 권한이 있으면
-- 앱(app/api/search/route.ts)의 검증 로직을 거치지 않고 누구나 supabase.rpc()를 직접
-- 호출할 수 있어서, 애초에 막으려던 것(캐시 오염·예산 소진)이 그대로 가능했음.
-- (20260820000000_add_paper_search.sql:121, 20260820000100_add_generation_budget_cap.sql:18)
--
-- 조치: 두 함수의 anon/authenticated EXECUTE 권한을 회수함. 검색 API는 이제
-- SUPABASE_SERVICE_ROLE_KEY로 이 두 함수만 호출하도록 바꿈(app/api/search/route.ts).
-- check_search_rate_limit은 그대로 anon 호출 유지 — 인자를 조작해도 자기 자신의
-- 요청 한도만 바뀔 뿐 다른 사용자·비용에 영향이 없어 위험도가 다름.

revoke execute on function upsert_search_cache(text, text, uuid[]) from anon, authenticated;
revoke execute on function check_generation_budget(text, int) from anon, authenticated;
