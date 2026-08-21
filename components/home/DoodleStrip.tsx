import { BeaverSprite, type BeaverSpriteKind } from "@/components/home/BeaverSprite";

type StripDoodle = {
  kind: BeaverSpriteKind;
  rotateClassName: string;
};

const STRIP_DOODLES: StripDoodle[] = [
  { kind: "tree", rotateClassName: "" },
  { kind: "sit", rotateClassName: "rotate-[-4deg]" },
  { kind: "log", rotateClassName: "rotate-[6deg]" },
  { kind: "gnaw", rotateClassName: "" },
  { kind: "tree", rotateClassName: "rotate-[3deg]" },
  { kind: "sit", rotateClassName: "rotate-[-3deg]" },
];

// 좁은 화면에서는 좌우 여백(DoodleMargin)을 보여줄 자리가 없어서, 대신 본문
// 위/아래에 짧은 가로 줄로 같은 장식을 보여줌 (모바일에서만 렌더링됨, md 이상은
// PageFrame이 DoodleMargin을 씀).
export function DoodleStrip() {
  return (
    <div className="flex items-center justify-center gap-2.5 overflow-hidden bg-[#f7f0dd] px-3 py-2.5">
      {STRIP_DOODLES.map((item, index) => (
        <div
          key={index}
          className={`h-7 w-7 flex-none opacity-90 ${item.rotateClassName}`}
        >
          <BeaverSprite kind={item.kind} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
