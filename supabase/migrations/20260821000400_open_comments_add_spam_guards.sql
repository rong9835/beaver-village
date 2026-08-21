-- 반응(comments) 정책 변경: 관리자 승인(D-05) 제거, 등록 즉시 공개로 전환.
-- 근거: 사용자 결정(2026-08-21) — 애초 기획 의도가 "누구나 와서 댓글 달고 공감할 수
-- 있는" 열린 반응이었는데, 기능명세서 D-05(승인 후 공개)가 그 의도와 어긋나 있었음.
-- 승인 절차를 빼는 대신, 도배 방지 장치(동일 내용 반복 차단·일일 총량 제한·금칙어
-- 필터)를 새로 둠. 금칙어 필터는 lib/comments/validateComment.ts(클라이언트·서버 공용)에서 처리함.

-- =========================================
-- comments: approved 컬럼 제거, 즉시 공개
-- =========================================
drop policy comments_insert_public on comments;
drop view comments_public;

alter table comments drop column approved;

create view comments_public as
  select id, target_type, target_id, content, created_at
  from comments;

grant select on comments_public to anon, authenticated;

-- 등록 자체는 그대로 전체 공개. 도배는 아래 레이트리밋·중복차단·일일 총량으로 막는다.
create policy comments_insert_public
  on comments
  for insert
  to anon, authenticated
  with check (true);

-- =========================================
-- 동일 내용 반복 차단: 같은 IP가 같은 대상에 같은 내용을 짧은 시간 안에 다시 올리는 것을 막음.
-- comments 테이블에는 anon용 SELECT 정책이 없으므로(뷰로만 조회) SECURITY DEFINER로 우회함.
-- 읽기만 하고 아무것도 바꾸지 않으며, 결과도 호출자 자신의 글 여부에만 좌우되므로
-- check_comment_rate_limit과 같은 수준으로 anon 호출을 허용해도 안전함.
-- =========================================
create function check_comment_duplicate(
  p_ip_hash text,
  p_target_type text,
  p_target_id uuid,
  p_content text,
  p_window_seconds int
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from comments
    where ip_hash = p_ip_hash
      and target_type = p_target_type
      and target_id is not distinct from p_target_id
      and trim(content) = trim(p_content)
      and created_at > now() - make_interval(secs => p_window_seconds)
  );
$$;

grant execute on function check_comment_duplicate(text, text, uuid, text, int) to anon, authenticated;

-- =========================================
-- 일일 총량 제한: 사이트 전체 반응 등록 수를 하루 단위로 제한하는 최후 안전장치.
-- generation_budget_usage/check_generation_budget(20260820000100)과 같은 패턴이지만,
-- 그 함수를 만들 때 실수를 하나 했었음: PUBLIC에게 자동으로 부여되는 기본 EXECUTE
-- 권한을 안 지우고 anon/authenticated에서만 revoke해서, anon이 PUBLIC 자격으로 계속
-- 직접 호출해 카운터를 소진시킬 수 있었음(20260821000300에서 뒤늦게 수정).
-- 여기서는 같은 실수를 반복하지 않도록 생성 직후 바로 PUBLIC 권한을 지운다.
-- =========================================
create table comment_daily_totals (
  day_key       text primary key, -- 'YYYY-MM-DD' (UTC)
  comment_count int not null default 0
);

alter table comment_daily_totals enable row level security;
-- anon용 정책을 두지 않음: 직접 조회·조작 불가, 아래 함수로만 접근 가능.

create function check_comment_daily_limit(
  p_day_key text,
  p_max_per_day int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count int;
begin
  insert into comment_daily_totals (day_key, comment_count)
    values (p_day_key, 1)
    on conflict (day_key)
    do update set comment_count = comment_daily_totals.comment_count + 1
    returning comment_count into v_new_count;

  return v_new_count <= p_max_per_day;
end;
$$;

-- 이 함수는 공유 카운터를 실제로 증가시키므로 anon/authenticated에게는 절대 권한을
-- 주지 않는다. 검색 API의 check_generation_budget과 같은 패턴으로,
-- app/api/comments/route.ts에서 SUPABASE_SERVICE_ROLE_KEY로만 호출한다.
revoke execute on function check_comment_daily_limit(text, int) from public;
