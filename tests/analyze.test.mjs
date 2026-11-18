// AI 특약 해설·등기부 분석 · 오픈하사를 가짜로 바꿔 진짜 키·네트워크 없이 확인합니다.
// 정상, 400(잘못된 입력), 500(키 없음), 429(한도 초과), 504(시간 초과), 이상한 답, 개인정보 가리기
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAnalyze, maskPersonal, parseAnswer, findSignals, sumMaxClaims, buildMessages, HASA_URL, MODEL } from '../lib/analyze.js';

const ENV = { HASA_API_KEY: 'test-key-not-real' };
const CLAUSES = '1. 임대인은 보증금을 새로운 임차인이 입주한 후 반환한다.\n2. 임차인은 퇴실 시 모든 원상복구 비용을 부담한다.';
const REGISTRY = [
  '【갑구】 1 소유권이전 2023년2월6일 소유자 박철수 800101-1****** 서울 마포구 ○○로 12, 101동 1203호',
  '2 신탁 2023년8월14일 수탁자 ○○부동산신탁',
  '3 가압류 2026년7월2일 청구금액 금30,000,000원',
  '【을구】 1 근저당권설정 채권최고액 금240,000,000원 근저당권자 ○○저축은행',
  '2 근저당권설정 채권최고액 금50,000,000원 (2024년 말소)',
].join('\n');

function post(body, type = 'application/json') {
  return new Request('http://localhost/api/analyze', { method: 'POST', headers: { 'Content-Type': type }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
// 가짜 오픈하사: 받은 요청을 기록하고 정해 둔 답을 돌려줍니다
function fakeHasa(status, content, calls = []) {
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const payload = { choices: [{ message: { content } }], usage: { total_tokens: 321 } };
    return new Response(JSON.stringify(status === 200 ? payload : { error: { message: 'x' } }), { status, headers: { 'Content-Type': 'application/json' } });
  };
  fn.calls = calls;
  return fn;
}
const GOOD_CLAUSES = JSON.stringify({ items: [
  { level: 'risk', quote: '임대인은 보증금을 새로운 임차인이 입주한 후 반환한다.', why: '새 세입자가 없으면 못 받을 수 있어요.', fix: '만료일에 반환으로 바꿔 달라고 하세요.' },
  { level: 'warn', quote: '임차인은 퇴실 시 모든 원상복구 비용을 부담한다.', why: '"모든"의 범위가 모호해요.', fix: '고의·과실로 좁히세요.' },
] });
const GOOD_REGISTRY = JSON.stringify({ flags: [
  { level: 'risk', title: '신탁', detail: '소유권이 신탁회사에 있어요.' },
  { level: 'risk', title: '가압류', detail: '경매로 이어질 수 있어요.' },
] });

test('정상: 특약 해설이 200과 위험도 목록으로 오고, 오픈하사에 정해진 주소·모델·키로 묻는다', async () => {
  const hasa = fakeHasa(200, GOOD_CLAUSES);
  const res = await handleAnalyze(post({ kind: 'clauses', text: CLAUSES }), { fetchImpl: hasa, env: ENV });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.items.length, 2);
  assert.equal(body.items[0].level, 'risk');
  assert.equal(body.tokens, 321);

  const [call] = hasa.calls;
  assert.equal(call.url, HASA_URL);
  assert.equal(call.body.model, MODEL);
  assert.equal(call.init.headers.Authorization, 'Bearer test-key-not-real');
  assert.equal(call.body.messages[0].role, 'system');
  assert.equal(call.body.messages[1].role, 'user');
  assert.ok(call.body.messages[1].content.includes('새로운 임차인'));
  assert.ok(!call.body.messages[0].content.includes('새로운 임차인'), '사용자 글이 지시문에 섞이지 않는다');
  assert.ok(call.body.max_tokens > 0);
  assert.ok(!JSON.stringify(body).includes('test-key-not-real'), '응답에 키가 없다');
});

test('정상: 등기부 분석은 AI 신호와 함께 서비스가 직접 찾은 낱말·채권최고액(말소 제외)을 돌려준다', async () => {
  const hasa = fakeHasa(200, `여기 결과예요\n\`\`\`json\n${GOOD_REGISTRY}\n\`\`\``);
  const res = await handleAnalyze(post({ kind: 'registry', text: REGISTRY }), { fetchImpl: hasa, env: ENV });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.flags.length, 2);
  assert.deepEqual(body.signals, ['신탁', '가압류', '근저당권']);
  assert.equal(body.maxClaims, 240_000_000);
  assert.ok(body.masked >= 3);
});

test('개인정보: 오픈하사로 가는 글에서 이름·주민번호·동호수가 가려진다', async () => {
  const hasa = fakeHasa(200, GOOD_REGISTRY);
  await handleAnalyze(post({ kind: 'registry', text: REGISTRY }), { fetchImpl: hasa, env: ENV });
  const sent = hasa.calls[0].body.messages[1].content;
  assert.ok(!sent.includes('박철수'));
  assert.ok(!sent.includes('800101'));
  assert.ok(!sent.includes('1203호'));
  assert.ok(sent.includes('채권최고액 금240,000,000원'), '판단에 필요한 금액은 남긴다');
});

test('개인정보 가리기: 전화·계좌·이메일은 가리고 날짜·노선·계약서 낱말은 남긴다', () => {
  const { text, count } = maskPersonal('임대인: 김영희 010-1234-5678 계좌 110-123-456789 a@b.com 02-123-4567\n임대인 보증금 반환은 2026-12-19, 지하철 2호선');
  assert.equal(count, 5);
  for (const gone of ['김영희', '1234-5678', '456789', 'a@b.com', '123-4567']) assert.ok(!text.includes(gone), gone);
  for (const kept of ['임대인 보증금', '2026-12-19', '2호선']) assert.ok(text.includes(kept), kept);
});

for (const [name, body, field] of [
  ['kind가 없음', { text: CLAUSES }, 'kind'],
  ['모르는 kind', { kind: 'lease', text: CLAUSES }, 'kind'],
  ['글이 너무 짧음', { kind: 'clauses', text: '특약 없음' }, 'text'],
  ['특약 1,500자 넘음', { kind: 'clauses', text: '가'.repeat(1501) }, 'text'],
  ['글이 문자열이 아님', { kind: 'registry', text: 123 }, 'text'],
]) {
  test(`400: ${name} → 오픈하사를 부르지 않는다`, async () => {
    const hasa = fakeHasa(200, GOOD_CLAUSES);
    const res = await handleAnalyze(post(body), { fetchImpl: hasa, env: ENV });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).field, field);
    assert.equal(hasa.calls.length, 0);
  });
}

test('400·405·415: JSON이 아니거나 GET이면 거절한다', async () => {
  const hasa = fakeHasa(200, GOOD_CLAUSES);
  assert.equal((await handleAnalyze(post('{oops'), { fetchImpl: hasa, env: ENV })).status, 400);
  assert.equal((await handleAnalyze(post('kind=clauses', 'application/x-www-form-urlencoded'), { fetchImpl: hasa, env: ENV })).status, 415);
  assert.equal((await handleAnalyze(new Request('http://localhost/api/analyze'), { fetchImpl: hasa, env: ENV })).status, 405);
  assert.equal(hasa.calls.length, 0);
});

test('500: 키가 없으면 운영자 설정 문제라고 알리고 오픈하사를 부르지 않는다', async () => {
  const hasa = fakeHasa(200, GOOD_CLAUSES);
  const res = await handleAnalyze(post({ kind: 'clauses', text: CLAUSES }), { fetchImpl: hasa, env: {} });
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.code, 'NO_KEY');
  assert.match(body.hint, /HASA_API_KEY/);
  assert.equal(hasa.calls.length, 0);
});

test('429: 오픈하사 한도 초과는 잠시 뒤·하루 한도 안내와 함께 429로', async () => {
  const res = await handleAnalyze(post({ kind: 'clauses', text: CLAUSES }), { fetchImpl: fakeHasa(429, ''), env: ENV });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '60');
  assert.match((await res.json()).error, /하루 한도/);
});

test('504: 시간 제한을 넘기면 중단하고 다시 시도 안내', async () => {
  const hang = (url, init) => new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => reject(init.signal.reason));
  });
  const res = await handleAnalyze(post({ kind: 'clauses', text: CLAUSES }), { fetchImpl: hang, env: ENV, timeoutMs: 30 });
  assert.equal(res.status, 504);
  assert.equal((await res.json()).code, 'TIMEOUT');
});

test('502: 키가 거절되면 500, 오픈하사 오류는 502', async () => {
  assert.equal((await handleAnalyze(post({ kind: 'clauses', text: CLAUSES }), { fetchImpl: fakeHasa(401, ''), env: ENV })).status, 500);
  assert.equal((await handleAnalyze(post({ kind: 'clauses', text: CLAUSES }), { fetchImpl: fakeHasa(503, ''), env: ENV })).status, 502);
});

test('이상한 답: 형식이 맞지 않으면 화면에 보내지 않고 502 BAD_ANSWER', async () => {
  for (const content of ['그냥 글로 답했어요', '{"items":[{"level":"danger","quote":"x","why":"y"}]}', '{"flags":[]}']) {
    const res = await handleAnalyze(post({ kind: 'clauses', text: CLAUSES }), { fetchImpl: fakeHasa(200, content), env: ENV });
    assert.equal(res.status, 502, content);
    assert.equal((await res.json()).code, 'BAD_ANSWER');
  }
});

test('답 거르기: 너무 긴 글은 자르고, 빈 목록은 그대로 둔다', () => {
  const long = parseAnswer('clauses', JSON.stringify({ items: [{ level: 'ok', quote: 'q'.repeat(500), why: 'w', fix: '' }] }));
  assert.equal(long[0].quote.length, 200);
  assert.deepEqual(parseAnswer('registry', '{"flags":[]}'), []);
});

test('등기부 도우미: 말소된 줄은 낱말·금액에서 뺀다', () => {
  const text = '1 근저당권설정 채권최고액 금 96,000,000원\n2 가압류 (말소)\n3 근저당권설정 채권최고액 금10,000,000원 말소';
  assert.deepEqual(findSignals(text), ['근저당권']);
  assert.equal(sumMaxClaims(text), 96_000_000);
});

test('지시문에 역할·형식·근거·금지가 모두 있다', () => {
  for (const kind of ['clauses', 'registry']) {
    const system = buildMessages(kind, '글')[0].content;
    for (const word of ['역할', '형식', '근거', '금지']) assert.ok(system.includes(word), `${kind}: ${word}`);
  }
});
