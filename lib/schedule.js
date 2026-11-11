// 계약 일정 계산 · api/calendar.js와 시험(tests/calendar.test.mjs)이 함께 씁니다.
// 화면의 타임라인(contract.js의 derive·renderTimeline)과 같은 규칙입니다. 규칙을 바꾸면 두 곳을 함께 고칩니다.
// 날짜는 'YYYY-MM-DD' 글자로 주고받고, 계산은 UTC 자정 기준으로 해서 서버 시간대와 상관없이 같은 날짜가 나옵니다.

function toDate(text) {
  const [y, m, d] = text.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, n) {
  const x = new Date(date);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

// 1월 31일 + 1개월 → 2월 마지막 날처럼, 없는 날짜는 그 달의 마지막 날로 맞춥니다
function addMonths(date, n) {
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(date.getUTCDate(), last));
  return first;
}

// plan: lib/plan.js의 validatePlan을 통과한 값(금액은 원 단위)
export function scheduleOf(plan) {
  const c = toDate(plan.contractDate);
  const m = toDate(plan.moveDate);
  const end = addMonths(m, plan.termMonths);
  const singoTarget = plan.region !== 'county' && (plan.deposit > 6e7 || plan.rent > 3e5);
  const renewFrom = addMonths(end, -6);
  const renewTo = addMonths(end, -2);

  const events = [
    {
      key: 'contract', date: c, alarm: true,
      title: '계약일',
      desc: '집주인 신분증과 등기부상 소유자가 같은지 확인하고, 확정일자 부여 현황·납세증명서를 요청하세요. 특약사항을 검토한 뒤 서명해요.',
    },
    singoTarget && {
      key: 'singo', date: addDays(c, 30), alarm: true,
      title: '임대차 신고 마감',
      desc: '계약일부터 30일 안에 부동산거래관리시스템이나 주민센터에서 신고하면 확정일자도 함께 받아요.',
    },
    {
      key: 'move', date: m, alarm: true,
      title: '잔금·입주일 · 전입신고',
      desc: `잔금 직전에 등기부를 다시 떼어 새 근저당·가압류가 없는지 보고, 잔금은 집주인 명의 계좌로 보내요. 이사 당일 전입신고${singoTarget ? '' : '와 확정일자'}를 해요.`,
    },
    {
      key: 'daehang', date: addDays(m, 1), alarm: false,
      title: '대항력·우선변제권 발생 (0시)',
      desc: '입주·전입신고 다음 날 0시부터 대항력이 생겨요. 확정일자까지 갖추면 우선변제권도 생겨요.',
    },
    {
      key: 'jeonip', date: addDays(m, 14), alarm: true,
      title: '전입신고 법정 기한',
      desc: '이사한 날부터 14일이 지나면 과태료가 붙어요. 아직 안 했다면 오늘 하세요.',
    },
    {
      key: 'hug', date: addMonths(m, Math.floor(plan.termMonths / 2)), alarm: true,
      title: '전세보증금반환보증 신청 마감(대략)',
      desc: '계약 기간의 절반이 지나기 전에 신청해야 해요. 정확한 마감은 HUG에서 확인하세요.',
    },
    plan.type === 'wolse' && plan.rent > 0 && {
      key: 'tax', date: new Date(Date.UTC(m.getUTCFullYear() + 1, 0, 15)), alarm: true,
      title: '연말정산 · 월세 세액공제',
      desc: '임대차계약서와 월세 이체 내역을 준비해 월세 세액공제를 신청하세요. 놓쳤다면 5년 안에 경정청구할 수 있어요.',
    },
    {
      key: 'renew-from', date: renewFrom, alarm: true,
      title: '계약갱신요구 가능 기간 시작',
      desc: `오늘부터 ${isoDate(renewTo)}까지 계약갱신요구권을 쓸 수 있어요. 인상은 5%까지예요.`,
    },
    {
      key: 'renew-to', date: renewTo, alarm: true,
      title: '계약갱신요구 마감',
      desc: '갱신하려면 오늘까지 집주인에게 알려야 해요. 갱신하면서 보증금이 오르면 오른 금액에 확정일자를 다시 받아요.',
    },
    {
      key: 'end', date: end, alarm: true,
      title: '계약 만료(예상)',
      desc: '보증금을 돌려받은 뒤에 전출하세요. 먼저 전출하면 대항력이 사라져요.',
    },
  ].filter(Boolean);

  return events
    .map((e) => ({ ...e, date: isoDate(e.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
