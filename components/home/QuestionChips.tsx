type QuestionChip = {
  label: string;
  rotationClassName: string;
};

// 기능명세서 B-02(추천 질문 칩). 지금은 하드코딩해두고, 나중에 실제로 많이 검색된
// 질문을 집계해서 보여주는 로직으로 교체해야 함.
const QUESTION_CHIPS: QuestionChip[] = [
  { label: "이빨이 왜 주황색?", rotationClassName: "rotate-[-1.5deg]" },
  { label: "댐은 왜 지을까?", rotationClassName: "rotate-[1deg]" },
  { label: "왜 뒤뚱거려?", rotationClassName: "rotate-[-0.5deg]" },
];

export function QuestionChips() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-[22px] sm:gap-3">
      <span className="text-[15px] text-[#8a7a63] sm:text-[19px]">이런 걸 많이 물어봐요 →</span>

      {QUESTION_CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          className={`rounded-full border-2 border-[#7a5a3a] bg-[#fdf1d8] px-3 py-1.5 text-[15px] text-[#4b3a28] hover:bg-[#f6e2b8] sm:px-4 sm:py-2 sm:text-[19px] ${chip.rotationClassName}`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
