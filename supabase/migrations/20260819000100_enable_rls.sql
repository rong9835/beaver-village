-- 비버마을 1차 RLS 정책
-- 근거: docs/결정사항.md
--
-- 원칙: ADMIN(운영자)은 Supabase 대시보드에서 service_role/postgres로 접속하며,
-- 이 두 역할은 RLS를 우회한다. 따라서 ADMIN을 대상으로 한 정책은 별도로 만들지 않는다.

-- =========================================
-- articles
-- =========================================
alter table articles enable row level security;

-- 방문자는 발행된 콘텐츠만 조회 가능. 등록·수정은 대시보드(관리자)에서만 이루어지므로 쓰기 정책은 없음.
create policy articles_select_published
  on articles
  for select
  to anon, authenticated
  using (published = true);

-- =========================================
-- videos
-- =========================================
alter table videos enable row level security;

-- 영상 목록은 전체 공개. 등록은 Cron(service_role)만 수행하므로 쓰기 정책은 없음.
create policy videos_select_all
  on videos
  for select
  to anon, authenticated
  using (true);

-- =========================================
-- comments
-- =========================================
alter table comments enable row level security;

-- 방문자는 반응을 등록할 수 있으나, approved를 true로 조작해 즉시 노출시키는 것은 막는다.
create policy comments_insert_public
  on comments
  for insert
  to anon, authenticated
  with check (approved = false);

-- comments 테이블에는 SELECT 정책을 두지 않는다.
-- 공개 조회는 comments_public 뷰로만 이루어지며, 이 뷰는 ip_hash를 노출하지 않는다.
grant select on comments_public to anon, authenticated;

-- =========================================
-- visitors
-- =========================================
alter table visitors enable row level security;

-- 카운터 조회는 전체 공개. 증가는 increment_visitor_count() 함수(SECURITY DEFINER)로만 가능하며,
-- anon에게 직접 UPDATE 권한을 주지 않아 임의 조작을 막는다.
create policy visitors_select_all
  on visitors
  for select
  to anon, authenticated
  using (true);

grant execute on function increment_visitor_count() to anon, authenticated;
