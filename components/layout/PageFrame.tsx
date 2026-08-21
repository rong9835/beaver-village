import type { ReactNode } from "react";
import { CursorBeaver } from "@/components/home/CursorBeaver";
import { DoodleMargin } from "@/components/home/DoodleMargin";
import { DoodleStrip } from "@/components/home/DoodleStrip";

type PageFrameProps = {
  children: ReactNode;
};

// 공책 테마를 쓰는 모든 페이지(홈/검색/도서관/영상)가 공유하는 바깥 액자.
// 화면이 좁을 땐(모바일) 좌우 여백(DoodleMargin)을 보여줄 자리가 없어서
// DoodleStrip(가로 줄)으로 바꿔 본문 위/아래에 배치함 — md 이상에서만 원래대로
// 좌우 여백으로 돌아옴. 그리드 자동 배치를 이용해서 JS 분기 없이 CSS만으로 처리함:
// 모바일엔 보이는 자식이 3개(strip, content, strip)라 1열 그리드에 순서대로 쌓이고,
// md 이상엔 보이는 자식이 3개(margin, content, margin)라 3열 그리드에 나란히 놓임.
export function PageFrame({ children }: PageFrameProps) {
  return (
    <div className="flex justify-center bg-[#e7e4de] px-0 py-0 sm:min-h-full sm:flex-1 sm:px-4 sm:py-10">
      <CursorBeaver />

      {/* min-h-full/flex-1은 sm 이상에서만 적용함. 모바일까지 카드를 화면 높이만큼
          강제로 늘리면, 아래 grid가 auto 크기 3줄(상단 줄/본문/하단 줄)인데도
          align-content가 stretch처럼 동작해서 남는 공간이 줄 사이로 이상하게
          퍼져 들어감(상단 줄이 붕 뜨고 하단 줄이 안 붙어 보이는 원인이었음). */}
      <div className="grid w-full max-w-[1280px] grid-cols-1 content-start overflow-hidden border-[3px] border-[#cbbfa3] bg-[#fdf8ea] sm:rounded-[20px] md:grid-cols-[220px_1fr_220px] md:content-normal">
        <div className="md:hidden">
          <DoodleStrip />
        </div>

        <div className="hidden h-full md:block">
          <DoodleMargin side="left" />
        </div>

        {children}

        <div className="hidden h-full md:block">
          <DoodleMargin side="right" />
        </div>

        <div className="md:hidden">
          <DoodleStrip />
        </div>
      </div>
    </div>
  );
}
