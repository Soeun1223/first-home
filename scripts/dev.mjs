// 로컬 시험 서버 · 정적 파일(index.html 등)과 api/ 함수를 한 주소에서 함께 엽니다.
//   npm run dev            .env.local의 SUPABASE_* 값을 읽습니다(없으면 함수가 500, 화면은 terms.json으로 대신 씁니다)
//   PORT=4000 npm run dev  다른 포트로 열기 (기본 3000)
// Vercel과 완전히 같지는 않습니다(CDN 캐시·리전·배포 보호 없음).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT || 3000);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
};

loadEnvFile(join(ROOT, '.env.local'));

const server = createServer(async (req, res) => {
  const started = Date.now();
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
  try {
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) await runFunction(req, res, url);
    else await serveFile(req, res, url);
  } catch (error) {
    console.error('[dev] 서버 오류:', error);
    if (!res.headersSent) send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, '시험 서버 오류: 터미널을 확인하세요.');
  }
  console.log(`${req.method} ${url.pathname}${url.search} → ${res.statusCode} (${Date.now() - started}ms)`);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n처음이라, 내 집 · http://localhost:${PORT}`);
  console.log(`- Supabase 설정: ${process.env.SUPABASE_URL ? '있음(값은 표시하지 않음)' : '없음 → 용어집은 terms.json, 저장은 500'}`);
  console.log('- 끝낼 때는 Ctrl+C\n');
});

// /api/이름 → api/이름.js 의 export default { fetch(request) } 를 실행합니다
async function runFunction(req, res, url) {
  const name = url.pathname.slice('/api/'.length).replace(/\/$/, '');
  const file = join(ROOT, 'api', `${name}.js`);
  if (!/^[\w-]+$/.test(name) || !existsSync(file)) {
    return send(res, 404, { 'Content-Type': 'application/json; charset=utf-8' },
      JSON.stringify({ error: `함수 파일이 없습니다: api/${name || '(이름 없음)'}.js` }));
  }
  const mod = await import(`${pathToFileURL(file).href}?v=${Date.now()}`); // 고친 내용을 매번 새로 읽습니다
  const handler = mod.default?.fetch ? (request) => mod.default.fetch(request) : mod[req.method];
  if (typeof handler !== 'function') {
    return send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' },
      `api/${name}.js에서 export default { fetch(request) { … } } 형식을 찾지 못했습니다.`);
  }
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
  const request = new Request(url, { method: req.method, headers: toHeaders(req.headers), body });
  const response = await handler(request);
  const headers = {};
  response.headers.forEach((value, key) => { headers[key] = value; });
  const data = req.method === 'HEAD' ? '' : Buffer.from(await response.arrayBuffer());
  send(res, response.status, headers, data);
}

// 프로젝트 폴더의 정적 파일을 보냅니다. 숨김 파일(.env.local 등)과 폴더 밖 경로는 열지 않습니다
async function serveFile(req, res, url) {
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(ROOT, `.${path}`);
  const hidden = path.split('/').some((part) => part.startsWith('.') || part === 'node_modules');
  if (hidden || !file.startsWith(ROOT + sep) || !(await isFile(file))) {
    return send(res, 404, { 'Content-Type': 'text/html; charset=utf-8' },
      '<!doctype html><meta charset="utf-8"><title>404</title><p>404 · 파일이 없습니다.</p>');
  }
  let data = await readFile(file);
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  send(res, 200, { 'Content-Type': type, 'Cache-Control': 'no-store' }, req.method === 'HEAD' ? '' : data);
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function toHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }
  return headers;
}

function readBody(req) {
  return new Promise((ok, fail) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => ok(Buffer.concat(chunks)));
    req.on('error', fail);
  });
}

// .env.local의 KEY=VALUE 줄을 읽어 환경 변수로 넣습니다(이미 있는 값은 그대로 둡니다)
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith('#')) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    if (value && process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

