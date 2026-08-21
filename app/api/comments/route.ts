import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { supabaseServiceClient } from "@/lib/supabase/serviceClient";
import { hashIp } from "@/lib/rateLimit/hashIp";
import { getRequestIp } from "@/lib/rateLimit/getRequestIp";
import { validateComment } from "@/lib/comments/validateComment";
import type { CommentTargetType } from "@/lib/types";

const VALID_TARGET_TYPES: CommentTargetType[] = ["article", "video", "guestbook"];

const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_SECONDS = 60;

// 같은 IP가 같은 대상에 같은 내용을 이 시간 안에 다시 올리면 막음(도배 방지).
const DUPLICATE_CONTENT_WINDOW_SECONDS = 10 * 60;

// 사이트 전체 하루 반응 등록 수 상한. IP를 바꿔가며 도배하는 경우를 막는 최후 안전장치.
const DAILY_COMMENT_CAP = 500;

type CommentRequestBody = {
  target_type?: string;
  target_id?: string | null;
  content?: string;
};

// 기능명세서 D-01: 30자 이하 익명 반응 등록. D-03 검증 → D-04 레이트리밋 확인 →
// 등록 즉시 공개(관리자 승인 절차 없음, 2026-08-21 결정 — docs/결정사항.md 참고).
// 도배는 D-04 레이트리밋 + 동일 내용 반복 차단 + 일일 총량 제한으로 막는다.
export async function POST(request: NextRequest) {
  const requestBody: CommentRequestBody = await request.json().catch(() => ({}));
  const targetType = requestBody.target_type;
  const targetId = requestBody.target_id ?? null;
  const content = requestBody.content ?? "";

  if (!targetType || !VALID_TARGET_TYPES.includes(targetType as CommentTargetType)) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "반응 대상이 올바르지 않아요." },
      { status: 400 },
    );
  }

  const isGuestbook = targetType === "guestbook";
  if (isGuestbook !== (targetId === null)) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "반응 대상이 올바르지 않아요." },
      { status: 400 },
    );
  }

  const validationResult = validateComment(content);
  if (!validationResult.valid) {
    return NextResponse.json(
      { error: validationResult.code, message: validationResult.message },
      { status: 400 },
    );
  }

  const requestIp = getRequestIp(request);
  const ipHash = hashIp(requestIp);

  const { data: isAllowed, error: rateLimitError } = await supabase.rpc(
    "check_comment_rate_limit",
    {
      p_ip_hash: ipHash,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    },
  );

  if (rateLimitError) {
    throw rateLimitError;
  }

  if (!isAllowed) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "너무 빠르게 요청했어요. 1분 정도 기다렸다가 다시 시도해주세요.",
      },
      { status: 429 },
    );
  }

  const { data: isNotDuplicate, error: duplicateCheckError } = await supabase.rpc(
    "check_comment_duplicate",
    {
      p_ip_hash: ipHash,
      p_target_type: targetType,
      p_target_id: targetId,
      p_content: content,
      p_window_seconds: DUPLICATE_CONTENT_WINDOW_SECONDS,
    },
  );

  if (duplicateCheckError) {
    throw duplicateCheckError;
  }

  if (!isNotDuplicate) {
    return NextResponse.json(
      { error: "DUPLICATE_CONTENT", message: "이미 남긴 것과 같은 내용이에요." },
      { status: 409 },
    );
  }

  // 일일 총량은 사이트 전체가 공유하는 카운터라, 앱을 거치지 않고 anon key로 직접
  // 증가시킬 수 없도록 anon/authenticated 실행 권한을 아예 주지 않은 함수임
  // (20260821000400 마이그레이션 참고). 그래서 여기서만 service_role로 호출한다.
  const dayKey = getCurrentDayKey();
  const { data: isUnderDailyCap, error: dailyCapError } = await supabaseServiceClient.rpc(
    "check_comment_daily_limit",
    {
      p_day_key: dayKey,
      p_max_per_day: DAILY_COMMENT_CAP,
    },
  );

  if (dailyCapError) {
    throw dailyCapError;
  }

  if (!isUnderDailyCap) {
    return NextResponse.json(
      {
        error: "DAILY_LIMIT_REACHED",
        message: "오늘 등록할 수 있는 반응 수를 다 채웠어요. 내일 다시 시도해주세요.",
      },
      { status: 503 },
    );
  }

  const { error: insertError } = await supabase.from("comments").insert({
    target_type: targetType,
    target_id: targetId,
    content,
    ip_hash: ipHash,
  });

  if (insertError) {
    throw insertError;
  }

  return NextResponse.json({
    message: "등록됐어요!",
  });
}

function getCurrentDayKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
