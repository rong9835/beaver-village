import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/layout/SiteNav";

type PageHeaderProps = {
  current: "home" | "library" | "videos" | "search";
};

// 공책 테마 페이지들이 공유하는 로고+제목+네비게이션 줄. 좁은 화면에서는 로고·글자를
// 줄이고, 필요하면 네비게이션이 다음 줄로 넘어가게 함(flex-wrap).
export function PageHeader({ current }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2">
      <Link href="/" className="flex w-fit items-center gap-2.5 sm:gap-3.5">
        <div className="relative h-[52px] w-[52px] flex-none sm:h-[84px] sm:w-[84px]">
          <Image
            src="/비버정면.png"
            alt="비버마을 로고"
            fill
            sizes="84px"
            className="object-contain"
          />
        </div>
        <div className="text-[26px] leading-none font-bold text-[#4b3a28] sm:text-[42px]">
          비버마을
        </div>
      </Link>

      <SiteNav current={current} />
    </div>
  );
}
