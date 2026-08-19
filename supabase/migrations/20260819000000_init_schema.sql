-- 비버마을 1차 스키마
-- 근거: docs/비버마을_기획서_v1.1.md 6장, docs/비버마을_PRD_v1.md 8장, docs/결정사항.md
-- 1차 범위 밖(pgvector, embedding, unanswered_questions)은 포함하지 않음 — 2차에서 별도 마이그레이션으로 추가

-- =========================================
-- articles: 마을 도서관 콘텐츠
-- =========================================
create table articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  category        text not null,
  question        text not null,
  content         text not null,
  summary         text,
  source_title    text,
  source_author   text,
  source_year     int,
  source_url      text,
  -- videos 테이블을 참조하는 FK가 아님.
  -- 큐레이션 채널에 없는 영상도 콘텐츠에 자유롭게 붙일 수 있어야 하므로 유튜브 영상 ID를 그대로 저장함.
  youtube_video_id text,
  published       boolean not null default false,
  created_at      timestamptz not null default now(),

  constraint articles_category_check
    check (category in ('body', 'behavior', 'ecology', 'human')),

  -- 1차에는 콘텐츠 등록 API가 없어 Supabase 대시보드에서 직접 입력함.
  -- 애플리케이션 서버 레이어가 없으므로 slug 형식 검증은 이 CHECK 제약이 유일한 방어선임.
  constraint articles_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on column articles.youtube_video_id is
  '유튜브 영상 ID(FK 아님). videos 테이블 수집분 밖의 영상도 자유롭게 지정 가능';

-- =========================================
-- videos: 큐레이션 채널에서 자동 수집한 영상
-- =========================================
create table videos (
  id           uuid primary key default gen_random_uuid(),
  youtube_id   text not null unique,
  title        text not null,
  thumbnail    text,
  channel_name text,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

-- =========================================
-- comments: 익명 반응 (콘텐츠 / 영상 / 마을회관)
-- =========================================
create table comments (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id   uuid,
  content     text not null,
  approved    boolean not null default false,
  -- 원본 IP는 저장하지 않고 해시만 저장함. 레이트 리밋 판정에는 해시로 충분함.
  ip_hash     text,
  created_at  timestamptz not null default now(),

  constraint comments_target_type_check
    check (target_type in ('article', 'video', 'guestbook')),

  -- 마을회관(guestbook) 반응은 특정 대상이 없으므로 target_id가 비어 있어야 하고,
  -- 콘텐츠·영상 반응은 반드시 대상을 가리켜야 함.
  constraint comments_target_id_consistency_check
    check (
      (target_type = 'guestbook' and target_id is null)
      or (target_type <> 'guestbook' and target_id is not null)
    ),

  -- 클라이언트·서버 검증이 우회되더라도 DB가 최종 방어선이 되도록 길이·공백 규칙을 강제함.
  constraint comments_content_length_check
    check (char_length(content) between 1 and 30),
  constraint comments_content_not_blank_check
    check (trim(content) <> '')
);

-- 공개 조회용 뷰: ip_hash를 노출하지 않고 승인된 반응만 보여줌.
-- 뷰는 소유자(테이블 소유자) 권한으로 실행되므로, comments 테이블에 anon SELECT 정책이 없어도 이 뷰를 통해서만 조회를 허용할 수 있음.
create view comments_public as
  select id, target_type, target_id, content, approved, created_at
  from comments
  where approved = true;

-- =========================================
-- visitors: 방문자 카운터 (단일 행)
-- 근거: docs/비버마을_기획서_v1.1.md 6-1
-- =========================================
create table visitors (
  id    int primary key default 1,
  count bigint not null default 0
);

insert into visitors (id, count) values (1, 0);

-- 방문자 수 증가 전용 함수.
-- anon에게 visitors 테이블 UPDATE 권한을 직접 주지 않고, 이 함수(SECURITY DEFINER)로만 증가를 허용함.
create function increment_visitor_count()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  update visitors
  set count = count + 1
  where id = 1
  returning count into new_count;

  return new_count;
end;
$$;
