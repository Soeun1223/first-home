// 계약 일정 캘린더 구독 · GET /api/calendar?code=xxxxxxxxxx → text/calendar
//
// "이 계약 저장하고 링크 받기"로 만든 코드의 계약을 Supabase public.plans에서 읽어
// 계약일·신고 마감·입주·반환보증 마감·갱신 기간 같은 일정을 iCalendar로 돌려줍니다.
// 아이폰·구글 캘린더가 이 주소를 구독하면 몇 시간마다 다시 읽으므로, 집키미에서 날짜를 고치면 캘린더도 따라 바뀝니다.
// 코드를 아는 사람만 읽을 수 있고(목록 조회 없음), plans 표는 secret 키를 쓰는 서버 함수만 읽습니다.
import { connect, dbError, fail } from '../lib/db.js';
import { CODE_RE, validatePlan } from '../lib/plan.js';
import { scheduleOf } from '../lib/schedule.js';
import { buildIcs } from '../lib/ics.js';

const TAG = 'calendar';

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fail(405, 'METHOD', '이 주소는 GET 요청만 받습니다.', {}, { Allow: 'GET, HEAD' });
    }
    const url = new URL(request.url);
    const code = (url.searchParams.get('code') ?? '').trim().toLowerCase();
    if (!CODE_RE.test(code)) return fail(400, 'BAD_CODE', '저장 코드는 영문 소문자·숫자 10자리입니다.');

    const db = connect('SUPABASE_SECRET_KEY', TAG);
    if (db.error) return db.error;
    const { data, error } = await db.client.from('plans').select('data').eq('code', code).maybeSingle();
    if (error) return dbError(TAG, '읽기', error, '계약 일정을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    if (!data) return fail(404, 'NOT_FOUND', '이 코드로 저장된 계약이 없습니다. 집키미에서 다시 저장해 주세요.');

    // 저장할 때 검사했지만, 예전에 저장된 값이 깨져 있어도 이상한 캘린더를 만들지 않게 한 번 더 확인합니다
    const checked = validatePlan(data.data);
    if (!checked.ok) return fail(422, 'BAD_PLAN', '저장된 계약 정보가 올바르지 않습니다. 집키미에서 다시 저장해 주세요.');

    const link = `${url.origin}/?plan=${code}`;
    const ics = buildIcs({ code, events: scheduleOf(checked.value), link });
    return new Response(request.method === 'HEAD' ? null : ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="zipkimi.ics"',
        'Cache-Control': 'no-store',
      },
    });
  },
};
