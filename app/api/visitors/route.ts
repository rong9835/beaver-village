import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

type VisitorsResponseBody = {
  count: number;
};

// 기능명세서 E-02: 누적 방문자 수 조회. 이미 이번 세션에 방문한 사용자는
// 증가시키지 않고 현재 값만 읽음(클라이언트가 sessionStorage로 판단해서 GET을 호출함).
export async function GET() {
  const { data, error } = await supabase
    .from("visitors")
    .select("count")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "방문자 수를 불러오지 못했어요." },
      { status: 500 },
    );
  }

  const responseBody: VisitorsResponseBody = { count: Number(data.count) };
  return NextResponse.json(responseBody);
}

// 기능명세서 E-02: 이번 세션 첫 방문일 때만 클라이언트가 이 경로를 호출해 1 증가시킴.
// anon에게 visitors 테이블 UPDATE 권한을 직접 주지 않고, SECURITY DEFINER 함수로만 증가시킴.
export async function POST() {
  const { data, error } = await supabase.rpc("increment_visitor_count");

  if (error) {
    return NextResponse.json(
      { error: "방문자 수를 늘리지 못했어요." },
      { status: 500 },
    );
  }

  const responseBody: VisitorsResponseBody = { count: Number(data) };
  return NextResponse.json(responseBody);
}
