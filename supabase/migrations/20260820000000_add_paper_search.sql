-- 검색(B-01/B-03)을 RAG로 구현하기 위한 2차 스키마 추가.
-- 근거: docs/결정사항.md I. 1차 계획(20260819000000_init_schema.sql 헤더 주석)에서
-- "pgvector·embedding은 2차"라고 미뤘던 부분을 사용자 결정으로 앞당겨 도입함.

-- =========================================
-- papers / paper_chunks: 논문 원문을 청크 단위로 저장하고 임베딩으로 검색함
-- =========================================
create extension if not exists vector with schema extensions;

create table papers (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  authors       text not null,
  publish_year  int,
  source_url    text not null,
  license       text not null,
  full_text     text not null,
  created_at    timestamptz not null default now(),

  -- 저작권상 원문 재게시가 허용되는 자료만 수집 대상으로 삼음(결정 I)
  constraint papers_license_check
    check (license in ('CC-BY', 'CC-BY-SA', 'public-domain', 'PMC-OA'))
);

create table paper_chunks (
  id            uuid primary key default gen_random_uuid(),
  paper_id      uuid not null references papers(id) on delete cascade,
  chunk_index   int not null,
  content       text not null,
  embedding     extensions.vector(512) not null, -- voyage-3-lite 임베딩 차원
  created_at    timestamptz not null default now(),

  constraint paper_chunks_paper_chunk_index_unique
    unique (paper_id, chunk_index)
);

-- 코사인 유사도 검색용 인덱스. 논문 수십 편 규모라 ivfflat의 lists 튜닝이 필요 없는
-- HNSW를 선택함(적재 직후에도 별도 ANALYZE 없이 바로 좋은 재현율을 냄).
create index paper_chunks_embedding_idx
  on paper_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- 질문 임베딩과 가장 가까운 청크를 출처 메타데이터와 함께 반환함.
-- anon이 이미 select 가능한 테이블만 읽으므로 security invoker(기본값)로 충분함.
create function match_paper_chunks(
  query_embedding extensions.vector(512),
  match_count int,
  similarity_threshold float
)
returns table (
  chunk_id uuid,
  content text,
  similarity float,
  paper_id uuid,
  paper_title text,
  paper_authors text,
  paper_publish_year int,
  paper_source_url text
)
language sql
stable
set search_path = public, extensions
as $$
  select
    paper_chunks.id as chunk_id,
    paper_chunks.content,
    1 - (paper_chunks.embedding <=> query_embedding) as similarity,
    papers.id as paper_id,
    papers.title as paper_title,
    papers.authors as paper_authors,
    papers.publish_year as paper_publish_year,
    papers.source_url as paper_source_url
  from paper_chunks
  join papers on papers.id = paper_chunks.paper_id
  where 1 - (paper_chunks.embedding <=> query_embedding) > similarity_threshold
  order by paper_chunks.embedding <=> query_embedding
  limit match_count;
$$;

alter table papers enable row level security;
alter table paper_chunks enable row level security;

-- 논문·청크 조회는 전체 공개. 삽입은 논문 수집 스크립트(service_role)만 수행하므로
-- 쓰기 정책은 두지 않음(videos_select_all과 동일한 패턴).
create policy papers_select_all
  on papers
  for select
  to anon, authenticated
  using (true);

create policy paper_chunks_select_all
  on paper_chunks
  for select
  to anon, authenticated
  using (true);

grant execute on function match_paper_chunks(extensions.vector, int, float) to anon, authenticated;

-- =========================================
-- search_cache: 동일 질문 재검색 시 임베딩·생성 API를 다시 부르지 않기 위한 캐시
-- =========================================
create table search_cache (
  id               uuid primary key default gen_random_uuid(),
  normalized_query text not null unique,
  answer           text not null,
  paper_ids        uuid[] not null default '{}',
  hit_count        int not null default 1,
  created_at       timestamptz not null default now()
);

alter table search_cache enable row level security;

create policy search_cache_select_all
  on search_cache
  for select
  to anon, authenticated
  using (true);

-- anon에게 직접 INSERT/UPDATE 권한을 주지 않고, 아래 함수로만 쓰게 함.
-- 직접 쓰기를 허용하면 누구나 임의의 "캐시된 답변"을 조작해 넣을 수 있음(캐시 오염).
create function upsert_search_cache(
  p_normalized_query text,
  p_answer text,
  p_paper_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into search_cache (normalized_query, answer, paper_ids)
  values (p_normalized_query, p_answer, p_paper_ids)
  on conflict (normalized_query)
  do update set hit_count = search_cache.hit_count + 1;
end;
$$;

grant execute on function upsert_search_cache(text, text, uuid[]) to anon, authenticated;

-- =========================================
-- search_rate_limits: 검색 API의 IP 기준 요청 제한
-- =========================================
create table search_rate_limits (
  ip_hash        text primary key,
  window_start   timestamptz not null default now(),
  request_count  int not null default 0
);

alter table search_rate_limits enable row level security;
-- anon용 정책을 두지 않음: 직접 조회·조작 불가, 아래 함수로만 접근 가능.

-- 현재 시간 창(window_seconds) 안에서 요청 횟수를 세고, 한도를 넘으면 false를 반환함.
-- 창이 지났으면 카운트를 리셋함. 검사와 증가를 한 함수 안에서 원자적으로 처리해
-- 동시 요청으로 인한 레이스 컨디션을 막음.
create function check_search_rate_limit(
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
  v_row search_rate_limits;
  v_row_found boolean;
begin
  -- 같은 ip_hash 행을 잠가서, 동시에 들어온 요청끼리 카운트가 꼬이지 않게 함.
  select * into v_row
    from search_rate_limits
    where ip_hash = p_ip_hash
    for update;
  v_row_found := found;

  if not v_row_found then
    begin
      insert into search_rate_limits (ip_hash, window_start, request_count)
        values (p_ip_hash, now(), 1);
      -- 이 요청이 이 ip_hash의 첫 요청으로 새로 행을 만들었으므로 그대로 허용.
      return true;
    exception when unique_violation then
      -- 동시에 들어온 다른 요청이 먼저 삽입한 경우. 그 행을 다시 잠그고 이어감.
      select * into v_row
        from search_rate_limits
        where ip_hash = p_ip_hash
        for update;
    end;
  end if;

  if now() - v_row.window_start > make_interval(secs => p_window_seconds) then
    update search_rate_limits
      set window_start = now(), request_count = 1
      where ip_hash = p_ip_hash;
    return true;
  end if;

  if v_row.request_count >= p_max_requests then
    return false;
  end if;

  update search_rate_limits
    set request_count = request_count + 1
    where ip_hash = p_ip_hash;

  return true;
end;
$$;

grant execute on function check_search_rate_limit(text, int, int) to anon, authenticated;
