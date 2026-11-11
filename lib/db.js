// Supabase 연결과 공통 응답 · api/plans.js가 씁니다.
// 키는 Vercel 환경 변수에서만 읽습니다(코드·저장소·로그·응답에는 적지 않습니다)
//   SUPABASE_URL              프로젝트 주소
//   SUPABASE_SECRET_KEY       service_role. plans 표 읽기·쓰기에만, 함수 안에서만 씁니다
import { createClient } from '@supabase/supabase-js';

export function connect(keyName, tag) {
  const url = String(process.env.SUPABASE_URL ?? '').trim();
  const key = String(process.env[keyName] ?? '').trim();
  const missing = [!url && 'SUPABASE_URL', !key && keyName].filter(Boolean);
  if (missing.length) {
    console.error(`[${tag}] 환경 변수가 없습니다: ${missing.join(', ')}`);
    return {
      error: fail(500, 'NO_KEY', '서버에 Supabase 설정이 되어 있지 않습니다.', {
        hint: `Vercel 프로젝트 Settings → Environment Variables에 ${missing.join(', ')}을(를) 추가한 뒤 다시 배포합니다.`,
      }),
    };
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return { client };
}

export function dbError(tag, action, error, userMessage) {
  console.error(`[${tag}] ${action} 실패 code=${error.code ?? '-'} ${error.message ?? ''}`);
  return fail(502, 'DB_ERROR', userMessage);
}

export function fail(status, code, message, extra = {}, headers = {}) {
  return Response.json({ error: message, code, ...extra }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

// JSON 본문만 받습니다(다른 사이트의 <form>이 몰래 저장하지 못하게)
export async function readJson(request, maxBytes) {
  const type = request.headers.get('content-type') ?? '';
  if (!/^application\/json\b/i.test(type)) return { error: fail(415, 'BAD_TYPE', 'Content-Type: application/json 으로 보내 주세요.') };
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) return { error: fail(413, 'TOO_LARGE', '보낸 내용이 너무 큽니다.') };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: fail(400, 'BAD_JSON', 'JSON 형식이 올바르지 않습니다.') };
  }
}
