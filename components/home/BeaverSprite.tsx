import Image from "next/image";

export type BeaverSpriteKind = "sit" | "gnaw" | "log" | "tree";

// public/doodles/*.png는 참조용 스프라이트 시트(public/beaver-reference.png)에서
// 칸 하나씩 잘라내고 배경을 투명하게 처리해둔 파일임.
const SPRITE_SRC: Record<BeaverSpriteKind, string> = {
  sit: "/doodles/sit.png",
  gnaw: "/doodles/gnaw.png",
  log: "/doodles/log.png",
  tree: "/doodles/tree.png",
};

type BeaverSpriteProps = {
  kind: BeaverSpriteKind;
  className?: string;
};

// object-contain으로 비율을 유지한 채 표시해서, 박스가 정사각형이 아니어도
// 그림이 눌리거나 찌그러지지 않게 함.
export function BeaverSprite({ kind, className }: BeaverSpriteProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Image
        src={SPRITE_SRC[kind]}
        alt=""
        fill
        sizes="120px"
        className="object-contain"
      />
    </div>
  );
}
