'use strict';

/* ───────── 출처 ───────── */
const SOURCES = {
  1: ['찾기쉬운 생활법령정보(법제처)', '주택임대차 › 계약 전 확인 사항 › 등기부의 확인 등', 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=629&ccfNo=2&cciNo=1&cnpClsNo=1'],
  2: ['찾기쉬운 생활법령정보(법제처)', '주택임대차 › 보증금의 보호 › 대항력 및 우선변제권 취득', 'https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=629&ccfNo=2&cciNo=3&cnpClsNo=1'],
  3: ['찾기쉬운 생활법령정보(법제처)', '주택 임대차 계약 신고제(전월세신고제)', 'https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=629&ccfNo=2&cciNo=2&cnpClsNo=5'],
  4: ['국토교통부 부동산거래관리시스템', '주택 임대차계약 신고 서비스 안내', 'https://rtms.molit.go.kr/main/serviceInfo.do'],
  5: ['서울시 내 손안에 서울', '6월부터 전·월세 계약 꼭 신고하세요', 'https://mediahub.seoul.go.kr/archives/2001807'],
  6: ['정부24', '전입신고', 'https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13100000016'],
  7: ['찾기쉬운 생활법령정보(법제처)', '이사 › 전입신고하기', 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=666&ccfNo=4&cciNo=1&cnpClsNo=1'],
  8: ['주택도시보증공사(HUG)', '전세보증금반환보증 상품개요', 'https://www.khug.or.kr/hug/web/ig/dr/igdr000001.jsp'],
  9: ['대한민국 정책브리핑', '전세보증금반환보증, 계약 기간 1/2 전까지 신청', 'https://www.korea.kr/news/policyNewsView.do?newsId=148940214'],
  10: ['국세청', '월세액 세액공제', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=40613&cntntsId=239025'],
  11: ['주택도시기금', '청년전용 보증부월세대출 자주하는 질문', 'https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020703.jsp'],
  12: ['대한민국 정책브리핑', '청년전용 버팀목전세자금 안내', 'https://www.korea.kr/news/policyNewsView.do?newsId=148935658'],
  13: ['복지로', '청년월세 지원', 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00004661'],
  14: ['국가법령정보센터', '주택임대차보호법 (제3조·제3조의2·제3조의7·제6조의3·제10조)', 'https://www.law.go.kr/법령/주택임대차보호법'],
  15: ['서울시 내 손안에 서울', "덜컥 계약 말고 '이것'부터! 전세사기 예방 체크리스트 (2025.10.14)", 'https://mediahub.seoul.go.kr/archives/2015838'],
  16: ['국토교통부', '실거래가 공개시스템', 'https://rt.molit.go.kr/'],
  17: ['대법원', '인터넷등기소', 'https://www.iros.go.kr/'],
  18: ['국토교통부', '세움터 (건축물대장 열람·발급)', 'https://cloud.eais.go.kr/'],
};

/* ───────── 날짜·금액 도우미 ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DAY = 86400000;
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(d.getDate(), last));
  return x;
}
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
function D(d) { return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${WEEK[d.getDay()]})`; }
function today() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
function dday(d) {
  const diff = Math.round((d - today()) / DAY);
  return diff === 0 ? 'D-DAY' : diff > 0 ? `D-${diff}` : `D+${-diff}`;
}
function won(v) {
  if (!v) return '0원';
  const eok = Math.floor(v / 1e8), man = Math.round((v % 1e8) / 1e4);
  return [eok ? `${eok}억` : '', man ? `${man.toLocaleString('ko-KR')}만` : ''].filter(Boolean).join(' ') + ' 원';
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const T = (key, label) => `<button type="button" class="t" data-t="${key}">${label}</button>`;
const S = (ids) => `<sup class="src">${String(ids).split(',').map((i) => `<a href="#src-${i}" title="${esc(SOURCES[i][0] + ' · ' + SOURCES[i][1])}">${i}</a>`).join('')}</sup>`;

/* ───────── 상태 ───────── */
const REGION_NAME = { metro: '수도권', city: '광역시·세종·도의 시', county: '도의 군 지역' };
function readState() {
  const num = (id) => { const v = Number($(id).value); return Number.isFinite(v) && v >= 0 ? v : 0; };
  const cd = $('#contractDate').value || iso(today());
  let md = $('#moveDate').value || cd;
  if (md < cd) md = cd;
  return {
    type: $('#type-jeonse').checked ? 'jeonse' : 'wolse',
    contractDate: cd, moveDate: md,
    deposit: Math.round(num('#deposit') * 1e4),
    rent: $('#type-jeonse').checked ? 0 : Math.round(num('#rent') * 1e4),
    termMonths: Number($('#termMonths').value) || 24,
    salary: $('#salary').value === '' ? null : Math.round(num('#salary') * 1e4),
    region: $('#region').value,
  };
}
function derive(s) {
  const c = parseDate(s.contractDate), m = parseDate(s.moveDate);
  const end = addMonths(m, s.termMonths);
  const singoTarget = s.region !== 'county' && (s.deposit > 6e7 || s.rent > 3e5);
  const hugBase = m; // 잔금일·전입일 중 늦은 날 (이 목업은 잔금일=입주·전입일로 봐요)
  return {
    c, m, end, singoTarget,
    singoDue: addDays(c, 30),
    daehang: addDays(m, 1),
    jeonipDue: addDays(m, 14),
    hugDue: addMonths(hugBase, Math.floor(s.termMonths / 2)),
    hugLimit: s.region === 'metro' ? 7e8 : 5e8,
    renewFrom: addMonths(end, -6), renewTo: addMonths(end, -2),
  };
}
function taxInfo(s) {
  if (s.type !== 'wolse' || !s.rent) return { ok: false, text: '월세가 없는 전세 계약이라 해당되지 않아요.' };
  const yearly = Math.min(s.rent * 12, 1e7);
  if (s.salary === null) return { ok: null, text: `연 총급여를 넣으면 공제율을 계산해요. 연 월세 ${won(s.rent * 12)} 중 1,000만 원까지 공제 대상이에요.` };
  if (s.salary > 8e7) return { ok: false, text: `총급여 ${won(s.salary)}는 8천만 원을 넘어서 공제 대상이 아니에요.` };
  const rate = s.salary <= 5.5e7 ? 0.17 : 0.15;
  return { ok: true, rate, amount: Math.floor(yearly * rate),
    text: `총급여 ${won(s.salary)} → 공제율 ${Math.round(rate * 100)}%. 1년 월세 ${won(s.rent * 12)} 기준 최대 약 ${won(Math.floor(yearly * rate))}를 돌려받을 수 있어요(무주택 세대주, 85㎡ 이하 또는 기준시가 4억 원 이하, 계약서 주소 = 주민등록 주소일 때).` };
}

/* ───────── 용어: 내 계약에서는? ───────── */
const MINE = {
  deunggi: (s, d) => `계약일 ${D(d.c)} 당일, 그리고 잔금일 ${D(d.m)} 잔금 직전에 한 번 더 새로 떼서 보세요. 계약하고 잔금 사이에 대출이 새로 잡힐 수 있어요.`,
  gapgu: () => '갑구 맨 아래 소유자 이름이 계약서에 쓸 집주인 이름·신분증과 같은지, 신탁·가압류 기록이 없는지 확인하세요.',
  eulgu: (s) => `을구에 근저당이 있다면 채권최고액과 내 보증금 ${won(s.deposit)}을 더한 금액이 시세보다 충분히 낮은지 봐야 해요. STEP 1의 AI 등기부 분석 예시에서 계산해 볼 수 있어요.`,
  geunjeodang: (s, d) => `내 대항력은 ${D(d.daehang)} 0시에 생겨요. 그보다 먼저 설정된 근저당은 경매 때 나보다 먼저 돈을 가져가요.`,
  chaegwon: (s) => `예를 들어 채권최고액이 1억 5,600만 원이면, 경매 비용을 빼고도 집이 ${won(1.56e8 + s.deposit)} 넘게 팔려야 내 보증금 ${won(s.deposit)}을 다 돌려받을 수 있어요.`,
  seonsunwi: (s, d) => `계약일 ${D(d.c)}에 집주인에게 확정일자 부여 현황을 보여 달라고 하면, 나보다 먼저 들어온 세입자의 보증금 합계를 알 수 있어요. 다가구 주택이라면 특히 중요해요.`,
  sintak: () => '갑구에 "신탁"이 보이면 신탁회사가 임대에 동의했는지 확인하기 전에는 계약금을 보내지 마세요. 동의 없이 맺은 계약은 효력이 제한돼요.',
  gaapryu: () => '계약 전 갑구에 이런 기록이 있으면 계약을 다시 생각하세요. 이런 권리가 있으면 HUG 반환보증 가입도 어려워요.',
  geonchuk: () => '용도란이 "근린생활시설"이면 주택이 아니라서 HUG 반환보증 대상이 아니에요. 등기부와 동·호수, 면적이 같은지도 봐요.',
  wiban: () => '위반건축물이면 대출이나 보증 심사에서 거절될 수 있어요. 계약 전에 꼭 확인하세요.',
  jeonsega: (s) => s.deposit ? `내 보증금 ${won(s.deposit)}이 시세의 70%를 넘지 않으려면 시세가 ${won(Math.ceil(s.deposit / 0.7 / 1e6) * 1e6)} 이상이어야 해요.` : '보증금을 넣으면 계산해 줘요.',
  imdaein: (s, d) => `계약일 ${D(d.c)}에 집주인에게 확정일자 부여 현황과 국세·지방세 납세증명서를 요청하세요. 법에 있는 의무라 요청해도 실례가 아니에요.`,
  teukyak: () => 'STEP 2에서 계약서를 올리면 AI가 특약사항을 찾아 위험·주의·권장으로 나눠 쉬운 말로 풀어 줘요. 특히 "잔금일 다음 날까지 담보권 설정 금지" 특약은 꼭 넣는 걸 권해요.',
  hwakjeong: (s, d) => d.singoTarget
    ? `내 계약은 임대차 신고 대상이에요. ${D(d.singoDue)}까지 계약서를 첨부해 신고하면 확정일자가 자동으로 붙어요.`
    : `내 계약은 임대차 신고 대상이 아니라서 확정일자를 따로 받아야 해요. ${D(d.m)} 전입신고할 때 주민센터에서 함께 받으면 돼요.`,
  singo: (s, d) => d.singoTarget
    ? `${REGION_NAME[s.region]}, 보증금 ${won(s.deposit)}${s.rent ? ` · 월세 ${won(s.rent)}` : ''} → 신고 대상이에요. 마감은 ${D(d.singoDue)} (${dday(d.singoDue)})예요.`
    : s.region === 'county' ? '도의 군 지역은 신고 대상이 아니에요.' : `보증금 6천만 원·월세 30만 원 이하라서 신고 대상이 아니에요.`,
  jeonip: (s, d) => `${D(d.m)}에 이사하면 법정 기한은 ${D(d.jeonipDue)}이지만, 대항력 때문에 이사 당일 하는 게 좋아요. 평일 18시 이후나 주말에 온라인으로 하면 다음 근무일에 처리돼요.`,
  daehang: (s, d) => `${D(d.m)}에 입주·전입신고를 하면 대항력은 ${D(d.daehang)} 0시부터 생겨요. 그 사이에 집주인이 새로 대출을 받으면 그 근저당이 나보다 앞서요. 특약으로 막아 두세요.`,
  usun: (s, d) => `대항력(${D(d.daehang)} 0시)과 확정일자를 모두 갖추면 생겨요. 둘 중 늦은 날이 내 순위 기준이 돼요.`,
  hug: (s, d) => `신청 마감은 대략 ${D(d.hugDue)}(계약 기간의 절반)이에요. ${REGION_NAME[s.region] === '수도권' ? '수도권' : '수도권 외'} 보증금 한도는 ${won(d.hugLimit)}이고, 내 보증금은 ${won(s.deposit)}이에요.`,
  gaengsin: (s, d) => `계약 만료가 ${D(d.end)}이면 갱신 요구는 ${D(d.renewFrom)}부터 ${D(d.renewTo)}까지 하세요. 갱신하면서 보증금이 오르면 오른 금액에 확정일자를 다시 받아야 해요.`,
  seaek: (s) => taxInfo(s).text,
};

/* ───────── 그리기 ───────── */
let TERMS = {};
let state, info;

function renderVerdicts() {
  const tax = taxInfo(state);
  const items = [
    ['임대차 신고', info.singoTarget ? `<span class="chip warn">대상</span> ${D(info.singoDue)}까지` : '<span class="chip ok">대상 아님</span>',
      info.singoTarget ? `계약일부터 30일 · ${dday(info.singoDue)}` : '확정일자는 따로 받아요'],
    ['대항력 발생', `<span class="num">${D(info.daehang)}</span> 0시`, '입주·전입 다음 날이에요'],
    ['반환보증 신청 마감', `<span class="num">${D(info.hugDue)}</span>`, state.deposit > info.hugLimit ? `<span class="chip risk">한도 ${won(info.hugLimit)} 초과</span>` : `한도 ${won(info.hugLimit)} 이내`],
    ['월세 세액공제', tax.ok === true ? `<span class="chip ok">가능</span> 약 ${won(tax.amount)}/년` : tax.ok === null ? '<span class="chip info">총급여 필요</span>' : '<span class="chip">해당 없음</span>',
      tax.ok === true ? `공제율 ${Math.round(tax.rate * 100)}% · 요건 충족 시` : ''],
  ];
  $('#verdicts').innerHTML = items.map(([k, v, d]) => `<div class="verdict"><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join('');
}

function renderTimeline() {
  const t0 = today();
  const ev = [
    { d: addDays(info.c, -1), step: 1, title: '계약 전까지 확인', body: `${T('deunggi', '등기부')}·${T('geonchuk', '건축물대장')}·시세를 확인하고 대출 자격을 알아봐요.`, s: '1,15,16' },
    { d: info.c, step: 2, title: '계약일', body: `집주인 신분 확인, ${T('imdaein', '정보 제시')} 요청, ${T('teukyak', '특약')} 검토 후 서명해요.`, s: '1,14', key: true },
    info.singoTarget && { d: info.singoDue, step: 2, title: '임대차 신고 마감', body: `계약일부터 30일 안에 신고하면 ${T('hwakjeong', '확정일자')}도 자동으로 받아요.`, s: '3,4' },
    { d: info.m, step: 3, title: '잔금·입주일', body: `잔금 직전 등기부 재확인 → 잔금(집주인 명의 계좌) → 입주 → 당일 ${T('jeonip', '전입신고')}${info.singoTarget ? '' : '와 확정일자'}.`, s: '1,15,6', key: true },
    { d: info.daehang, step: 3, title: '대항력·우선변제권 발생 (0시)', body: `이때부터 ${T('daehang', '대항력')}과 ${T('usun', '우선변제권')}이 생겨요. 잔금일 당일에 생긴 근저당은 나보다 앞서요.`, s: '2,14', key: true },
    { d: info.jeonipDue, step: 3, title: '전입신고 법정 기한', body: '이사한 날부터 14일. 넘기면 과태료가 붙어요.', s: '6,7' },
    { d: info.hugDue, step: 3, title: '반환보증 신청 마감(대략)', body: `${T('hug', '전세보증금반환보증')}은 계약 기간의 절반이 지나기 전에 신청해요.`, s: '8,9' },
    state.type === 'wolse' && state.rent && { d: new Date(info.m.getFullYear() + 1, 0, 15), step: 4, title: '연말정산 · 월세 세액공제', body: `${T('seaek', '월세 세액공제')}를 신청해요. 놓쳤다면 5년 안에 경정청구할 수 있어요.`, s: '10' },
    { d: info.renewFrom, step: 4, title: '갱신 요구 가능 기간 시작', body: `${D(info.renewTo)}까지 ${T('gaengsin', '계약갱신요구권')}을 쓸 수 있어요.`, s: '14' },
    { d: info.end, step: 4, title: '계약 만료(예상)', body: '보증금을 돌려받은 뒤에 전출하세요. 먼저 전출하면 대항력이 사라져요.', s: '2' },
  ].filter(Boolean).sort((a, b) => a.d - b.d);

  $('#timeline').innerHTML = ev.map((e) => `
    <li class="tl-item${e.d < t0 ? ' past' : ''}${e.key ? ' key' : ''}">
      <div class="tl-date"><span class="d1">${D(e.d)}</span><span class="dday">${e.step === 1 && e.d < info.c ? '계약 전' : dday(e.d)}</span></div>
      <div class="tl-body"><h3><span class="tl-step">STEP ${e.step}</span>${e.title}</h3><p>${e.body}${S(e.s)}</p></div>
    </li>`).join('');
  $('#todayLabel').textContent = `오늘 ${D(t0)} 기준`;
}

function renderStepTexts() {
  const tax = taxInfo(state);
  $('#reportDesc').innerHTML = info.singoTarget
    ? `${REGION_NAME[state.region]}, 보증금 ${won(state.deposit)}${state.rent ? `·월세 ${won(state.rent)}` : ''} → <b>신고 대상</b>이에요. ${D(info.singoDue)}까지 부동산거래관리시스템이나 주민센터에서 신고하면 확정일자도 함께 받아요. 계약서를 내면 한 사람만 신고해도 돼요.${S('3,4,5')}`
    : `<b>신고 대상이 아니에요</b>(${state.region === 'county' ? '도의 군 지역' : '보증금 6천만 원·월세 30만 원 이하'}). 대신 확정일자는 꼭 따로 받아요.${S('3,2')}`;
  $('#jeonipDesc').innerHTML = `${D(info.m)} 이사 당일 정부24나 주민센터에서 해요(법정 기한 ${D(info.jeonipDue)}). 그래야 다음 날 0시에 대항력이 생겨요. 온라인 신청은 본인만 할 수 있어요.${S('6,7,2')}`;
  $('#hugDesc').innerHTML = `HUG 기준 보증 대상 보증금은 ${REGION_NAME[state.region] === '수도권' ? '수도권' : '수도권 외 지역'} ${won(info.hugLimit)} 이하예요(내 보증금 ${won(state.deposit)} ${state.deposit <= info.hugLimit ? '→ 한도 이내' : '→ <b>한도 초과</b>'}). 근린생활시설은 대상이 아니고, 신청은 ${D(info.hugDue)}쯤까지(계약 기간 절반 전) 해야 해요.${S('8,9')}`;
  $('#renewDesc').innerHTML = `만료 예정 ${D(info.end)}. 갱신 요구는 ${D(info.renewFrom)} ~ ${D(info.renewTo)} 사이에 하고, 한 번 쓸 수 있어요. 인상은 5%까지예요.${S('14,2')}`;
  $('#taxDesc').innerHTML = `${tax.text}${S('10')}`;

  const monthly = state.rent + Math.round((Number($('#fee').value) || 0) * 1e4);
  const income = Math.round((Number($('#income').value) || 0) * 1e4);
  $('#budgetOut').innerHTML = income
    ? `월 주거비 <b class="num">${won(monthly)}</b> = 월 실수령액의 <b class="num">${Math.round(monthly / income * 100)}%</b>. 보증금 ${won(state.deposit)}은 계약금(보통 10%)과 잔금으로 나눠 내요.`
    : '월 실수령액을 넣으면 주거비 비율을 계산해요.';
}

/* 계약서 필수 항목·하자 점검: 하위 체크 */
const ITEMS = [
  ['i-addr', '주소가 등기부·건축물대장의 동·호수와 같다'],
  ['i-money', '보증금·월세·계약금·잔금 액수와 지급일이 적혀 있다'],
  ['i-term', '임대차 기간(시작일·만료일)이 적혀 있다'],
  ['i-account', '보증금 입금 계좌가 집주인 명의다'],
  ['i-fee', '관리비 금액과 포함 항목이 적혀 있다'],
];
const DEFECTS = [
  ['d-water', '수압·배수, 변기·싱크대 누수'],
  ['d-mold', '벽·창틀 곰팡이, 천장 누수 자국'],
  ['d-boiler', '보일러 온수·난방 작동'],
  ['d-window', '창문 잠금·방충망'],
  ['d-power', '콘센트·조명·인터폰'],
  ['d-lock', '현관 도어락 비밀번호 변경'],
];
function renderSubs() {
  const sub = (list) => list.map(([id, text]) => `<li><label><input type="checkbox" data-sub="${id}"> <span>${text}</span></label></li>`).join('');
  $('#itemsSub').innerHTML = sub(ITEMS);
  $('#defectSub').innerHTML = sub(DEFECTS);
  $('#itemsSub').insertAdjacentHTML('afterend', `<p class="desc" style="margin-top:6px">주소·소유자·계좌 확인 근거${S('1,15')}</p>`);
}

/* AI 등기부 분석 예시 (가상 데이터) */
const REG = {
  safe: {
    price: 32000,
    gap: [['1', '2019.03.11', '소유권이전', '소유자 김○○ (계약 상대방과 같음)']],
    eul: [['1', '2021.05.20', '근저당권설정', '채권최고액 금 96,000,000원 · 근저당권자 ○○은행']],
    max: 9.6e7,
    flags: [
      ['ok', '소유자 일치', '갑구 소유자가 계약 상대방과 같아요. 계약일에 신분증으로 한 번 더 확인하세요.', 'gapgu'],
      ['ok', '소유권 제한 없음', '압류·가압류·신탁 기록이 없어요.', 'gaapryu'],
      ['warn', '근저당 1건', '을구에 채권최고액 9,600만 원 근저당이 있어요. 아래에서 시세 대비 비율을 확인하세요.', 'chaegwon'],
    ],
  },
  risky: {
    price: 28000,
    gap: [
      ['1', '2023.02.06', '소유권이전', '소유자 박○○'],
      ['2', '2023.08.14', '신탁', '수탁자 ○○부동산신탁 (신탁원부 제2023-○○호)'],
      ['3', '2026.07.02', '가압류', '청구금액 금 30,000,000원 · 채권자 ○○캐피탈'],
    ],
    eul: [['1', '2023.02.06', '근저당권설정', '채권최고액 금 240,000,000원 · 근저당권자 ○○저축은행']],
    max: 2.4e8,
    flags: [
      ['risk', '신탁등기', '소유권이 신탁회사에 있어요. 신탁회사 동의 없이 맺은 계약은 효력이 제한돼요.', 'sintak'],
      ['risk', '가압류', '2026.07 가압류가 있어요. 경매로 이어질 수 있고 반환보증 가입도 어려워요.', 'gaapryu'],
      ['warn', '큰 근저당', '채권최고액 2억 4천만 원이 시세에 비해 커요.', 'chaegwon'],
    ],
  },
};
let regKey = 'risky';
function renderRegistry(resetPrice) {
  const r = REG[regKey];
  if (resetPrice) $('#price').value = r.price;
  const row = (part, rows) => rows.map((x, i) => `<tr>${i === 0 ? `<td class="part" rowspan="${rows.length}">${part}</td>` : ''}<td class="num">${x[0]}</td><td class="num">${x[1]}</td><td>${x[2]}</td><td>${x[3]}</td></tr>`).join('');
  $('#regTable').innerHTML = `<thead><tr><th>구분</th><th>순위</th><th>접수</th><th>등기 목적</th><th>권리자 및 기타</th></tr></thead><tbody>${row(T('gapgu', '갑구'), r.gap)}${row(T('eulgu', '을구'), r.eul)}</tbody>`;
  const label = { ok: '안전', warn: '주의', risk: '위험' };
  $('#regFlags').innerHTML = r.flags.map(([lv, t, d, k]) => `<li><span class="chip ${lv}">${label[lv]}</span><span><b>${T(k, t)}</b> · ${d}</span></li>`).join('');
  renderMeter();
}
function renderMeter() {
  const r = REG[regKey];
  const price = (Number($('#price').value) || 0) * 1e4;
  if (!price) { $('#regMeter').innerHTML = '<span class="status">시세를 넣으면 비율을 계산해요.</span>'; return; }
  const dep = state.deposit;
  const jeonse = dep / price, total = (dep + r.max) / price;
  const bar = (v, color) => `<div class="bar"><span style="width:${Math.min(v, 1) * 100}%;background:var(${color})"></span><i class="tick" style="left:70%"></i></div>`;
  const lv = (v) => v > 0.7 ? (v > 1 ? 'risk' : 'warn') : 'ok';
  $('#regMeter').innerHTML = `
    <div class="lab"><span>${T('jeonsega', '전세가율')} = 내 보증금 ${won(dep)} ÷ 시세</span><b class="num">${Math.round(jeonse * 100)}%</b></div>
    ${bar(jeonse, lv(jeonse) === 'ok' ? '--green' : lv(jeonse) === 'warn' ? '--amber' : '--red')}
    <div class="lab"><span>${T('seonsunwi', '선순위')} 채권최고액까지 더하면</span><b class="num">${Math.round(total * 100)}%</b></div>
    ${bar(total, lv(total) === 'ok' ? '--green' : lv(total) === 'warn' ? '--amber' : '--red')}
    <p class="desc" style="margin:0">검은 선은 70%예요. 서울시는 전세가율 70% 이하를 권해요${S('15')}. ${total > 1 ? '<b style="color:var(--red)">빚과 보증금을 합친 금액이 시세를 넘어요. 깡통전세 위험이 커요.</b>' : total > 0.7 ? '빚까지 합치면 70%를 넘어요. 다른 세입자 보증금도 확인하세요.' : '빚까지 합쳐도 70% 이하예요.'}</p>`;
}

/* AI 특약 해설 예시 */
const CLAUSES = [
  ['risk', '임대인은 보증금을 새로운 임차인이 입주한 후 반환한다.',
    '보증금 반환을 다음 세입자에게 묶어 둔 문구예요. 새 세입자가 안 구해지면 만료일에 돈을 못 받을 수 있어요.',
    '"임대인은 계약 만료일에 보증금 전액을 반환한다."로 바꿔 달라고 하세요.'],
  ['warn', '임차인은 퇴실 시 모든 원상복구 비용을 부담한다.',
    '"모든"의 범위가 모호해요. 오래 살면서 생기는 자연스러운 낡음까지 포함되는지 다툼이 생길 수 있어요.',
    '"임차인의 고의·과실로 생긴 훼손에 한한다."로 범위를 좁히고, 입주 날 사진을 남기세요.'],
  ['ok', '임대인은 잔금일 다음 날까지 이 주택에 저당권 등 담보권을 설정하지 않는다. 위반 시 임차인은 계약을 해제할 수 있고 임대인은 보증금 전액을 즉시 반환한다.',
    `잔금일부터 ${T('daehang', '대항력')}이 생기는 다음 날 0시까지 하루 동안 생기는 공백을 막아 주는 특약이에요.`,
    '그대로 넣으세요. 이 서비스가 기본으로 권하는 특약이에요.'],
  ['ok', '임대인의 사유로 전세보증금반환보증 가입이 거절되면 임차인은 계약을 해제할 수 있고, 임대인은 받은 금액 전부를 돌려준다.',
    `${T('hug', '반환보증')} 가입이 막히는 집(위반건축물, 과도한 빚 등)이면 계약을 물릴 수 있게 해 줘요.`,
    '보증금이 크다면 넣는 걸 권해요.'],
];
function renderClauses() {
  const label = { ok: '권장', warn: '주의', risk: '위험' };
  $('#clauses').innerHTML = CLAUSES.map(([lv, q, why, fix]) => `
    <div class="clause"><div><span class="chip ${lv}">${label[lv]}</span></div>
      <q>${q}</q><span>${why}</span><span class="fix"><b>AI 제안</b> · ${fix}</span></div>`).join('');
}

/* 보증금 보호 절차 점검 */
function renderProtect() {
  const done = (id) => $(`[data-id="${id}"] input[type="checkbox"]`)?.checked;
  const rows = [
    ['s3-jeonip', '전입신고 (대항력)'],
    ['s2-report', info.singoTarget ? '임대차 신고 (확정일자 자동)' : '확정일자 받기'],
    ['s3-hug', '보증금 반환보증 가입'],
    ['s3-recheck', '잔금 직전 등기부 재확인'],
  ];
  $('#protectList').innerHTML = rows.map(([id, t]) => `<li><span class="chip ${done(id) ? 'ok' : 'warn'}">${done(id) ? '완료' : '남음'}</span><span>${t}</span></li>`).join('');
}

function renderProgress() {
  ['s1', 's2', 's3', 's4'].forEach((s) => {
    const boxes = $$(`#step${s[1]} .checks > li > input[type="checkbox"]`);
    const n = boxes.filter((b) => b.checked).length;
    $(`[data-progress="${s}"]`).textContent = `${n}/${boxes.length} 완료`;
    boxes.forEach((b) => b.closest('li').classList.toggle('done', b.checked));
  });
}

function renderSources() {
  $('#sources').innerHTML = Object.entries(SOURCES).map(([i, [org, title, url]]) =>
    `<li id="src-${i}" value="${i}">${org} · <a href="${url}" target="_blank" rel="noopener">${title}</a></li>`).join('');
  $$('sup.src[data-s]').forEach((el) => { el.outerHTML = S(el.dataset.s); });
}

function renderGlossary() {
  $('#glossary').innerHTML = Object.values(TERMS).map((t) => `
    <details id="term-${t.key}"><summary>${esc(t.name)}${t.aka ? ` <span class="aka">${esc(t.aka)}</span>` : ''}</summary>
      <p>${esc(t.def)}${S(t.sources.join(','))}</p>
      ${MINE[t.key] ? `<div class="mine"><b>내 계약에서는</b> ${MINE[t.key](state, info)}</div>` : ''}
    </details>`).join('');
}

function renderAll() {
  state = readState();
  info = derive(state);
  renderVerdicts();
  renderTimeline();
  renderStepTexts();
  renderMeter();
  renderProtect();
  renderProgress();
  if (Object.keys(TERMS).length) renderGlossary();
  refreshOpenCards();
  saveDraft();
}

/* ───────── 용어 펼치기 ───────── */
function termCardHTML(key) {
  const t = TERMS[key];
  if (!t) return '<p>용어집을 불러오는 중이에요.</p>';
  const mine = MINE[key] ? `<div class="mine"><b>내 계약에서는</b>${MINE[key](state, info)}</div>` : '';
  return `<header><strong>${esc(t.name)}${t.aka ? ` <span class="aka">${esc(t.aka)}</span>` : ''}</strong><button type="button" class="close" aria-label="닫기">닫기 ✕</button></header>
    <p>${esc(t.def)}${S(t.sources.join(','))}</p>${mine}`;
}
// 용어 카드는 그 용어가 들어 있는 문단·항목 바로 아래에 펼칩니다
const HOSTS = '.tl-body, .checks > li > div, .clause, .flags li, .meter, .loans div, .hero .wrap';
function toggleTerm(btn) {
  const key = btn.dataset.t;
  const host = btn.closest('td') ? btn.closest('.ai-body') : (btn.closest(HOSTS) || btn.parentElement);
  const existing = host.querySelector(':scope > .term-card');
  const wasSame = existing && existing.dataset.key === key;
  if (existing) { existing.remove(); $$('.t[aria-expanded="true"]', host).forEach((b) => b.setAttribute('aria-expanded', 'false')); }
  if (wasSame) return;
  const card = document.createElement('div');
  card.className = 'term-card';
  card.dataset.key = key;
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', `${TERMS[key]?.name ?? '용어'} 설명`);
  card.innerHTML = termCardHTML(key);
  host.appendChild(card);
  btn.setAttribute('aria-expanded', 'true');
}
function refreshOpenCards() {
  $$('.term-card').forEach((c) => { c.innerHTML = termCardHTML(c.dataset.key); });
}
document.addEventListener('click', (e) => {
  const close = e.target.closest('.term-card .close');
  if (close) {
    const card = close.closest('.term-card');
    const host = card.parentElement;
    card.remove();
    $$(`.t[data-t="${card.dataset.key}"][aria-expanded="true"]`, host).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    return;
  }
  const btn = e.target.closest('button.t');
  if (btn) { e.preventDefault(); toggleTerm(btn); }
});

/* ───────── 용어집 불러오기: terms.json (자주 바뀌지 않는 공개 데이터라 파일 하나로 충분) ───────── */
async function loadTerms() {
  let items;
  try {
    const res = await fetch('terms.json?v=20261111');
    if (!res.ok) throw new Error(String(res.status));
    items = await res.json();
    if (!Array.isArray(items)) throw new Error('형식 오류');
  } catch {
    $('#termSource').textContent = '용어집을 불러오지 못했어요. 새로고침해 주세요.';
    return;
  }
  TERMS = Object.fromEntries(items.map((t) => [t.key, t]));
  $('#termSource').textContent = `용어 ${items.length}개`;
  renderGlossary();
  refreshOpenCards();
}

/* ───────── 내 계약 저장: Supabase(plans) ───────── */
let planCode = null;
let saveTimer = null;
function checksNow() {
  return [
    ...$$('.checks > li > input[type="checkbox"]').filter((b) => b.checked).map((b) => b.closest('li').dataset.id),
    ...$$('[data-sub]').filter((b) => b.checked).map((b) => b.dataset.sub),
  ];
}
function payload() {
  const s = readState();
  return { data: { ...s, checks: checksNow() } };
}
function setStatus(text, err) { const el = $('#saveStatus'); el.textContent = text; el.classList.toggle('err', !!err); }
function showShare() {
  const url = `${location.origin}${location.pathname}?plan=${planCode}`;
  $('#shareUrl').value = url;
  $('#shareRow').hidden = false;
  $('#saveBtn').textContent = '지금 저장하기';
  history.replaceState(null, '', `?plan=${planCode}#/contract`);
  // 캘린더 구독 주소: 캘린더 앱은 webcal:// 로 열면 구독 화면을 띄웁니다
  const feed = `${location.host}/api/calendar?code=${planCode}`;
  $('#calApple').href = `webcal://${feed}`;
  $('#calGoogle').href = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`webcal://${feed}`)}`;
  $('#calCopy').dataset.url = `${location.protocol}//${feed}`;
  $('#calBox').hidden = false;
}
async function save() {
  const btn = $('#saveBtn');
  btn.disabled = true;
  setStatus('저장하는 중…');
  try {
    const res = await fetch(planCode ? `/api/plans?code=${planCode}` : '/api/plans', {
      method: planCode ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload()),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `저장하지 못했어요 (${res.status}).`);
    planCode = body.code;
    showShare();
    const t = new Date();
    setStatus(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}에 저장했어요. 이 링크로 다시 열 수 있어요.`);
  } catch (err) {
    setStatus(err.message === 'Failed to fetch' ? '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.' : err.message, true);
  } finally {
    btn.disabled = false;
  }
}
function autosave() {
  if (!planCode) return;
  clearTimeout(saveTimer);
  setStatus('바뀐 내용이 있어요. 잠시 뒤 자동 저장해요.');
  saveTimer = setTimeout(save, 1500);
}
function applyData(d) {
  $(d.type === 'jeonse' ? '#type-jeonse' : '#type-wolse').checked = true;
  $('#contractDate').value = d.contractDate;
  $('#moveDate').value = d.moveDate;
  $('#deposit').value = d.deposit / 1e4;
  $('#rent').value = d.rent / 1e4;
  $('#termMonths').value = String(d.termMonths);
  $('#salary').value = d.salary === null ? '' : d.salary / 1e4;
  $('#region').value = d.region;
  if (d.fee !== undefined) $('#fee').value = d.fee;
  if (d.income !== undefined) $('#income').value = d.income;
  const set = new Set(d.checks);
  $$('.checks > li > input[type="checkbox"]').forEach((b) => { b.checked = set.has(b.closest('li').dataset.id); });
  $$('[data-sub]').forEach((b) => { b.checked = set.has(b.dataset.sub); });
  syncRentField();
}

/* ───────── 이 브라우저에 임시 저장: 링크를 만들지 않아도 새로고침해도 남게 ───────── */
const DRAFT_KEY = 'zipkimi:contract:v1';
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readState(), checks: checksNow(), fee: $('#fee').value, income: $('#income').value }));
  } catch { /* 저장이 막힌 브라우저에서는 화면에서만 유지 */ }
}
function restoreDraft() {
  let d;
  try {
    d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return false;
  }
  if (!d || typeof d !== 'object' || !d.contractDate || !Array.isArray(d.checks)) return false;
  try {
    applyData(d);
  } catch {
    return false;
  }
  return true;
}

async function loadPlan(code) {
  setStatus('저장한 계약을 불러오는 중…');
  try {
    const res = await fetch(`/api/plans?code=${encodeURIComponent(code)}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `불러오지 못했어요 (${res.status}).`);
    applyData(body.data);
    planCode = body.code;
    renderAll();
    showShare();
    setStatus('저장한 계약을 불러왔어요. 고치면 자동 저장돼요.');
  } catch (err) {
    setStatus(err.message === 'Failed to fetch' ? '서버에 연결하지 못했어요.' : err.message, true);
  }
}

/* ───────── 이벤트 ───────── */
function syncRentField() {
  const jeonse = $('#type-jeonse').checked;
  $('#rent').disabled = jeonse;
  if (jeonse) $('#rent').value = 0;
}
$$('.form-panel input, .form-panel select').forEach((el) => el.addEventListener('input', () => {
  if (el.name === 'type') syncRentField();
  if (el.id === 'shareUrl') return;
  renderAll();
  autosave();
}));
$$('#income, #fee').forEach((el) => el.addEventListener('input', () => { renderStepTexts(); saveDraft(); }));
$('#price').addEventListener('input', renderMeter);
document.addEventListener('change', (e) => {
  if (e.target.matches('.checks input[type="checkbox"], [data-sub]')) { renderProgress(); renderProtect(); saveDraft(); autosave(); }
});
/* ───────── AI 업로드 흐름 (목업): 파일 선택 → 분석 단계 표시 → 예시 결과 ─────────
   실제 서비스에서는 이 자리에서 파일을 Vercel 함수로 보내 AI(OCR + LLM)가 읽습니다.
   목업은 파일을 브라우저 밖으로 보내지 않고, 이름·미리보기만 보여 준 뒤 예시 결과를 펼칩니다. */
const AI_STEPS = {
  reg: ['문서 글자 읽기 (OCR)', '표제부·갑구·을구 기록 나누기', '근저당·신탁·가압류 위험 신호 찾기'],
  contract: ['계약서 글자 읽기 (OCR)', '특약사항 조항 찾기', '내 계약 기준으로 위험도 판단하기'],
};
const MAX_FILE = 10 * 1024 * 1024;
const slow = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, slow ? ms : 0));

function aiParts(kind) {
  const box = $(`.ai-upload[data-ai="${kind}"]`);
  const body = box.parentElement;
  return { box, body, progress: $('.ai-progress', body), result: $('.ai-result', body), chip: $('[data-file]', body) };
}
let previewUrl = {};
async function runAI(kind, file) {
  const p = aiParts(kind);
  const err = $('.err', p.box);
  if (err) err.remove();
  if (file && !(/^image\//.test(file.type) || file.type === 'application/pdf')) {
    p.box.insertAdjacentHTML('beforeend', '<p class="note err" role="alert">사진(JPG·PNG 등)이나 PDF 파일만 올릴 수 있어요.</p>');
    return;
  }
  if (file && file.size > MAX_FILE) {
    p.box.insertAdjacentHTML('beforeend', '<p class="note err" role="alert">파일이 10MB를 넘어요. 더 작은 사진이나 PDF로 올려 주세요.</p>');
    return;
  }
  if (previewUrl[kind]) URL.revokeObjectURL(previewUrl[kind]);
  previewUrl[kind] = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
  const name = file ? file.name : (kind === 'reg' ? '샘플_등기사항전부증명서.pdf' : '샘플_주택임대차계약서.pdf');
  const thumb = previewUrl[kind] ? `<img src="${previewUrl[kind]}" alt="">` : '<span class="pdf">PDF</span>';
  p.chip.innerHTML = `${thumb}<span>${esc(name)}</span>`;

  p.box.hidden = true;
  p.result.hidden = true;
  p.progress.hidden = false;
  const steps = AI_STEPS[kind];
  p.progress.innerHTML = `<div class="file-chip">${thumb}<span>${esc(name)}</span></div>
    <ol class="ai-steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
    <p class="note" role="status">AI가 문서를 읽고 있어요…</p>`;
  const items = $$('.ai-steps li', p.progress);
  for (const li of items) { li.classList.add('doing'); await wait(650); li.classList.replace('doing', 'done'); }
  await wait(250);

  p.progress.hidden = true;
  p.result.hidden = false;
  if (kind === 'reg') renderRegistry(true);
  else {
    const n = { risk: 0, warn: 0, ok: 0 };
    CLAUSES.forEach(([lv]) => { n[lv] += 1; });
    $('#clauseSummary').innerHTML = `특약 ${CLAUSES.length}개를 찾았어요 · <span class="chip risk">위험 ${n.risk}</span> <span class="chip warn">주의 ${n.warn}</span> <span class="chip ok">권장 ${n.ok}</span>`;
  }
  p.result.querySelector('.result-h').scrollIntoView({ block: 'nearest', behavior: slow ? 'smooth' : 'auto' });
}
function resetAI(kind) {
  const p = aiParts(kind);
  if (previewUrl[kind]) { URL.revokeObjectURL(previewUrl[kind]); previewUrl[kind] = null; }
  $('input[type="file"]', p.box).value = '';
  p.result.hidden = true;
  p.progress.hidden = true;
  p.box.hidden = false;
}
$$('.ai-upload').forEach((box) => {
  const kind = box.dataset.ai;
  const input = $('input[type="file"]', box);
  const drop = $('.drop', box);
  input.addEventListener('change', () => { if (input.files[0]) runAI(kind, input.files[0]); });
  $('[data-run-sample]', box).addEventListener('click', () => runAI(kind, null));
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) runAI(kind, f); });
  $('[data-reset]', box.parentElement).addEventListener('click', () => resetAI(kind));
});

$$('#regDemo .tabs button').forEach((b) => b.addEventListener('click', () => {
  regKey = b.dataset.sample;
  $$('#regDemo .tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderRegistry(true);
}));
$('#saveBtn').addEventListener('click', save);
$('#calCopy').addEventListener('click', async (e) => {
  const url = e.currentTarget.dataset.url;
  try { await navigator.clipboard.writeText(url); setStatus('캘린더 주소를 복사했어요. 캘린더 앱의 ‘URL로 구독’에 붙여 넣으세요.'); }
  catch { $('#shareUrl').value = url; $('#shareUrl').select(); setStatus('캘린더 주소를 위 칸에 넣었어요. 복사해서 쓰세요.'); }
});
$('#copyBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#shareUrl').value); setStatus('링크를 복사했어요.'); }
  catch { $('#shareUrl').select(); setStatus('링크를 선택했어요. 복사해서 쓰세요.'); }
});

/* ───────── 매물 비교 → 계약 준비 연결 ───────── */
// 금액 단위: 매물 비교도 만 원, 계약 준비 입력칸도 만 원
window.zipkimiContract = {
  fill(listing) {
    $(listing.rent > 0 ? '#type-wolse' : '#type-jeonse').checked = true;
    syncRentField();
    $('#deposit').value = listing.deposit;
    $('#rent').value = listing.rent;
    $('#fee').value = listing.fee;
    renderAll();
    autosave();
    setStatus(`‘${listing.name}’의 보증금·월세·관리비를 채웠어요. 계약일과 입주일을 내 날짜로 바꿔 보세요.`);
  },
};

/* ───────── 시작 ───────── */
renderSources();
renderSubs();
renderClauses();
const startCode = new URLSearchParams(location.search).get('plan');
if (!startCode && restoreDraft()) setStatus('이 브라우저에 저장해 둔 계약 준비 내용을 불러왔어요.');
state = readState(); info = derive(state);
renderRegistry(true);
renderAll();
loadTerms();
if (startCode) loadPlan(startCode);
