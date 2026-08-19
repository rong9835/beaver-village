@AGENTS.md
# 비버마을

비버에 대한 궁금증을 논문 근거와 함께 제공하는 한국어 사이트.

## 문서
- docs/기획서_v1.1.md — 방향과 컨셉
- docs/PRD_v1.md — 1차 범위, 수용 기준
- docs/기능명세서_v1.md — 기능 25개 상세

## 스택
Next.js 15 (App Router) / TypeScript / Tailwind / Supabase / Vercel

## 작업 규칙
- 문서에 정의된 1차 범위만 구현할 것. 2차·3차 기능은 만들지 말 것
- 기능 구현 시 기능명세서의 기능 ID를 참조할 것
- 모든 입력 검증은 클라이언트·서버·DB 3중으로 구현할 것
- 목록·상세 화면은 로딩/정상/빈 상태/에러 4가지 상태를 모두 구현할 것
- 큰 작업을 시작하기 전에 계획을 먼저 보여주고 확인받을 것

## 코드 작성 규칙 (중요)

읽기 쉬운 코드를 최우선으로 한다. 짧은 코드보다 이해하기 쉬운 코드를 쓴다.

### 하지 말 것
- 옵셔널 체이닝·널병합·삼항연산자를 한 줄에 여러 개 연결하지 말 것
- 메서드 체이닝을 3개 이상 이어 붙이지 말 것 (`.filter().map().reduce()` 금지)
- 삼항연산자 중첩 금지. 조건이 2개 이상이면 if문으로 쓸 것
- 화살표 함수에서 암시적 return을 남용하지 말 것. 로직이 있으면 중괄호와 return을 명시할 것
- 한 줄에 여러 동작을 압축하지 말 것
- 축약된 변수명 금지 (`i`, `d`, `res`, `tmp` 등)

### 할 것
- 한 줄에는 한 가지 일만 할 것
- 중간 결과를 변수에 담아 이름을 붙일 것. 이름 자체가 설명이 되게 할 것
- 변수명은 축약하지 말고 풀어 쓸 것 (`item`, `response`, `articleList`)
- 조건문은 `if` / `else if` / `else`로 명시적으로 쓸 것
- 함수는 한 가지 일만 하게 만들고, 길어지면 나눌 것
- 주석은 한국어로 작성하고, "무엇을"이 아니라 "왜"를 설명할 것
- 초보자가 읽어도 흐름이 보이게 쓸 것

### 예시

```ts
// 나쁜 예
const names = users?.filter(u => u.active)?.map(u => u.name) ?? [];

// 좋은 예
const userList = users || [];

// 활성 상태인 사용자만 골라내기
const activeUsers = userList.filter((user) => {
  return user.active === true;
});

// 이름만 추출하기
const names = activeUsers.map((user) => {
  return user.name;
});
```