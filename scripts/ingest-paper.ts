// 논문 1편을 청크로 나누고 임베딩해서 DB에 넣는 관리자 전용 스크립트.
// 실행: npm run ingest -- <메타데이터 JSON 파일 경로>
// service_role 키를 쓰므로 로컬에서만 실행하고, 절대 app/ 아래에서 import하지 않는다.
import { readFile } from "node:fs/promises";
import { chunkText } from "../lib/rag/chunk";
import { embedText } from "../lib/rag/embed";
import { supabaseServiceClient } from "../lib/supabase/serviceClient";
import type { PaperLicense } from "../lib/types";

type PaperInput = {
  title: string;
  authors: string;
  publishYear: number | null;
  sourceUrl: string;
  license: PaperLicense;
  fullTextPath: string;
};

// Voyage AI 무료 계정(결제 수단 미등록)은 분당 3건으로 제한됨.
// 20초 간격이면 분당 3건 한도 안에 여유 있게 들어감.
const VOYAGE_FREE_TIER_DELAY_MS = 21000;

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function main() {
  const metadataPath = process.argv[2];
  if (!metadataPath) {
    throw new Error(
      "사용법: npm run ingest -- <논문 메타데이터 JSON 파일 경로>",
    );
  }

  const metadataRaw = await readFile(metadataPath, "utf-8");
  const paperInput: PaperInput = JSON.parse(metadataRaw);
  const fullText = await readFile(paperInput.fullTextPath, "utf-8");

  console.log(`[ingest] "${paperInput.title}" 논문 삽입 시작`);

  const { data: insertedPaper, error: paperInsertError } =
    await supabaseServiceClient
      .from("papers")
      .insert({
        title: paperInput.title,
        authors: paperInput.authors,
        publish_year: paperInput.publishYear,
        source_url: paperInput.sourceUrl,
        license: paperInput.license,
        full_text: fullText,
      })
      .select("id")
      .single();

  if (paperInsertError) {
    throw paperInsertError;
  }

  const paperId = insertedPaper.id;
  const chunks = chunkText(fullText);
  console.log(`[ingest] 청크 ${chunks.length}개로 분할됨`);

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    // Voyage AI 계정에 결제 수단이 없으면 분당 3건으로 제한됨.
    // 첫 청크에도 쉬어야, 이 스크립트를 여러 논문에 대해 연달아 실행할 때
    // 직전 논문의 마지막 호출과 이번 논문의 첫 호출이 같은 1분 윈도우에 걸려
    // 429가 나는 걸 막을 수 있음.
    await sleep(VOYAGE_FREE_TIER_DELAY_MS);

    const chunkContent = chunks[chunkIndex];
    const embedding = await embedText(chunkContent);

    const { error: chunkInsertError } = await supabaseServiceClient
      .from("paper_chunks")
      .insert({
        paper_id: paperId,
        chunk_index: chunkIndex,
        content: chunkContent,
        embedding,
      });

    if (chunkInsertError) {
      throw chunkInsertError;
    }

    console.log(`[ingest] 청크 ${chunkIndex + 1}/${chunks.length} 삽입 완료`);
  }

  console.log(`[ingest] "${paperInput.title}" 삽입 완료 (paper_id=${paperId})`);
}

main().catch((error) => {
  console.error("[ingest] 실패:", error);
  process.exit(1);
});
