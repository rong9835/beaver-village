import ReactMarkdown from "react-markdown";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";

type ArticleBodyProps = {
  content: string;
};

// 본문(마크다운) 렌더링만 담당. 데이터 조회는 상위 페이지에서 이미 끝난 상태로 받음.
export function ArticleBody({ content }: ArticleBodyProps) {
  // @tailwindcss/typography 플러그인을 추가하지 않았으므로 prose 클래스 대신
  // 마크다운이 생성하는 태그에 직접 여백을 지정함.
  return (
    <div
      className="max-w-none text-[18px] leading-8 text-[#33261a] [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-[#4b3a28] [&>p]:mb-4"
      style={READABLE_BODY_STYLE}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
