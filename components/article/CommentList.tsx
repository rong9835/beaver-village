"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { PublicComment } from "@/lib/types";

type CommentListProps = {
  targetId: string;
};

type LoadState = "loading" | "error" | "loaded";

// docs/결정사항.md H: 반응은 SSG 대상이 아님. 마운트 후 comments_public 뷰를 직접 조회함.
// 반응 영역이 실패하거나 늦게 로드되더라도 본문·출처·영상에는 영향을 주지 않음.
export function CommentList({ targetId }: CommentListProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [comments, setComments] = useState<PublicComment[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadComments() {
      const { data, error } = await supabase
        .from("comments_public")
        .select("*")
        .eq("target_type", "article")
        .eq("target_id", targetId)
        .order("created_at", { ascending: false });

      if (isCancelled) {
        return;
      }

      if (error) {
        setLoadState("error");
        return;
      }

      setComments(data);
      setLoadState("loaded");
    }

    loadComments();

    return () => {
      isCancelled = true;
    };
  }, [targetId]);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        반응
      </h2>

      {/* 스켈레톤·에러·빈 상태·정상 상태가 서로 다른 높이로 렌더링돼도
          레이아웃이 크게 밀리지 않도록 영역 전체에 최소 높이를 둠 */}
      <div className="min-h-24">
        {loadState === "loading" && <CommentListSkeleton />}

        {loadState === "error" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            반응을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {loadState === "loaded" && comments.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            첫 반응을 남겨보세요.
          </p>
        )}

        {loadState === "loaded" && comments.length > 0 && (
          <ul className="flex flex-col gap-2">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
              >
                {comment.content}
              </li>
            ))}
          </ul>
        )}
      </div>

      <CommentForm />
    </section>
  );
}

function CommentListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-9 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

// 제출 로직(검증·레이트 리밋)은 5일차(D-01, D-03, D-04) 범위. 지금은 자리만 잡아둠.
function CommentForm() {
  return (
    <form className="mt-4 flex flex-col gap-2">
      <textarea
        maxLength={30}
        disabled
        placeholder="반응 작성은 곧 열릴 예정이에요"
        className="resize-none rounded-md border border-zinc-200 p-2 text-sm disabled:bg-zinc-50 dark:border-zinc-800 dark:disabled:bg-zinc-900"
        rows={2}
      />
      <button
        type="submit"
        disabled
        className="self-end rounded-md bg-zinc-200 px-4 py-1.5 text-sm text-zinc-500 disabled:cursor-not-allowed dark:bg-zinc-800"
      >
        등록
      </button>
    </form>
  );
}
