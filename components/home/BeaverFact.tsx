import type { DailyBeaverFact } from "@/lib/rag/dailyFact";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";
import { UNSPLASH_HOME_URL } from "@/lib/unsplash";

type BeaverFactProps = {
  fact: DailyBeaverFact | null;
};

// 기능명세서엔 없는 부가 기능. "오늘의 비버"와 같은 시각적 무게로 맞춘 상식 카드.
export function BeaverFact({ fact }: BeaverFactProps) {
  if (!fact) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-[22px]">
      <div className="relative flex-none self-center sm:self-auto">
        <div className="absolute top-[-12px] left-1/2 z-10 h-[26px] w-[92px] -translate-x-1/2 rotate-[3deg] border border-[rgba(160,130,80,.35)] bg-[rgba(226,199,140,.75)]" />

        <div className="h-[140px] w-[140px] rotate-[1.5deg] overflow-hidden border-[7px] border-white bg-[#fdf1d8] shadow-[0_5px_14px_rgba(0,0,0,.15)] sm:h-[176px] sm:w-[176px]">
          {fact.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fact.photo.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-[64px]">🦫</span>
            </div>
          )}
        </div>

        {fact.photo && (
          <p
            className="mt-1.5 text-center text-[11px] text-[#a89a82]"
            style={READABLE_BODY_STYLE}
          >
            사진:{" "}
            <a
              href={fact.photo.photographerProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#8a7a63]"
            >
              {fact.photo.photographerName}
            </a>{" "}
            /{" "}
            <a
              href={UNSPLASH_HOME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#8a7a63]"
            >
              Unsplash
            </a>
          </p>
        )}
      </div>

      <div>
        <div className="text-[22px] font-bold text-[#33261a] sm:text-[26px]">
          오늘의 비버상식
        </div>
        <p
          className="mt-1.5 text-[17px] leading-[1.6] text-[#4b3a28] sm:text-[19px]"
          style={READABLE_BODY_STYLE}
        >
          {fact.fact}
        </p>
        <p className="mt-2.5 text-[14px] text-[#8a7a63] sm:text-[15px]" style={READABLE_BODY_STYLE}>
          출처:{" "}
          <a
            href={fact.paperSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c2571f] underline hover:text-[#a5481a]"
          >
            {fact.paperTitle}
          </a>{" "}
          ({fact.paperAuthors}
          {fact.paperYear !== null ? `, ${fact.paperYear}` : ""})
        </p>
      </div>
    </div>
  );
}
