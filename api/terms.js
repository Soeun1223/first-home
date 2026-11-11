// 용어집 · GET /api/terms → Supabase public.terms 전체(정렬 순서대로)
// 용어는 자주 바뀌지 않으므로 CDN에 10분 저장합니다.
import { connect, dbError, fail } from '../lib/db.js';

const TAG = 'terms';

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fail(405, 'METHOD', '이 주소는 GET 요청만 받습니다.', {}, { Allow: 'GET, HEAD' });
    }
    const db = connect('SUPABASE_PUBLISHABLE_KEY', TAG);
    if (db.error) return db.error;

    const { data, error } = await db.client
      .from('terms')
      .select('key, name, aka, def, sources')
      .order('sort', { ascending: true });
    if (error) return dbError(TAG, '읽기', error, '용어집을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.');

    return Response.json(
      { count: data.length, items: data },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' } },
    );
  },
};
