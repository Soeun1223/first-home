# 처음이라, 내 집

사회초년생을 위한 AI 주거 계약 가이드 · 엘리스 AI 챌린지 PoC 목업

계약 예정일과 입주일을 넣으면 STEP 1~4(계약 준비 → 계약서 검토 → 잔금·입주 → 입주 후 관리)에 필요한 일을 날짜순으로 정리합니다. 등기부등본, 대항력 같은 용어를 누르면 뜻과 함께 **"내 계약에서는"** 설명이 펼쳐집니다. 모든 안내에는 공공기관·법령 출처 번호가 붙어 있습니다.

> 등기부·특약 AI 분석 화면은 가상 데이터로 만든 예시입니다. 법률 자문이 아닙니다.

## 구조

브라우저는 Supabase에 직접 닿지 않고, 언제나 Vercel 함수를 거칩니다.

| 파일 | 하는 일 |
|---|---|
| `index.html` | 화면 전체(입력, 타임라인, STEP 1~4, 용어 펼치기, 용어집, 출처) |
| `api/terms.js` | `GET /api/terms` · Supabase `terms` 표를 읽습니다(publishable 키, CDN 10분 캐시) |
| `api/plans.js` | `POST/GET/PUT /api/plans` · 내 계약을 코드 하나로 저장하고 `?plan=코드` 링크로 다시 엽니다(secret 키) |
| `lib/plan.js` | 저장할 계약 정보 입력 검사 |
| `lib/db.js` | Supabase 연결, 공통 오류 응답 |
| `terms.json` | 용어집 원본. Supabase 연결 전에는 화면이 이 파일을 대신 씁니다 |
| `supabase/schema.sql` | `terms`(누구나 읽기만), `plans`(공개 역할 접근 없음, 함수만) 표 |
| `supabase/seed-terms.sql` | `terms.json`으로 만든 용어 데이터(`npm run seed`로 다시 만듭니다) |
| `tests/plan.test.mjs` | 입력 검사와, 잘못된 요청이 DB에 닿기 전에 걸러지는지 확인 |

## 1. Supabase 표 만들기

Supabase 대시보드 → **SQL Editor**에서 아래 두 파일을 순서대로 붙여 넣고 **Run** 합니다.

1. `supabase/schema.sql`
2. `supabase/seed-terms.sql`

## 2. Vercel 배포

1. <https://vercel.com/new>에서 GitHub 저장소 `first-home`을 **Import** 합니다. Framework Preset은 **Other**로 둡니다.
2. **Environment Variables**에 세 값을 넣습니다(Supabase → Project Settings → API Keys / Data API).
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (서버 전용, 화면 코드에 넣지 않습니다)
3. **Deploy**를 누릅니다. 환경 변수를 나중에 바꿨다면 **Deployments → ⋯ → Redeploy** 합니다.

확인: 용어집 제목 옆에 "Supabase에서 불러온 용어 21개"가 보이면 연결된 것입니다. "이 계약 저장하고 링크 받기"를 누르면 `?plan=코드` 링크가 생깁니다.

## 3. 로컬에서 보기

```bash
npm install
npm test
npm run dev   # http://localhost:3000
```

`.env.example`을 `.env.local`로 복사해 값을 넣으면 로컬에서도 Supabase를 씁니다. 값이 없으면 용어집은 `terms.json`으로 보이고 저장 버튼은 오류를 알려 줍니다.

## 용어 고치기

`terms.json`을 고치고 `npm run seed`로 `supabase/seed-terms.sql`을 다시 만든 뒤 SQL Editor에서 실행합니다. "내 계약에서는" 문장은 입력값으로 계산하므로 `index.html`의 `MINE`에 있습니다.
