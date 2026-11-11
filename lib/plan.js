// "내 계약 저장" 입력 검사 · api/plans.js와 시험(tests/plan.test.mjs)이 함께 씁니다.
// 허용한 필드만 골라 새 객체로 돌려줍니다. 모르는 필드는 버리고, 값이 틀리면 고칠 방법을 알려 줍니다.

export const CODE_RE = /^[a-z0-9]{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CHECK_RE = /^[a-z0-9-]{1,40}$/;
const MAX_CHECKS = 100;

const REGIONS = ['metro', 'city', 'county'];
const TYPES = ['jeonse', 'wolse'];

function isRealDate(text) {
  if (typeof text !== 'string' || !DATE_RE.test(text)) return false;
  const [y, m, d] = text.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && y >= 2000 && y <= 2100;
}

function intIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function bad(field, message) {
  return { ok: false, error: { code: 'BAD_FIELD', field, message } };
}

export function validatePlan(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return bad('data', '저장할 내용을 객체로 보내 주세요.');

  const { contractDate, moveDate, type, deposit, rent, region, termMonths, salary = null, checks = [] } = input;

  if (!isRealDate(contractDate)) return bad('contractDate', '계약 예정일을 YYYY-MM-DD 형식으로 보내 주세요.');
  if (!isRealDate(moveDate)) return bad('moveDate', '잔금·입주일을 YYYY-MM-DD 형식으로 보내 주세요.');
  if (moveDate < contractDate) return bad('moveDate', '잔금·입주일은 계약 예정일과 같거나 뒤여야 합니다.');
  if (!TYPES.includes(type)) return bad('type', '계약 유형은 jeonse 또는 wolse 중 하나입니다.');
  if (!intIn(deposit, 0, 5_000_000_000)) return bad('deposit', '보증금은 0원~50억 원 사이 정수(원)로 보내 주세요.');
  if (!intIn(rent, 0, 50_000_000)) return bad('rent', '월세는 0원~5천만 원 사이 정수(원)로 보내 주세요.');
  if (!REGIONS.includes(region)) return bad('region', '지역은 metro, city, county 중 하나입니다.');
  if (!intIn(termMonths, 1, 120)) return bad('termMonths', '계약 기간은 1~120개월입니다.');
  if (salary !== null && !intIn(salary, 0, 10_000_000_000)) return bad('salary', '총급여는 비워 두거나 0 이상 정수(원)로 보내 주세요.');
  if (!Array.isArray(checks) || checks.length > MAX_CHECKS || !checks.every((c) => typeof c === 'string' && CHECK_RE.test(c))) {
    return bad('checks', `체크 항목은 영문 소문자·숫자·하이픈 이름 ${MAX_CHECKS}개 이하로 보내 주세요.`);
  }

  return {
    ok: true,
    value: { contractDate, moveDate, type, deposit, rent, region, termMonths, salary, checks: [...new Set(checks)].sort() },
  };
}

// 헷갈리는 글자(0/o, 1/l 등)를 뺀 소문자·숫자 10자리
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
