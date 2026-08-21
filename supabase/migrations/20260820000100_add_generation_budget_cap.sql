-- Voyage AI는 무료 토큰(2억 개)이 넉넉해서 정상 사용량으로는 과금까지 갈 일이
-- 거의 없지만, Claude(Anthropic) 쪽은 무료 티어 없이 호출마다 바로 과금됨.
-- Voyage 자체에는 "얼마 넘으면 자동 차단"하는 하드 리밋 기능이 없어서(이메일
-- 알림만 있음, 2026-08-20 확인), 버그나 악용으로 생성 호출이 폭주해도 비용이
-- 무한정 늘어나지 않도록 우리 쪽에서 자체적으로 월별 상한선을 둠.
-- 근거: docs/결정사항.md I

create table generation_budget_usage (
  month_key       text primary key, -- 'YYYY-MM' 형식
  generation_count int not null default 0
);

alter table generation_budget_usage enable row level security;
-- anon용 정책을 두지 않음: 직접 조회·조작 불가, 아래 함수로만 접근 가능.

-- 이번 달 생성 호출 횟수를 세고, 한도를 넘으면 false를 반환함(호출은 그대로 카운트됨).
-- 검사와 증가를 한 함수 안에서 원자적으로 처리해 동시 요청으로 인한 레이스 컨디션을 막음.
create function check_generation_budget(
  p_month_key text,
  p_max_generations int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count int;
begin
  insert into generation_budget_usage (month_key, generation_count)
    values (p_month_key, 1)
    on conflict (month_key)
    do update set generation_count = generation_budget_usage.generation_count + 1
    returning generation_count into v_new_count;

  return v_new_count <= p_max_generations;
end;
$$;

grant execute on function check_generation_budget(text, int) to anon, authenticated;
