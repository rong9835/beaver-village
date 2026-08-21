import type { Metadata } from "next";

// 기능명세서 B-01: 검색 결과는 CSR + noindex.
// app/search/page.tsx는 Client Component라 metadata를 직접 export할 수 없어서
// 이 서버 레이아웃에서 대신 지정함.
export const metadata: Metadata = {
  title: "검색 - 비버마을",
  robots: { index: false },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
