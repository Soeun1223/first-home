# 집키미

집 고르기부터 계약·입주까지 한 번에 확인하는 서비스 · 엘리스 AI 챌린지 PoC 목업

**① 매물 비교:** 직접 본 집을 3단계 체크리스트(필수 판정 / 중요 80점 / 있으면 좋음 20점)로 점수 매기고 카드로 비교합니다. 기록은 브라우저(localStorage)에만 저장합니다.

**② 계약 준비:** 매물 카드에서 **이 집으로 계약 준비**를 누르면 그 집의 보증금·월세·관리비가 계약 가이드에 채워지고, 매물 체크리스트의 필수 확인 결과(전입신고·확정일자·등기부·소유자·건축물대장)가 이어지는 STEP과 함께 맨 위에 보입니다. 계약 예정일과 입주일을 넣으면 STEP 1~4(계약 준비 → 계약서 검토 → 잔금·입주 → 입주 후 관리)에 필요한 일을 날짜순으로 정리합니다. 등기부등본, 대항력 같은 용어를 누르면 뜻과 함께 **"내 계약에서는"** 설명이 펼쳐집니다. 모든 안내에는 공공기관·법령 출처 번호가 붙어 있습니다.

> 등기부·특약 AI 분석 화면은 가상 데이터로 만든 예시입니다. 법률 자문이 아닙니다.

## 구조

브라우저는 Supabase에 직접 닿지 않고, 언제나 Vercel 함수를 거칩니다.

| 파일 | 하는 일 |
|---|---|
| `index.html` | 화면 전체. 머리글의 ① 매물 비교 / ② 계약 준비 탭, 매물 비교·매물 체크리스트 화면, 계약 준비 화면(입력, 타임라인, STEP 1~4, 용어집, 출처) |
| `listings.js` | 매물 비교: 매물 추가·검사, 3단계 체크리스트 점수, 비교 카드, 화면 전환(`#/`, `#/listing/id`, `#/contract`), 고른 집 요약 |
| `contract.js` | 계약 준비: 날짜 계산, 타임라인, STEP 1~4, 용어 펼치기, AI 분석 목업, 링크 저장. 링크를 만들지 않아도 브라우저에 임시 저장 |
| `data/checklist.json` | 매물 체크리스트 항목 27개(필수 5·중요 13·있으면 좋음 9)와 점수 기준 |
| `style.css` | 원룸 매물 체크리스트 디자인 기준으로 통일한 스타일(계약 준비 규칙은 `.cv` 안에서만) |
| `api/plans.js` | `POST/GET/PUT /api/plans` · 내 계약을 코드 하나로 저장하고 `?plan=코드` 링크로 다시 엽니다(secret 키) |
| `api/calendar.js` | `GET /api/calendar?code=코드` · 저장한 계약을 Supabase에서 읽어 계약 일정을 iCalendar로 돌려줍니다. 아이폰·구글 캘린더가 이 주소를 구독하면 날짜를 고칠 때 캘린더도 따라 바뀝니다(secret 키) |
| `lib/schedule.js` | 계약 일정 계산(계약일·신고 마감·입주·대항력·전입 기한·반환보증 마감·세액공제·갱신 기간·만료). 화면 타임라인과 같은 규칙 |
| `lib/ics.js` | 일정 → iCalendar 글자(하루 종일 일정, 3일 전·전날 오전 9시 알림, 75바이트 줄 접기) |
| `lib/plan.js` | 저장할 계약 정보 입력 검사 |
| `lib/db.js` | Supabase 연결, 공통 오류 응답 |
| `terms.json` | 용어집(21개). 자주 바뀌지 않는 공개 데이터라 DB 없이 파일 하나로 둡니다 |
| `supabase/schema.sql` | `plans` 표(공개 역할 접근 없음, 함수만) |
| `tests/calendar.test.mjs` | 일정 날짜가 화면 규칙과 같은지, iCalendar 형식, 캘린더 함수의 잘못된 요청 처리 확인 |
| `tests/plan.test.mjs` | 입력 검사와, 잘못된 요청이 DB에 닿기 전에 걸러지는지 확인 |

## 1. Supabase 표 만들기

Supabase 대시보드 → **SQL Editor**에서 `supabase/schema.sql`을 붙여 넣고 **Run** 합니다.

## 2. Vercel 배포

1. <https://vercel.com/new>에서 GitHub 저장소 `first-home`을 **Import** 합니다. Framework Preset은 **Other**로 둡니다.
2. **Environment Variables**에 두 값을 넣습니다(Supabase → Project Settings → API Keys / Data API).
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY` (서버 전용, 화면 코드에 넣지 않습니다)
3. **Deploy**를 누릅니다. 환경 변수를 나중에 바꿨다면 **Deployments → ⋯ → Redeploy** 합니다.

확인: "이 계약 저장하고 링크·캘린더 받기"를 누르면 `?plan=코드` 링크가 생깁니다.

## 3. 로컬에서 보기

```bash
npm install
npm test
npm run dev   # http://localhost:3000
```

`.env.example`을 `.env.local`로 복사해 값을 넣으면 로컬에서도 Supabase를 씁니다. 값이 없으면 저장 버튼은 오류를 알려 줍니다.

## 용어 고치기

`terms.json`을 고치고 올리면 됩니다. "내 계약에서는" 문장은 입력값으로 계산하므로 `contract.js`의 `MINE`에 있습니다.
