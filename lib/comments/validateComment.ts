// 기능명세서 D-03: 클라이언트·서버 양쪽에서 같은 코드로 검사하려고 여기 한 곳에 둠.
// (DB는 길이·공백 CHECK 제약으로 최종 방어선 역할만 함 — 링크 도메인까지 DB
// 제약으로 강제하려면 정규식으로 본문 안 URL을 추출해야 해서 취약해지므로 뺌)

export const COMMENT_MIN_LENGTH = 1;
export const COMMENT_MAX_LENGTH = 30;

// 반응 안에 링크를 남길 수 있는 도메인 허용 목록.
const ALLOWED_LINK_DOMAINS = ["instagram.com", "youtube.com", "youtu.be"];

// 욕설·도배성 광고 키워드 금칙어 목록. 승인 절차 없이 즉시 공개되므로 마지막 방어선 역할을 함.
// 완벽한 목록이 아니라 자주 보이는 패턴 위주의 시작점 — 실제 운영하며 계속 채워야 함.
const BANNED_KEYWORDS = [
  "씨발",
  "씨발놈",
  "병신",
  "지랄",
  "개새끼",
  "좆",
  "닥쳐",
  "카지노",
  "도박",
  "먹튀",
  "대출",
  "비아그라",
  "성인용품",
  "무료체험",
  "토토사이트",
];

export type CommentValidationErrorCode =
  | "INVALID_INPUT"
  | "FORBIDDEN_DOMAIN"
  | "BANNED_KEYWORD";

export type CommentValidationResult =
  | { valid: true }
  | { valid: false; code: CommentValidationErrorCode; message: string };

export function validateComment(content: string): CommentValidationResult {
  if (content.length < COMMENT_MIN_LENGTH || content.length > COMMENT_MAX_LENGTH) {
    return {
      valid: false,
      code: "INVALID_INPUT",
      message: `${COMMENT_MAX_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  if (content.trim() === "") {
    return {
      valid: false,
      code: "INVALID_INPUT",
      message: "공백만 입력할 수는 없어요.",
    };
  }

  const forbiddenDomain = findForbiddenLinkDomain(content);
  if (forbiddenDomain) {
    return {
      valid: false,
      code: "FORBIDDEN_DOMAIN",
      message: "인스타그램·유튜브 링크만 남길 수 있어요.",
    };
  }

  if (containsBannedKeyword(content)) {
    return {
      valid: false,
      code: "BANNED_KEYWORD",
      message: "등록할 수 없는 표현이 포함되어 있어요.",
    };
  }

  return { valid: true };
}

function containsBannedKeyword(content: string): boolean {
  const lowerCaseContent = content.toLowerCase();

  return BANNED_KEYWORDS.some((keyword) => {
    return lowerCaseContent.includes(keyword.toLowerCase());
  });
}

// 본문에서 URL로 보이는 조각을 찾아, 그 도메인이 허용 목록에 없으면 그 도메인 문자열을 돌려줌.
function findForbiddenLinkDomain(content: string): string | null {
  const urlPattern = /https?:\/\/[^\s]+|(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi;
  const matches = content.match(urlPattern) ?? [];

  for (const match of matches) {
    const hostname = extractHostname(match);
    if (!hostname) {
      continue;
    }

    const isAllowed = ALLOWED_LINK_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) {
      return hostname;
    }
  }

  return null;
}

function extractHostname(urlLikeText: string): string | null {
  const withProtocol = urlLikeText.startsWith("http")
    ? urlLikeText
    : `https://${urlLikeText}`;

  try {
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return null;
  }
}
