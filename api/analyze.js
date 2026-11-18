// AI 특약 해설·등기부 분석 · 오픈하사(gemma-4-31b)
//
//   POST /api/analyze  {kind: "clauses" | "registry", text | image(data URL)}
//     → 200 {kind, items | flags, signals?, maxClaims?, ocrText?, masked, tokens}
//     → 400 잘못된 입력 · 422 사진에서 글자를 못 읽음 · 500 키 없음 · 429 한도 초과 · 504 시간 초과 · 502 AI 오류·형식이 맞지 않는 답
//
// 사진은 오픈하사 OCR 모델로 글자를 읽고, 글은 개인정보를 가린 뒤 gemma에 보냅니다. 저장하지 않습니다(lib/analyze.js).
import { handleAnalyze } from '../lib/analyze.js';

export const config = { maxDuration: 60 }; // 사진 글자 읽기(25초) + 해설(20초)

export default {
  fetch(request) {
    return handleAnalyze(request);
  },
};
