import Link from "next/link";

type NavKey = "home" | "library" | "videos" | "search";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "홈", href: "/" },
  { key: "library", label: "도서관", href: "/library" },
  { key: "videos", label: "영상", href: "/videos" },
  { key: "search", label: "검색", href: "/search" },
];

type SiteNavProps = {
  current: NavKey;
};

// 대문·검색 결과 화면(공책 테마)에서 쓰는 페이지 이동 메뉴.
// 다른 곳에서 쓰는 알약 버튼(QuestionChips, 카테고리 필터)과 같은 스타일로 맞춰서
// 눈에 잘 띄게 함 — 글자만 있던 예전 버전은 배경색이 없어 존재감이 약했음.
export function SiteNav({ current }: SiteNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
      {NAV_ITEMS.map((item) => {
        const isCurrentPage = item.key === current;

        if (isCurrentPage) {
          return (
            <span
              key={item.key}
              className="rounded-full border-2 border-[#33261a] bg-[#e2703a] px-3 py-[5px] text-[15px] font-bold text-[#fff8ef] sm:px-4 sm:py-[7px] sm:text-[18px]"
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-full border-2 border-[#7a5a3a] bg-[#fdf1d8] px-3 py-[5px] text-[15px] text-[#4b3a28] hover:bg-[#f6e2b8] sm:px-4 sm:py-[7px] sm:text-[18px]"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
