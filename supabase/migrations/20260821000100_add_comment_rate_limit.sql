-- =========================================
-- comment_rate_limits: 반응 작성(D-04)의 IP 기준 요청 제한
-- =========================================
-- search_rate_limits(20260820000000_add_paper_search.sql)와 완전히 같은 패턴이지만,
-- 검색 레이트리밋과 버킷을 공유하면 검색을 많이 한 사람이 반응 작성까지 막히게 되므로
-- 별도 테이블·함수로 분리함.
create table comment_rate_limits (
  ip_hash        text primary key,
  window_start   timestamptz not null default now(),
  request_count  int not null default 0
);

alter table comment_rate_limits enable row level security;
-- anon용 정책을 두지 않음: 직접 조회·조작 불가, 아래 함수로만 접근 가능.

create function check_comment_rate_limit(
  p_ip_hash text,
  p_max_requests int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row comment_rate_limits;
  v_row_found boolean;
begin
  select * into v_row
    from comment_rate_limits
    where ip_hash = p_ip_hash
    for update;
  v_row_found := found;

  if not v_row_found then
    begin
      insert into comment_rate_limits (ip_hash, window_start, request_count)
        values (p_ip_hash, now(), 1);
      return true;
    exception when unique_violation then
      select * into v_row
        from comment_rate_limits
        where ip_hash = p_ip_hash
        for update;
    end;
  end if;

  if now() - v_row.window_start > make_interval(secs => p_window_seconds) then
    update comment_rate_limits
      set window_start = now(), request_count = 1
      where ip_hash = p_ip_hash;
    return true;
  end if;

  if v_row.request_count >= p_max_requests then
    return false;
  end if;

  update comment_rate_limits
    set request_count = request_count + 1
    where ip_hash = p_ip_hash;

  return true;
end;
$$;

grant execute on function check_comment_rate_limit(text, int, int) to anon, authenticated;
