import Image from "next/image";

// 기능명세서 B-01(키워드 검색)은 아직 구현 전이라 /search 라우트가 없음.
// 폼 마크업만 최종 형태로 만들어두고, /search 페이지가 생기면 그대로 동작하게 함.
export function SearchBox() {
  return (
    <form action="/search" method="get" className="flex items-stretch gap-3.5">
      <input
        name="q"
        placeholder="여기에 질문을 적어주세요"
        className="min-w-0 flex-1 rounded-2xl border-[3px] border-[#33261a] bg-white px-[22px] py-[18px] font-[family-name:var(--font-gaegu)] text-2xl text-[#33261a] shadow-[5px_5px_0_#e8c9a0] outline-none"
      />
      <button
        type="submit"
        className="rounded-2xl border-[3px] border-[#33261a] bg-[#e2703a] px-[34px] font-[family-name:var(--font-gaegu)] text-2xl font-bold text-[#fff8ef] shadow-[5px_5px_0_#b04f22] hover:bg-[#cf5f2b]"
      >
        찾아보기
      </button>
      <div className="relative h-[64px] w-[64px] flex-none self-end animate-[bv-bob_3.2s_ease-in-out_infinite]">
        <Image
          src="/비버정면.png"
          alt="비버마을 마스코트"
          fill
          sizes="64px"
          className="object-contain"
        />
      </div>
    </form>
  );
}
