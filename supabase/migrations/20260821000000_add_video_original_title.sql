-- 영상 자동 수집(C-03)이 제목을 한국어로 번역해서 videos.title에 저장하기로 하면서,
-- 원문(영어) 제목을 보존해둘 컬럼이 필요해짐. anon 조회 정책(videos_select_all)은
-- select(*)라 컬럼 추가만으로 바로 노출되고, 별도 RLS 변경은 필요 없음.
alter table videos add column original_title text;
