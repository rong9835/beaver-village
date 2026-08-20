// 기능명세서 C-04(오늘의 비버, 대문에 최신 영상 1건 표시). 아직 영상 자동 수집(C-03)이
// 없으므로 하드코딩된 예시 영상 정보를 보여줌. 실제 영상 시스템이 생기면
// 최신 영상 1건을 조회해서 이 자리를 채우면 됨.
const PLACEHOLDER_VIDEO = {
  title: "앞니로 통나무를 갉는 4분.",
  description: "이빨 색이 왜 주황인지 여기서 눈으로 확인됩니다.",
  recordedAt: "2026. 8. 19. 기록",
};

export function TodayBeaverVideo() {
  return (
    <div className="flex items-start gap-[22px]">
      <div className="relative flex-none">
        <div className="absolute top-[-12px] left-1/2 z-10 h-[26px] w-[92px] -translate-x-1/2 rotate-[-4deg] border border-[rgba(160,130,80,.35)] bg-[rgba(226,199,140,.75)]" />

        <div className="h-[176px] w-[306px] rotate-[-1.2deg] overflow-hidden border-[7px] border-white shadow-[0_5px_14px_rgba(0,0,0,.15)]">
          <div className="flex h-full w-full items-center justify-center bg-[#e6ded0] text-[19px] text-[#a2957c]">
            영상 썸네일
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[rgba(51,38,26,.8)] pl-1 text-[22px] text-[#fff8ef]">
            ▶
          </div>
        </div>
      </div>

      <div>
        <div className="text-[26px] font-bold text-[#33261a]">오늘의 비버</div>
        <div className="mt-1.5 text-[21px] leading-[1.6] text-[#4b3a28]">
          {PLACEHOLDER_VIDEO.title}
          <br />
          {PLACEHOLDER_VIDEO.description}
        </div>
        <div className="mt-2.5 text-lg text-[#8a7a63]">{PLACEHOLDER_VIDEO.recordedAt}</div>
      </div>
    </div>
  );
}
