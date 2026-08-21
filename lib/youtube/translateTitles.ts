import Anthropic from "@anthropic-ai/sdk";

const TRANSLATE_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `당신은 비버마을이라는 한국어 사이트에서 영어 유튜브 영상 제목을 한국어로 번역하는 도우미예요.
- 직역보다 자연스러운 한국어 표현을 우선하세요.
- 사람 이름, 비버 이름 같은 고유명사는 번역하지 말고 그대로 남겨주세요.
- 번역문 외의 설명이나 따옴표는 덧붙이지 마세요.`;

const SUBMIT_TRANSLATIONS_TOOL: Anthropic.Tool = {
  name: "submit_translations",
  description: "번역된 제목 목록을 원문과 같은 개수·순서로 제출합니다.",
  input_schema: {
    type: "object",
    properties: {
      translatedTitles: {
        type: "array",
        items: { type: "string" },
        description: "입력된 원문 제목과 같은 개수, 같은 순서의 한국어 번역",
      },
    },
    required: ["translatedTitles"],
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

// 기능명세서엔 없는 부가 기능. 영상 제목(영어)을 한국어로 번역해서 videos.title에
// 저장하기 위해 씀 — 원문은 videos.original_title에 따로 보존함.
export async function translateTitlesToKorean(
  originalTitles: string[],
): Promise<string[]> {
  if (originalTitles.length === 0) {
    return [];
  }

  const client = getAnthropicClient();
  const numberedTitles = originalTitles
    .map((title, index) => `${index + 1}. ${title}`)
    .join("\n");

  const message = await client.messages.create({
    model: TRANSLATE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [SUBMIT_TRANSLATIONS_TOOL],
    tool_choice: { type: "tool", name: "submit_translations" },
    messages: [{ role: "user", content: numberedTitles }],
  });

  const toolUseBlock = message.content.find((block) => block.type === "tool_use");
  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Claude 응답에서 submit_translations 호출을 찾지 못했습니다.");
  }

  const translationResult = toolUseBlock.input as { translatedTitles: string[] };

  if (translationResult.translatedTitles.length !== originalTitles.length) {
    throw new Error("번역된 제목 개수가 원문 개수와 달라요.");
  }

  return translationResult.translatedTitles;
}
