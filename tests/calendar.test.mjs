// 계약 일정 계산, iCalendar 글자 규칙, 캘린더 함수의 잘못된 요청 처리를 확인합니다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleOf } from '../lib/schedule.js';
import { buildIcs, fold } from '../lib/ics.js';
import calendar from '../api/calendar.js';

const plan = {
  contractDate: '2026-11-20', moveDate: '2026-12-19', type: 'wolse',
  deposit: 50_000_000, rent: 550_000, region: 'metro', termMonths: 24, salary: 32_000_000, checks: [],
};
const byKey = (events) => Object.fromEntries(events.map((e) => [e.key, e.date]));

test('화면 타임라인과 같은 날짜가 나온다', () => {
  assert.deepEqual(byKey(scheduleOf(plan)), {
    contract: '2026-11-20',
    singo: '2026-12-20', // 계약일 + 30일
    move: '2026-12-19',
    daehang: '2026-12-20', // 입주 다음 날
    jeonip: '2027-01-02', // 입주 + 14일
    hug: '2027-12-19', // 입주 + 계약 기간의 절반
    tax: '2027-01-15', // 입주 다음 해 1월 15일
    'renew-from': '2028-06-19', // 만료 6개월 전
    'renew-to': '2028-10-19', // 만료 2개월 전
    end: '2028-12-19',
  });
});

test('일정은 날짜순이다', () => {
  const dates = scheduleOf(plan).map((e) => e.date);
  assert.deepEqual(dates, [...dates].sort());
});

test('신고 대상이 아니면 신고 마감이, 전세면 세액공제가 빠진다', () => {
  const keys = scheduleOf({ ...plan, type: 'jeonse', rent: 0, deposit: 50_000_000, region: 'county' }).map((e) => e.key);
  assert.equal(keys.includes('singo'), false);
  assert.equal(keys.includes('tax'), false);
});

test('없는 날짜는 그 달 마지막 날로 맞춘다 (8월 31일 입주 + 6개월 → 2월 마지막 날)', () => {
  assert.equal(byKey(scheduleOf({ ...plan, moveDate: '2026-08-31', termMonths: 12 })).hug, '2027-02-28');
});

test('iCalendar: CRLF 줄바꿈, 75바이트 줄 접기, 특수문자 처리', () => {
  const ics = buildIcs({ code: 'abcdefghjk', events: scheduleOf(plan), link: 'https://example.com/?plan=abcdefghjk', now: new Date('2026-11-11T00:00:00Z') });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.equal(/[^\r]\n/.test(ics), false);
  const unfolded = ics.replace(/\r\n /g, '');
  assert.match(unfolded, /DTSTART;VALUE=DATE:20261219\r\nDTEND;VALUE=DATE:20261220/);
  assert.match(unfolded, /UID:abcdefghjk-move@zipkimi/);
  assert.match(unfolded, /TRIGGER:-P2DT15H/);
  assert.match(unfolded, /SUMMARY:집키미 · 계약일/);
  assert.equal((unfolded.match(/BEGIN:VEVENT/g) || []).length, 10);
});

test('줄 접기는 한글 글자를 쪼개지 않는다', () => {
  const folded = fold(`DESCRIPTION:${'가'.repeat(60)}`);
  assert.equal(folded.replace(/\r\n /g, ''), `DESCRIPTION:${'가'.repeat(60)}`);
});

const call = (method, path) => calendar.fetch(new Request(`http://x${path}`, { method }));

test('함수: 잘못된 코드는 400, 다른 방식은 405, 키가 없으면 500 NO_KEY', async () => {
  delete process.env.SUPABASE_URL;
  assert.equal((await call('GET', '/api/calendar?code=../etc')).status, 400);
  assert.equal((await call('GET', '/api/calendar')).status, 400);
  assert.equal((await call('POST', '/api/calendar?code=abcdefghjk')).status, 405);
  const res = await call('GET', '/api/calendar?code=abcdefghjk');
  assert.equal(res.status, 500);
  assert.equal((await res.json()).code, 'NO_KEY');
});
