import { createClient } from "@supabase/supabase-js";

// 로그인 없는 서비스라 세션 관리가 필요 없음.
// anon key만 사용하고, 권한은 전부 RLS 정책(supabase/migrations)이 결정함.
// 서버 컴포넌트·클라이언트 컴포넌트 양쪽에서 같은 클라이언트를 그대로 사용함.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수를 설정해주세요.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
