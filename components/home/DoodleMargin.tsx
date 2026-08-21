import { BeaverSprite, type BeaverSpriteKind } from "@/components/home/BeaverSprite";

type DoodleItem = {
  kind: BeaverSpriteKind;
  className: string;
};

// top은 %로 둬서 여백 칸의 실제 높이(본문 칸 높이에 맞춰 늘어남)에 상관없이
// 위부터 아래까지 고르게 흩뿌려지게 함.
const LEFT_MARGIN_DOODLES: DoodleItem[] = [
  { kind: "tree", className: "top-[4%] left-[100px] h-14 w-14 opacity-90" },
  { kind: "sit", className: "top-[15%] left-7 h-[60px] w-[60px] opacity-95 rotate-[-4deg]" },
  { kind: "log", className: "top-[26%] left-[110px] h-[70px] w-[70px] opacity-90 rotate-[6deg]" },
  { kind: "gnaw", className: "top-[38%] left-5 h-[66px] w-[90px] opacity-95" },
  { kind: "tree", className: "top-[50%] left-[118px] h-[50px] w-[50px] opacity-85" },
  { kind: "log", className: "top-[62%] left-[26px] h-16 w-16 opacity-85 rotate-[-8deg]" },
  { kind: "sit", className: "top-[74%] left-[104px] h-[58px] w-[58px] opacity-90 rotate-[3deg]" },
  { kind: "tree", className: "top-[86%] left-[22px] h-[46px] w-[46px] opacity-80" },
];

const RIGHT_MARGIN_DOODLES: DoodleItem[] = [
  { kind: "sit", className: "top-[6%] right-[34px] h-[58px] w-[58px] opacity-95 rotate-[5deg]" },
  { kind: "tree", className: "top-[18%] right-[118px] h-[54px] w-[54px] opacity-90" },
  { kind: "log", className: "top-[30%] right-6 h-[68px] w-[68px] opacity-90 rotate-[-5deg]" },
  { kind: "gnaw", className: "top-[42%] right-[100px] h-16 w-[86px] opacity-95" },
  { kind: "tree", className: "top-[54%] right-[30px] h-12 w-12 opacity-85" },
  { kind: "sit", className: "top-[66%] right-[112px] h-[54px] w-[54px] opacity-90 rotate-[-3deg]" },
  { kind: "log", className: "top-[78%] right-[22px] h-[60px] w-[60px] opacity-85 rotate-[7deg]" },
  { kind: "tree", className: "top-[90%] right-[106px] h-11 w-11 opacity-80" },
];

type DoodleMarginProps = {
  side: "left" | "right";
};

// 기능명세서 E-03(배경 이미지) 자리. 사진 대신, 참조용 비버 스프라이트를
// 여백 전체에 흩뿌려서 채움.
export function DoodleMargin({ side }: DoodleMarginProps) {
  const items = side === "left" ? LEFT_MARGIN_DOODLES : RIGHT_MARGIN_DOODLES;

  return (
    <div className="relative h-full bg-[#f7f0dd]">
      {items.map((item, index) => (
        <div key={index} className={`absolute ${item.className}`}>
          <BeaverSprite kind={item.kind} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
