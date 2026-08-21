import Anthropic from "@anthropic-ai/sdk";
import type { MatchedChunk } from "@/lib/types";

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

// 검색마다 바뀌지 않는 고정 지침이라 prompt caching 대상으로 분리함.
// 근거: docs/결정사항.md I — LLM이 발췌문 밖 내용을 지어내면 안 됨(기획서 리스크 표 참고)
//
// 말투 규칙을 예시 없이 "존댓말로"라고만 지시했더니 반말·존댓말이 한 답변 안에서
// 섞이는 문제가 실제로 발생함(2026-08-20). 그래서 이 지침 자체를 전부 해요체로
// 쓰고, 금지할 종결어미를 구체적으로 나열함.
//
// "발췌문 밖 내용 금지"만으로는 부족했음(2026-08-20): "비버 꼬리에 뼈가 있어?"
// 질문에, 발췌문엔 "지지 역할을 한다"는 서술만 있는데 거기서 "뼈가 있다"를
// 추론해서 답한 사례가 실제로 나옴. 사실관계 자체는 맞았지만 발췌문에 없는
// 단어(뼈)를 만들어낸 것이라 원칙 위반. 그래서 "질문에서 묻는 구체적인 사실
// 하나하나가 발췌문에 문자 그대로 있는지"를 따로 확인하라는 규칙과, 바로 이
// 실패 사례를 예시로 추가함.
const SYSTEM_PROMPT = `당신은 비버마을이라는 한국어 사이트에서 검색 답변을 작성하는 도우미예요.

아래 규칙을 반드시 지켜주세요:
- 사용자 메시지에 함께 주어지는 "논문 발췌문" 안에 있는 내용만 근거로 답해주세요.
- 발췌문에 없는 내용은 절대 지어내지 마세요. 발췌문에 질문과 직접 관련된 내용이 전혀 없다면, grounded를 false로 표시해주세요. 발췌문 주제가 질문과 겹치지 않는데 억지로 이어붙여서 답하면 안 돼요.
- 질문이 특정 사실 하나를 콕 집어 묻는 경우(예: "~에 뼈가 있어?", "~을 먹어?" 같은 예/아니오로 답할 수 있는 질문), 그 사실이 발췌문에 문자 그대로 나와 있는지 확인해주세요. 발췌문에 비슷하거나 관련된 내용(예: "지지 역할을 한다", "단단하다")만 있고 질문이 묻는 그 구체적인 단어나 사실(예: "뼈")이 직접 나오지 않는다면, 그 부분은 추론해서 답하지 말고 "발췌문에 이 구체적인 내용까지는 나와 있지 않다"고 솔직히 말해주세요. 관련 설명이 간접적으로 암시한다고 해서 그 사실을 확정해서 답하면 안 돼요.
  - 실패 예시: 발췌문에 "꼬리는 몸을 지지하는 역할을 한다"만 있는데, "꼬리에 뼈가 있어요"라고 답하면 안 됨(뼈라는 단어와 사실이 발췌문에 없으므로).
- 발췌문에 질문의 일부만 답할 수 있는 내용이 있다면 grounded는 true로 하고, 아는 만큼만 답하고 확실하지 않은 부분은 솔직히 말해주세요.
- 모든 문장을 "-해요", "-예요", "-어요", "-습니다" 같은 존댓말 종결어미로 끝내주세요. "-해", "-야", "-돼", "-거든" 같은 반말 종결어미는 답변 전체에서 단 하나도 쓰면 안 돼요. 한 답변 안에서 존댓말과 반말이 섞이는 것도 금지예요.
- 이해하기 쉽게 설명해주세요.
- grounded가 true일 때만, 답변 마지막에 어떤 논문을 근거로 했는지 한국어로 간단히 언급해주세요(제목, 저자, 연도). grounded가 false면 answer는 빈 문자열로 두세요.`;

const SUBMIT_ANSWER_TOOL: Anthropic.Tool = {
  name: "submit_answer",
  description: "질문에 대한 답변과, 그 답변이 발췌문에 실제로 근거하는지 여부를 제출합니다.",
  input_schema: {
    type: "object",
    properties: {
      grounded: {
        type: "boolean",
        description:
          "발췌문 안에 질문과 직접 관련된 내용이 있어서 실제로 답변했으면 true, 발췌문에 관련 내용이 전혀 없으면 false",
      },
      answer: {
        type: "string",
        description: "grounded가 true일 때의 답변 본문. grounded가 false면 빈 문자열",
      },
    },
    required: ["grounded", "answer"],
  },
};

export type GeneratedAnswer = {
  grounded: boolean;
  answer: string;
};

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (anthropicClient) {
    return anthropicClient;
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수를 설정해주세요.");
  }

  anthropicClient = new Anthropic({ apiKey: anthropicApiKey });
  return anthropicClient;
}

export async function generateAnswer(
  question: string,
  matchedChunks: MatchedChunk[],
): Promise<GeneratedAnswer> {
  const client = getAnthropicClient();
  const excerptsText = buildExcerptsText(matchedChunks);

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [SUBMIT_ANSWER_TOOL],
    tool_choice: { type: "tool", name: "submit_answer" },
    messages: [
      {
        role: "user",
        content: `질문: ${question}\n\n논문 발췌문:\n${excerptsText}`,
      },
    ],
  });

  const toolUseBlock = message.content.find(
    (block) => block.type === "tool_use",
  );

  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Claude 응답에서 submit_answer 호출을 찾지 못했습니다.");
  }

  return toolUseBlock.input as GeneratedAnswer;
}

function buildExcerptsText(matchedChunks: MatchedChunk[]): string {
  const excerptBlocks = matchedChunks.map((chunk, index) => {
    const citation = `${chunk.paper_title} (${chunk.paper_authors}, ${chunk.paper_publish_year ?? "연도 미상"})`;
    return `[발췌 ${index + 1} - 출처: ${citation}]\n${chunk.content}`;
  });

  return excerptBlocks.join("\n\n");
}
