// AI 특약 해설·등기부 분석 · 오픈하사(gemma-4-31b)
//
//   POST /api/analyze  {kind: "clauses" | "registry", text}
//     → 200 {kind, items | flags, signals?, maxClaims?, masked, tokens}
//     → 400 잘못된 입력 · 500 키 없음 · 429 한도 초과 · 504 시간 초과 · 502 AI 오류·형식이 맞지 않는 답
//
// 붙여 넣은 글은 개인정보를 가린 뒤 AI에 보내고, 저장하지 않습니다(lib/analyze.js).
import { handleAnalyze } from '../lib/analyze.js';

export const config = { maxDuration: 30 };

export default {
  fetch(request) {
    return handleAnalyze(request);
  },
};
