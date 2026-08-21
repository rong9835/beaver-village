import Anthropic from "@anthropic-ai/sdk";

const FACT_MODEL = "claude-haiku-4-5-20251001";

// 검색 답변(generateAnswer.ts)과 같은 원칙: 발췌문 밖 내용은 절대 지어내지 않음.
const SYSTEM_PROMPT = `당신은 비버마을이라는 한국어 사이트에서 "오늘의 비버상식" 한 줄을 쓰는 도우미예요.

아래 규칙을 반드시 지켜주세요:
- 사용자 메시지로 주어지는 "논문 발췌문" 안에 있는 내용만 근거로 써주세요. 발췌문에 없는 내용은 절대 지어내지 마세요.
- 친구가 신기한 사실을 알려주듯 짧고 친근하게 1~2문장으로 써주세요. 80자를 넘기지 마세요.
- 모든 문장을 "-해요", "-예요", "-어요", "-습니다" 같은 존댓말 종결어미로 끝내주세요. 반말 종결어미는 쓰지 마세요.`;

const SUBMIT_FACT_TOOL: Anthropic.Tool = {
  name: "submit_fact",
  description: "오늘의 비버상식 한 줄을 제출합니다.",
  input_schema: {
    type: "object",
    properties: {
      fact: {
        type: "string",
        description: "발췌문에 근거한 80자 이내의 한국어 상식 문장",
      },
    },
    required: ["fact"],
  },
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

// 기능명세서엔 없는 부가 기능. 대문을 덜 허전하게 만들려고 논문 발췌문 하나를 골라
// 그 안 내용만으로 짧은 상식 한 줄을 생성함 — 검색 답변과 같은 "근거 밖 금지" 원칙을 씀.
export async function generateDailyFactText(chunkContent: string): Promise<string> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: FACT_MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: [SUBMIT_FACT_TOOL],
    tool_choice: { type: "tool", name: "submit_fact" },
    messages: [
      {
        role: "user",
        content: `논문 발췌문:\n${chunkContent}`,
      },
    ],
  });

  const toolUseBlock = message.content.find((block) => block.type === "tool_use");
  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Claude 응답에서 submit_fact 호출을 찾지 못했습니다.");
  }

  const factResult = toolUseBlock.input as { fact: string };
  return factResult.fact;
}
