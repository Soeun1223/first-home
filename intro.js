// 첫 화면 안내(모션 그래픽) · 처음 들어온 브라우저에서 한 번 보여 주고, '시작하기'를 누르면 닫힙니다.
//   다시 보기: 바닥글의 '서비스 소개 다시 보기' 또는 주소 뒤에 ?intro
//   저장 링크(?plan=코드)로 들어온 경우에는 바로 계약 준비를 보여 주려고 띄우지 않습니다.
const SEEN_KEY = 'zipkimi:intro-seen';
const intro = document.getElementById('intro');
const startBtn = document.getElementById('intro-start');
let lastFocus = null;

function seen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* 저장이 막혀도 닫기는 됩니다 */ }
}

function openIntro() {
  lastFocus = document.activeElement;
  intro.hidden = false;
  // 애니메이션을 처음부터 다시 재생
  intro.classList.remove('play');
  void intro.offsetWidth;
  intro.classList.add('play');
  document.body.classList.add('intro-open');
  for (const el of document.querySelectorAll('body > :not(#intro)')) el.inert = true;
  startBtn.focus({ preventScroll: true });
}

function closeIntro() {
  markSeen();
  intro.classList.add('leaving');
  const done = () => {
    intro.hidden = true;
    intro.classList.remove('leaving', 'play');
    document.body.classList.remove('intro-open');
    for (const el of document.querySelectorAll('body > :not(#intro)')) el.inert = false;
    const back = lastFocus && lastFocus !== document.body ? lastFocus : document.getElementById('main');
    back?.focus({ preventScroll: true });
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
  else setTimeout(done, 350);
}

startBtn.addEventListener('click', closeIntro);
document.getElementById('intro-skip').addEventListener('click', closeIntro);
intro.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeIntro();
});
document.getElementById('intro-replay')?.addEventListener('click', openIntro);

const params = new URLSearchParams(location.search);
if (params.has('intro') || (!seen() && !params.has('plan'))) openIntro();
