"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import type { CommentTargetType, PublicComment } from "@/lib/types";
import { READABLE_BODY_STYLE } from "@/lib/notebookTheme";
import {
  COMMENT_MAX_LENGTH,
  validateComment,
} from "@/lib/comments/validateComment";

type CommentListProps = {
  targetType: CommentTargetType;
  targetId: string;
};

type LoadState = "loading" | "error" | "loaded";

// docs/결정사항.md H: 반응은 SSG 대상이 아님. 마운트 후 comments_public 뷰를 직접 조회함.
// 반응 영역이 실패하거나 늦게 로드되더라도 본문·출처·영상에는 영향을 주지 않음.
export function CommentList({ targetType, targetId }: CommentListProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [comments, setComments] = useState<PublicComment[]>([]);
  const isCancelledRef = useRef(false);

  async function loadComments() {
    const { data, error } = await supabase
      .from("comments_public")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });

    if (isCancelledRef.current) {
      return;
    }

    if (error) {
      setLoadState("error");
      return;
    }

    setComments(data);
    setLoadState("loaded");
  }

  useEffect(() => {
    isCancelledRef.current = false;
    loadComments();

    return () => {
      isCancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  return (
    <section>
      <h2 className="mb-3 text-[24px] font-bold text-[#4b3a28] font-[family-name:var(--font-gaegu)]">
        반응
      </h2>

      {/* 스켈레톤·에러·빈 상태·정상 상태가 서로 다른 높이로 렌더링돼도
          레이아웃이 크게 밀리지 않도록 영역 전체에 최소 높이를 둠 */}
      <div className="min-h-24" style={READABLE_BODY_STYLE}>
        {loadState === "loading" && <CommentListSkeleton />}

        {loadState === "error" && (
          <p className="text-[15px] text-[#8a7a63]">
            반응을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {loadState === "loaded" && comments.length === 0 && (
          <p className="text-[15px] text-[#8a7a63]">첫 반응을 남겨보세요.</p>
        )}

        {loadState === "loaded" && comments.length > 0 && (
          <ul className="flex flex-col gap-2">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-xl border-2 border-[#e8c9a0] bg-[#fdf8ea] px-3 py-2 text-[15px] text-[#33261a]"
              >
                {comment.content}
              </li>
            ))}
          </ul>
        )}
      </div>

      <CommentForm
        targetType={targetType}
        targetId={targetId}
        onPosted={loadComments}
      />
    </section>
  );
}

function CommentListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 animate-pulse rounded-xl bg-[#f1e6c9]" />
      <div className="h-9 animate-pulse rounded-xl bg-[#f1e6c9]" />
    </div>
  );
}

type CommentFormProps = {
  targetType: CommentTargetType;
  targetId: string;
  onPosted: () => void;
};

type SubmitState = "idle" | "submitting" | "success";

// 기능명세서 D-01/D-03: 클라이언트에서 먼저 검사해 즉각 피드백을 준 다음
// POST /api/comments로 보냄(그 안에서 서버 검증·레이트리밋을 다시 거침).
function CommentForm({ targetType, targetId, onPosted }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientValidation = validateComment(content);
    if (!clientValidation.valid) {
      setErrorMessage(clientValidation.message);
      return;
    }

    setErrorMessage(null);
    setSubmitState("submitting");

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, content }),
    }).catch(() => null);

    if (!response) {
      setErrorMessage("반응을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setSubmitState("idle");
      return;
    }

    if (!response.ok) {
      const responseBody: { message?: string } = await response.json().catch(() => ({}));
      setErrorMessage(responseBody.message ?? "반응을 등록하지 못했어요.");
      setSubmitState("idle");
      return;
    }

    setContent("");
    setSubmitState("success");
    onPosted();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-2"
      style={READABLE_BODY_STYLE}
    >
      <textarea
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setErrorMessage(null);
        }}
        maxLength={COMMENT_MAX_LENGTH}
        disabled={submitState === "submitting"}
        placeholder="30자 이내로 반응을 남겨보세요"
        className="resize-none rounded-xl border-2 border-[#cbbfa3] p-2 text-[15px] text-[#33261a] disabled:bg-[#f7f0dd]"
        rows={2}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-[#a89a82]">
          {errorMessage ?? (submitState === "success" ? "등록됐어요!" : "")}
        </p>

        <button
          type="submit"
          disabled={submitState === "submitting" || content.trim() === ""}
          className="shrink-0 rounded-xl bg-[#e2703a] px-4 py-1.5 text-[15px] text-[#fff8ef] hover:bg-[#cf5f2b] disabled:cursor-not-allowed disabled:bg-[#e8c9a0] disabled:text-[#8a7a63]"
        >
          등록
        </button>
      </div>
    </form>
  );
}
