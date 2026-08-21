"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SearchSource } from "@/lib/types";
import { SearchBox } from "@/components/home/SearchBox";
import { BeaverSprite } from "@/components/home/BeaverSprite";
import { PageFrame } from "@/components/layout/PageFrame";
import { PageHeader } from "@/components/layout/PageHeader";
import { NOTEBOOK_LINES_STYLE, READABLE_BODY_STYLE } from "@/lib/notebookTheme";

type LoadState = "loading" | "error" | "loaded";

type SearchApiResponse = {
  answer: string | null;
  sources: SearchSource[];
};

type SearchApiErrorResponse = {
  error: string;
};

const DEFAULT_ERROR_MESSAGE =
  "검색 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";

const SUGGESTED_QUESTIONS = [
  "이빨이 왜 주황색?",
  "댐은 왜 지을까?",
  "왜 뒤뚱거려?",
];

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const trimmedQuery = query.trim();
  const isQueryBlank = trimmedQuery.length === 0;

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchSource[]>([]);

  useEffect(() => {
    if (isQueryBlank) {
      return;
    }

    let isCancelled = false;

    async function runSearch() {
      setLoadState("loading");

      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
      ).catch(() => null);

      if (isCancelled) {
        return;
      }

      if (!response) {
        setErrorMessage(DEFAULT_ERROR_MESSAGE);
        setLoadState("error");
        return;
      }

      if (!response.ok) {
        const errorBody: SearchApiErrorResponse = await response
          .json()
          .catch(() => ({ error: DEFAULT_ERROR_MESSAGE }));
        setErrorMessage(errorBody.error || DEFAULT_ERROR_MESSAGE);
        setLoadState("error");
        return;
      }

      const responseBody: SearchApiResponse = await response.json();

      setAnswer(responseBody.answer);
      setSources(responseBody.sources);
      setLoadState("loaded");
    }

    runSearch();

    return () => {
      isCancelled = true;
    };
  }, [trimmedQuery, isQueryBlank]);

  return (
    <PageFrame>
      <div
        className="px-4 py-6 font-[family-name:var(--font-gaegu)] sm:px-8 sm:py-8 md:px-[54px] md:pt-9 md:pb-[34px]"
        style={NOTEBOOK_LINES_STYLE}
      >
        <PageHeader current="search" />

        <div className="my-5 h-1 bg-[#e8c9a0] sm:my-6" />

        <SearchBox />

        <p className="mt-5 text-[17px] text-[#8a7a63] sm:mt-[26px] sm:text-[21px]">
          &ldquo;{query}&rdquo;에 대해 찾아본 결과예요
        </p>

        <div className="mt-6 min-h-24">
          {isQueryBlank && (
            <p className="text-[17px] text-[#8a7a63] sm:text-[21px]">
              검색어를 입력해주세요.
            </p>
          )}

          {!isQueryBlank && loadState === "loading" && <SearchResultSkeleton />}

          {!isQueryBlank && loadState === "error" && (
            <SearchErrorState message={errorMessage} />
          )}

          {!isQueryBlank && loadState === "loaded" && answer === null && (
            <SearchEmptyState />
          )}

          {!isQueryBlank && loadState === "loaded" && answer !== null && (
            <SearchResult answer={answer} sources={sources} />
          )}
        </div>
      </div>
    </PageFrame>
  );
}

function SearchResult({
  answer,
  sources,
}: {
  answer: string;
  sources: SearchSource[];
}) {
  return (
    <div className="flex flex-col gap-5" style={READABLE_BODY_STYLE}>
      <p className="whitespace-pre-wrap text-[18px] leading-[1.75] text-[#33261a]">
        {answer}
      </p>

      {sources.length > 0 && (
        <div className="flex flex-col gap-2 border-t-2 border-dashed border-[#e8c9a0] pt-4">
          <p className="text-[15px] font-bold text-[#8a7a63]">참고 논문</p>
          <ul className="flex flex-col gap-1.5">
            {sources.map((source) => (
              <li key={source.paperId} className="text-[14px] text-[#8a7a63]">
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c2571f] underline hover:text-[#a5481a]"
                >
                  {source.title}
                </a>
                {" "}— {source.authors}
                {source.publishYear !== null ? `, ${source.publishYear}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SearchErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-[54px] w-[54px] flex-none">
        <BeaverSprite kind="sit" className="h-full w-full" />
      </div>
      <p className="text-[17px] text-[#8a7a63]" style={READABLE_BODY_STYLE}>
        {message}
      </p>
    </div>
  );
}

// B-03: 검색 결과가 없어도 막다른 길이 되지 않도록 대안 경로를 함께 보여줌.
function SearchEmptyState() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="h-[54px] w-[54px] flex-none">
          <BeaverSprite kind="sit" className="h-full w-full" />
        </div>
        <p className="text-[17px] text-[#8a7a63]" style={READABLE_BODY_STYLE}>
          아직 답을 찾지 못했어요. 다른 질문으로 다시 검색해보시겠어요?
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {SUGGESTED_QUESTIONS.map((suggestedQuestion, index) => (
          <Link
            key={suggestedQuestion}
            href={`/search?q=${encodeURIComponent(suggestedQuestion)}`}
            className={`rounded-full border-2 border-[#7a5a3a] bg-[#fdf1d8] px-3 py-1.5 text-[15px] text-[#4b3a28] hover:bg-[#f6e2b8] sm:px-4 sm:py-2 sm:text-[19px] ${
              index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
            }`}
          >
            {suggestedQuestion}
          </Link>
        ))}
      </div>

      <Link
        href="/library"
        className="w-fit text-[15px] text-[#c2571f] underline hover:text-[#a5481a] sm:text-[19px]"
      >
        도서관에서 다른 글 둘러보기
      </Link>
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      <div className="h-5 w-full animate-pulse rounded-md bg-[#f1e6c9]" />
      <div className="h-5 w-full animate-pulse rounded-md bg-[#f1e6c9]" />
      <div className="h-5 w-2/3 animate-pulse rounded-md bg-[#f1e6c9]" />
    </div>
  );
}

function SearchPageSkeleton() {
  return (
    <PageFrame>
      <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-[54px] md:pt-9 md:pb-[34px]">
        <div className="h-[46px] w-[160px] animate-pulse rounded-full bg-[#f1e6c9]" />
        <div className="my-5 h-1 bg-[#e8c9a0] sm:my-6" />
        <SearchResultSkeleton />
      </div>
    </PageFrame>
  );
}
