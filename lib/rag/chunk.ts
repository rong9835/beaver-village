// 논문 전문을 임베딩 단위(청크)로 자르는 순수 함수. I/O 없음.
// 문단 경계를 기준으로 자르되, 한 문단이 너무 길면 강제로도 자름.
const TARGET_CHUNK_LENGTH = 1000;
const MAX_CHUNK_LENGTH = 1500;
const CHUNK_OVERLAP_LENGTH = 180;

export function chunkText(fullText: string): string[] {
  const paragraphs = splitIntoParagraphs(fullText);
  const chunks: string[] = [];

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const candidateChunk = joinWithBlankLine(currentChunk, paragraph);

    if (candidateChunk.length <= TARGET_CHUNK_LENGTH) {
      currentChunk = candidateChunk;
      continue;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = buildOverlapPrefix(currentChunk);
    }

    if (paragraph.length > MAX_CHUNK_LENGTH) {
      const paragraphChunks = splitLongParagraph(paragraph);
      for (const paragraphChunk of paragraphChunks) {
        chunks.push(paragraphChunk);
      }
      currentChunk = "";
      continue;
    }

    currentChunk = joinWithBlankLine(currentChunk, paragraph);
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function splitIntoParagraphs(fullText: string): string[] {
  const rawParagraphs = fullText.split(/\n\s*\n/);

  const trimmedParagraphs: string[] = [];
  for (const rawParagraph of rawParagraphs) {
    const trimmedParagraph = rawParagraph.trim();
    if (trimmedParagraph.length > 0) {
      trimmedParagraphs.push(trimmedParagraph);
    }
  }

  return trimmedParagraphs;
}

function joinWithBlankLine(base: string, addition: string): string {
  if (base.length === 0) {
    return addition;
  }
  return `${base}\n\n${addition}`;
}

// 다음 청크 맨 앞에 이전 청크의 꼬리를 조금 붙여서, 경계에 걸친 문장이
// 어느 한쪽 청크에서도 완전히 잘리지 않게 함.
function buildOverlapPrefix(previousChunk: string): string {
  if (previousChunk.length <= CHUNK_OVERLAP_LENGTH) {
    return previousChunk;
  }
  return previousChunk.slice(previousChunk.length - CHUNK_OVERLAP_LENGTH);
}

// 문단 하나가 MAX_CHUNK_LENGTH보다 길 때, 문장 경계를 최대한 살려서 강제로 자름.
function splitLongParagraph(paragraph: string): string[] {
  const sentences = paragraph.split(/(?<=[.!?다요])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const candidateChunk = joinWithSpace(currentChunk, sentence);

    if (candidateChunk.length <= TARGET_CHUNK_LENGTH) {
      currentChunk = candidateChunk;
      continue;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    currentChunk = sentence;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function joinWithSpace(base: string, addition: string): string {
  if (base.length === 0) {
    return addition;
  }
  return `${base} ${addition}`;
}
