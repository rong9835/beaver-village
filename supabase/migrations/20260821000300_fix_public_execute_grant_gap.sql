-- 20260821000200의 구멍 수정: anon/authenticated에서만 EXECUTE를 revoke했는데,
-- Postgres는 함수 생성 시 기본적으로 PUBLIC(모든 롤이 암묵적으로 속한 의사 롤)에
-- EXECUTE를 자동으로 부여함. anon도 PUBLIC의 멤버라서, anon/authenticated에서만
-- revoke해도 PUBLIC에 남은 권한을 통해 여전히 직접 호출할 수 있었음.
-- (information_schema.routine_privileges로 확인함 — grantee=PUBLIC 행이 남아있었음)

revoke execute on function upsert_search_cache(text, text, uuid[]) from public;
revoke execute on function check_generation_budget(text, int) from public;

-- service_role은 PUBLIC과 무관하게 슈퍼유저급 롤이라 이 revoke의 영향을 받지 않음
-- (실제로도 information_schema에 grantee=service_role 행이 별도로 존재함).
