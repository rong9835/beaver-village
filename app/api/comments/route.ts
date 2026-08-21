import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { hashIp } from "@/lib/rateLimit/hashIp";
import { getRequestIp } from "@/lib/rateLimit/getRequestIp";
import { validateComment } from "@/lib/comments/validateComment";
import type { CommentTargetType } from "@/lib/types";

const VALID_TARGET_TYPES: CommentTargetType[] = ["article", "video", "guestbook"];

const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_SECONDS = 60;

type CommentRequestBody = {
  target_type?: string;
  target_id?: string | null;
  content?: string;
};

// 기능명세서 D-01: 30자 이하 익명 반응 등록. D-03 검증 → D-04 레이트리밋 확인 →
// approved=false로 저장(관리자가 Supabase 대시보드에서 승인해야 공개됨, D-05).
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
      { error: "RATE_LIMITED", message: "잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const { error: insertError } = await supabase.from("comments").insert({
    target_type: targetType,
    target_id: targetId,
    content,
    approved: false,
    ip_hash: ipHash,
  });

  if (insertError) {
    throw insertError;
  }

  return NextResponse.json({
    message: "등록됐어요. 확인 후 공개됩니다.",
  });
}
