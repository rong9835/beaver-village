// Voyage AI 임베딩 호출. 호출처가 이 파일 하나뿐이라 SDK 없이 fetch로 직접 부름.
// 근거: docs/결정사항.md I
const VOYAGE_EMBEDDINGS_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";

type VoyageEmbeddingsResponse = {
  data: Array<{ embedding: number[] }>;
};

export async function embedText(text: string): Promise<number[]> {
  const voyageApiKey = process.env.VOYAGE_API_KEY;

  if (!voyageApiKey) {
    throw new Error("VOYAGE_API_KEY 환경변수를 설정해주세요.");
  }

  const response = await fetch(VOYAGE_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${voyageApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text],
      model: VOYAGE_MODEL,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Voyage 임베딩 호출 실패 (${response.status}): ${errorBody}`,
    );
  }

  const responseBody: VoyageEmbeddingsResponse = await response.json();
  return responseBody.data[0].embedding;
}
