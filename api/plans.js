// 내 계약 저장 · Supabase public.plans
//
//   POST /api/plans                {data}  → 새 코드를 만들어 저장, 201 {code, data}
//   GET  /api/plans?code=xxxxxxxxxx         → 저장한 내용 {code, data}
//   PUT  /api/plans?code=xxxxxxxxxx {data}  → 같은 코드에 덮어쓰기 {code, data}
//
// 코드를 아는 사람만 그 계약을 읽고 고칠 수 있습니다(목록 조회는 없음).
// plans 표는 공개 역할에 닫혀 있고, 이 함수만 secret 키로 접근합니다(supabase/schema.sql).
import { connect, dbError, fail, readJson } from '../lib/db.js';
import { CODE_RE, newCode, validatePlan } from '../lib/plan.js';

const TAG = 'plans';
const MAX_BODY_BYTES = 4096;
const NO_STORE = { 'Cache-Control': 'no-store' };

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST') return create(request);
    if (request.method === 'GET' || request.method === 'HEAD') return read(url);
    if (request.method === 'PUT') return update(request, url);
    return fail(405, 'METHOD', '이 주소는 GET, POST, PUT 요청만 받습니다.', {}, { Allow: 'GET, HEAD, POST, PUT' });
  },
};

function codeFrom(url) {
  const code = (url.searchParams.get('code') ?? '').trim().toLowerCase();
  return CODE_RE.test(code) ? code : null;
}

async function checkedBody(request) {
  const parsed = await readJson(request, MAX_BODY_BYTES);
  if (parsed.error) return parsed;
  const checked = validatePlan(parsed.body?.data);
  if (!checked.ok) return { error: fail(400, checked.error.code, checked.error.message, { field: checked.error.field }) };
  return { value: checked.value };
}

async function create(request) {
  const body = await checkedBody(request);
  if (body.error) return body.error;
  const db = connect('SUPABASE_SECRET_KEY', TAG);
  if (db.error) return db.error;

  // 코드가 우연히 겹치면(23505) 새 코드로 한 번 더 시도합니다
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = newCode();
    const { data, error } = await db.client.from('plans').insert({ code, data: body.value }).select('code, data').single();
    if (!error) return Response.json(data, { status: 201, headers: NO_STORE });
    if (error.code !== '23505') return dbError(TAG, '저장', error, '계약 정보를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
  }
  return fail(503, 'BUSY', '저장 코드를 만들지 못했습니다. 다시 시도해 주세요.');
}

async function read(url) {
  const code = codeFrom(url);
  if (!code) return fail(400, 'BAD_CODE', '저장 코드는 영문 소문자·숫자 10자리입니다.');
  const db = connect('SUPABASE_SECRET_KEY', TAG);
  if (db.error) return db.error;

  const { data, error } = await db.client.from('plans').select('code, data').eq('code', code).maybeSingle();
  if (error) return dbError(TAG, '읽기', error, '저장한 계약을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
  if (!data) return fail(404, 'NOT_FOUND', '이 코드로 저장된 계약이 없습니다. 링크를 다시 확인해 주세요.');
  return Response.json(data, { headers: NO_STORE });
}

async function update(request, url) {
  const code = codeFrom(url);
  if (!code) return fail(400, 'BAD_CODE', '저장 코드는 영문 소문자·숫자 10자리입니다.');
  const body = await checkedBody(request);
  if (body.error) return body.error;
  const db = connect('SUPABASE_SECRET_KEY', TAG);
  if (db.error) return db.error;

  const { data, error } = await db.client
    .from('plans')
    .update({ data: body.value, updated_at: new Date().toISOString() })
    .eq('code', code)
    .select('code, data')
    .maybeSingle();
  if (error) return dbError(TAG, '저장', error, '계약 정보를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
  if (!data) return fail(404, 'NOT_FOUND', '이 코드로 저장된 계약이 없습니다. 새로 저장해 주세요.');
  return Response.json(data, { headers: NO_STORE });
}
