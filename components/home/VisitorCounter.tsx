// 기능명세서 E-02(방문자 카운터). 실제로는 sessionStorage 기준으로 방문 시 증가시키는
// API(/api/visitors)를 붙여야 하는데, 아직 없어서 하드코딩된 숫자를 보여줌.
const PLACEHOLDER_VISITOR_COUNT = 1247;

export function VisitorCounter() {
  return (
    <div className="mt-8 border-t-2 border-dashed border-[#cbbfa3] pt-4 text-[21px] text-[#7a5a3a]">
      당신은{" "}
      <span className="text-[26px] font-bold text-[#e2703a]">
        {PLACEHOLDER_VISITOR_COUNT.toLocaleString()}
      </span>
      번째 마을 방문객입니다
    </div>
  );
}
