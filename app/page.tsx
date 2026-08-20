import { CursorBeaver } from "@/components/home/CursorBeaver";
import { DoodleMargin } from "@/components/home/DoodleMargin";
import { SearchBox } from "@/components/home/SearchBox";
import { QuestionChips } from "@/components/home/QuestionChips";
import { TodayBeaverVideo } from "@/components/home/TodayBeaverVideo";
import { VisitorCounter } from "@/components/home/VisitorCounter";

// 대문 화면. 기능명세서상 이 경로가 담당하는 기능은 B-02, C-04, E-01, E-02, E-03.
export default function HomePage() {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-[#e7e4de] px-4 py-10">
      <CursorBeaver />

      <div className="grid w-[1280px] max-w-full grid-cols-[220px_1fr_220px] overflow-hidden rounded-[20px] border-[3px] border-[#cbbfa3] bg-[#fdf8ea]">
        <DoodleMargin side="left" />

        <div
          className="px-[54px] pt-9 pb-[34px] font-[family-name:var(--font-gaegu)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 37px, #dfe6ea 37px 38px)",
            backgroundPosition: "0 60px",
          }}
        >
          <div className="flex items-end gap-3.5">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-[#7a5a3a] bg-[#f2ead4] text-[28px] font-bold text-[#7a5a3a]">
              비
            </div>
            <div>
              <div className="text-[42px] leading-none font-bold text-[#4b3a28]">
                비버마을
              </div>
              <div className="text-[19px] text-[#8a7a63]">
                비버 좋아하는 사람이 혼자 쓰는 자료 공책
              </div>
            </div>
          </div>

          <div className="my-6 h-1 bg-[#e8c9a0]" />

          <h1 className="mb-2.5 text-[52px] leading-[1.3] font-bold text-[#33261a]">
            비버에 대해 궁금한 게 있으신가요?
          </h1>
          <p className="mb-[26px] text-[21px] text-[#8a7a63]">
            질문을 적으면, 논문에서 찾은 답을 옮겨 적어 드립니다.
          </p>

          <SearchBox />

          <QuestionChips />

          <div className="mt-[34px] mb-6 h-1 bg-[#e8c9a0]" />

          <TodayBeaverVideo />

          <VisitorCounter />
        </div>

        <DoodleMargin side="right" />
      </div>
    </div>
  );
}
