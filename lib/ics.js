// 일정 목록 → iCalendar(.ics) 글자 · RFC 5545
// 캘린더 앱이 이 주소를 구독하면 주기적으로 다시 읽어서, 계약 날짜를 고치면 캘린더도 따라 바뀝니다.

const encoder = new TextEncoder();

// 쉼표·세미콜론·역슬래시·줄바꿈은 앞에 \를 붙여야 합니다
function text(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// 한 줄은 75바이트까지. 넘으면 CRLF + 공백으로 이어 씁니다(한글은 3바이트라 글자 수가 아니라 바이트로 셉니다)
export function fold(line) {
  const parts = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = encoder.encode(ch).length;
    const limit = parts.length ? 74 : 75; // 이어지는 줄은 맨 앞 공백 1바이트를 뺍니다
    if (size + n > limit) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function compact(isoDate) {
  return isoDate.replaceAll('-', '');
}

function nextDay(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return compact(d.toISOString().slice(0, 10));
}

function stamp(now) {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// 하루 종일 일정의 시작(0시) 기준: 3일 전 오전 9시, 전날 오전 9시
const ALARMS = [
  ['-P2DT15H', '3일 남았어요'],
  ['-PT15H', '내일이에요'],
];

export function buildIcs({ code, events, link, now = new Date() }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//zipkimi//contract schedule//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${text('집키미 · 계약 일정')}`,
    'X-WR-TIMEZONE:Asia/Seoul',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${code}-${e.key}@zipkimi`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${nextDay(e.date)}`,
      `SUMMARY:${text(`집키미 · ${e.title}`)}`,
      `DESCRIPTION:${text(`${e.desc}\n\n내 계약 보기: ${link}`)}`,
      `URL:${link}`,
      'TRANSP:TRANSPARENT',
    );
    if (e.alarm) {
      for (const [trigger, when] of ALARMS) {
        lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${text(`${e.title} · ${when}`)}`, `TRIGGER:${trigger}`, 'END:VALARM');
      }
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
