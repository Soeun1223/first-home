// 내 계약 저장 입력 검사와, 잘못된 요청이 DB에 닿기 전에 걸러지는지 확인합니다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePlan, newCode, CODE_RE } from '../lib/plan.js';
import plans from '../api/plans.js';

const good = {
  contractDate: '2026-11-20', moveDate: '2026-12-19', type: 'wolse',
  deposit: 50_000_000, rent: 550_000, region: 'metro', termMonths: 24, salary: 32_000_000,
  checks: ['s1-budget', 'd-water', 's1-budget'],
};

test('올바른 계약은 통과하고, 체크 목록은 중복 없이 정렬된다', () => {
  const r = validatePlan({ ...good, extra: 'drop me' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value.checks, ['d-water', 's1-budget']);
  assert.equal('extra' in r.value, false);
});

test('총급여는 비워 둘 수 있다', () => {
  const { salary, ...rest } = good;
  assert.equal(validatePlan(rest).value.salary, null);
});

for (const [name, patch, field] of [
  ['없는 날짜', { contractDate: '2026-02-30' }, 'contractDate'],
  ['입주일이 계약일보다 앞', { moveDate: '2026-11-01' }, 'moveDate'],
  ['모르는 유형', { type: 'buy' }, 'type'],
  ['음수 보증금', { deposit: -1 }, 'deposit'],
  ['소수 월세', { rent: 1.5 }, 'rent'],
  ['모르는 지역', { region: 'seoul' }, 'region'],
  ['계약 기간 0', { termMonths: 0 }, 'termMonths'],
  ['이상한 체크 이름', { checks: ['<script>'] }, 'checks'],
  ['체크 101개', { checks: Array.from({ length: 101 }, (_, i) => `c${i}`) }, 'checks'],
]) {
  test(`거절: ${name}`, () => {
    const r = validatePlan({ ...good, ...patch });
    assert.equal(r.ok, false);
    assert.equal(r.error.field, field);
  });
}

test('저장 코드는 영문 소문자·숫자 10자리', () => {
  for (let i = 0; i < 200; i += 1) assert.match(newCode(), CODE_RE);
});

const call = (method, path, body, type = 'application/json') => plans.fetch(new Request(`http://x${path}`, {
  method, headers: body === undefined ? {} : { 'Content-Type': type }, body,
}));

test('함수: JSON이 아니면 415, 깨진 JSON은 400, 틀린 값은 400(DB 전에)', async () => {
  delete process.env.SUPABASE_URL;
  assert.equal((await call('POST', '/api/plans', 'a=1', 'application/x-www-form-urlencoded')).status, 415);
  assert.equal((await call('POST', '/api/plans', '{')).status, 400);
  const res = await call('POST', '/api/plans', JSON.stringify({ data: { ...good, type: 'x' } }));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).field, 'type');
});

test('함수: 잘못된 코드는 400, 키가 없으면 500 NO_KEY', async () => {
  delete process.env.SUPABASE_URL;
  assert.equal((await call('GET', '/api/plans?code=../etc')).status, 400);
  const res = await call('GET', '/api/plans?code=abcdefghjk');
  assert.equal(res.status, 500);
  assert.equal((await res.json()).code, 'NO_KEY');
  assert.equal((await call('DELETE', '/api/plans')).status, 405);
});
