// terms.json → supabase/seed-terms.sql
// 용어 내용은 terms.json 한 곳에서만 고칩니다. 고친 뒤 `npm run seed`로 SQL을 다시 만들고
// Supabase SQL Editor에서 seed-terms.sql을 실행하면 DB가 같은 내용으로 바뀝니다.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const terms = JSON.parse(readFileSync(new URL('terms.json', root), 'utf8'));

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const rows = terms.map((t, i) =>
  `  (${q(t.key)}, ${q(t.name)}, ${q(t.aka ?? '')}, ${q(t.def)}, '{${t.sources.join(',')}}', ${i + 1})`);

const sql = `-- 자동 생성 파일입니다(scripts/seed-terms.mjs). 직접 고치지 말고 terms.json을 고친 뒤 npm run seed.
insert into public.terms (key, name, aka, def, sources, sort) values
${rows.join(',\n')}
on conflict (key) do update set
  name = excluded.name, aka = excluded.aka, def = excluded.def,
  sources = excluded.sources, sort = excluded.sort, updated_at = now();

delete from public.terms where key not in (${terms.map((t) => q(t.key)).join(', ')});
`;

writeFileSync(new URL('supabase/seed-terms.sql', root), sql);
console.log(`supabase/seed-terms.sql · 용어 ${terms.length}개`);
