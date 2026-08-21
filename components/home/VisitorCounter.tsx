"use client";

import { useEffect, useState } from "react";

type LoadState = "loading" | "error" | "loaded";

// 세션당 한 번만 증가시키기 위한 플래그. 새로고침해도 같은 세션이면 다시 증가시키지 않음.
const SESSION_VISITED_KEY = "bv-visited";

// 기능명세서 E-02: 대문 진입 시 sessionStorage 플래그를 확인해서, 이번 세션 첫
// 방문이면 증가(POST), 아니면 조회만(GET) 함. 조회 실패 시 카운터 영역만 숨기고
// 페이지 나머지는 그대로 렌더링함.
export function VisitorCounter() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadVisitorCount() {
      const hasVisitedThisSession = sessionStorage.getItem(SESSION_VISITED_KEY) === "true";
      const requestMethod = hasVisitedThisSession ? "GET" : "POST";

      const response = await fetch("/api/visitors", { method: requestMethod }).catch(
        () => null,
      );

      if (isCancelled) {
        return;
      }

      if (!response || !response.ok) {
        setLoadState("error");
        return;
      }

      const responseBody: { count: number } = await response.json();

      if (!hasVisitedThisSession) {
        sessionStorage.setItem(SESSION_VISITED_KEY, "true");
      }

      setVisitorCount(responseBody.count);
      setLoadState("loaded");
    }

    loadVisitorCount();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 예외 처리(E-02): 조회 자체가 실패했을 때만 영역을 완전히 숨김.
  if (loadState === "error") {
    return null;
  }

  // 로딩 중에는 내용을 안 보이게만 하고 자리(높이)는 그대로 차지하게 함. 그래야
  // 위쪽 "오늘의 비버상식" 등이 justify-between 배치에서 로딩 전후로 밀리지 않음.
  const isLoaded = loadState === "loaded" && visitorCount !== null;

  return (
    <div
      className="border-t-2 border-dashed border-[#cbbfa3] pt-4 text-[21px] text-[#7a5a3a]"
      style={{ visibility: isLoaded ? "visible" : "hidden" }}
    >
      당신은{" "}
      <span className="text-[26px] font-bold text-[#e2703a]">
        {(visitorCount ?? 0).toLocaleString()}
      </span>
      번째 마을 방문객입니다
    </div>
  );
}
