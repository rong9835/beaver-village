import { SearchBox } from "@/components/home/SearchBox";
import { QuestionChips } from "@/components/home/QuestionChips";
import { TodayBeaverVideo } from "@/components/home/TodayBeaverVideo";
import { BeaverFact } from "@/components/home/BeaverFact";
import { VisitorCounter } from "@/components/home/VisitorCounter";
import { PageFrame } from "@/components/layout/PageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { NOTEBOOK_LINES_STYLE } from "@/lib/notebookTheme";
import { getLatestVideo } from "@/lib/videos";
import { getDailyBeaverFact } from "@/lib/rag/dailyFact";

// 오늘의 비버상식은 Claude 호출로 생성되는 부가 기능이라, 요청마다 다시 만들지 않고
// 하루에 한 번만 새로 만들어지도록(ISR) 함.
export const revalidate = 86400;

// 대문 화면. 기능명세서상 이 경로가 담당하는 기능은 B-02, C-04, E-01, E-02, E-03.
export default async function HomePage() {
  const [latestVideo, dailyFact] = await Promise.all([
    getLatestVideo(),
    getDailyBeaverFact(),
  ]);

  return (
    <PageFrame>
      <div
        className="flex h-full flex-col px-4 py-6 font-[family-name:var(--font-gaegu)] sm:px-8 sm:py-8 md:px-[54px] md:pt-9 md:pb-[34px]"
        style={NOTEBOOK_LINES_STYLE}
      >
        <PageHeader current="home" />

        <div className="my-5 h-1 bg-[#e8c9a0] sm:my-6" />

        <h1 className="mb-4 text-[30px] leading-[1.3] font-bold text-[#33261a] sm:mb-[26px] sm:text-[52px]">
          비버에 대해 궁금한 게 있으신가요?
        </h1>

        <SearchBox />

        <QuestionChips />

        <div className="mt-6 mb-5 h-1 bg-[#e8c9a0] sm:mt-[34px] sm:mb-6" />

        {/* 아래 두 섹션 + 방문자 카운터를 남은 세로 공간에 고르게 펼쳐서,
            위쪽만 빡빡하고 아래쪽만 텅 비는 걸 막음 */}
        <div className="flex flex-1 flex-col justify-between gap-8 sm:gap-0">
          <TodayBeaverVideo video={latestVideo} />

          <BeaverFact fact={dailyFact} />

          <VisitorCounter />
        </div>
      </div>
    </PageFrame>
  );
}
