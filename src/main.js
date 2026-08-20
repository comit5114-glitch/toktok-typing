import './style.css';
import './memory.css';
import './typing-games.css';
import './cheonjiin-guide.css';
import './mobile-keyboard.css';
import { lessons } from './data.js';

const app = document.querySelector('#app');
let deferredPrompt = null;
let currentKey = null;
let currentIndex = 0;
let memoryTimer = null;
let memoryStartedAt = null;
let memoryElapsed = 0;
let memoryFirstCard = null;
let memoryLocked = false;
let memoryMatched = 0;
let arcadeScore = 0;
let arcadeMissed = 0;
let arcadeSeconds = 45;
let arcadeSpawnTimer = null;
let arcadeClockTimer = null;
let arcadeRunning = false;
let guideTimer = null;
let guideStep = 0;
let guideSignature = '';
const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const record = JSON.parse(localStorage.getItem('toktok-learning-record') || '{"completed":0,"correct":0}');

app.innerHTML = `
  <header><button id="brandHome" class="brand" aria-label="홈으로"><span class="logo">가</span><div><h1>톡톡 타자교실</h1><p>천천히, 즐겁게 한글 타자 연습</p></div></button></header>
  <main>
    <div id="updateNotice" class="update" hidden><span>새로운 버전이 있습니다. 새로고침해 주세요.</span><button id="updateButton">지금 새로고침</button></div>
    <section id="homeView">
      <div class="hero">
        <div class="hero-icon" aria-hidden="true"><span>가</span><i>⌨</i></div>
        <p class="eyebrow">누구나 쉽게 배우는 한글 타자</p>
        <h2>손끝으로 시작하는<br><em>즐거운 타자 연습</em></h2>
        <p class="hero-copy">서두르지 않아도 괜찮아요.<br>하루 10분, 또박또박 함께 연습해요.</p>
        <button id="startButton" class="start-button"><span>톡톡 타자연습 시작하기</span><b>→</b></button>
        <div class="quick-points"><span>✓ 큰 글씨</span><span>✓ 쉬운 연습</span><span>✓ 기록 저장</span></div>
      </div>
      <section id="installCard" class="install-card ${isStandalone ? 'installed' : ''}">
        <button id="installButton" class="install-button" hidden>📲 스마트폰에 앱 설치하기</button>
        <p id="installStatus">${isStandalone ? '✓ 설치된 앱입니다' : '홈 화면에서도 편하게 만나요'}</p>
        <p class="install-help">한 번 설치하면 홈 화면에서 바로 사용할 수 있어요.</p>
        <button id="guideButton" class="guide-button" aria-expanded="false">설치 방법 보기</button>
        <div id="installGuide" class="guide" hidden><p><strong>Android Chrome</strong><br>오른쪽 위 ⋮ → 앱 설치 또는 홈 화면에 추가</p><p><strong>iPhone Safari</strong><br>공유 버튼 → 홈 화면에 추가</p></div>
      </section>
    </section>
    <section id="practiceView" hidden>
      <div class="practice-head"><button id="practiceHome" class="back">← 홈으로</button><div><p>오늘도 반가워요 👋</p><h2>무엇을 연습할까요?</h2></div></div>
      <div class="record-card"><span>나의 연습 기록</span><strong>완료 ${record.completed}회</strong><strong>정답 ${record.correct}개</strong></div>
      <div class="menu">${Object.entries(lessons).map(([key, lesson]) => `<button class="menu-button" data-lesson="${key}"><span>${lesson.title}</span><small>${key === 'game' ? '빠르게 입력해요' : key === 'pictures' ? '그림 이름을 맞혀요' : '차근차근 연습해요'}</small></button>`).join('')}</div>
    </section>
    <section id="lessonView" class="lesson" hidden>
      <button id="backButton" class="back">← 처음으로</button><h2 id="lessonTitle"></h2>
      <div id="prompt" class="prompt"></div>
      <div id="cheonjiinGuide" class="cheonjiin" hidden>
        <div class="keypad-head"><strong>천지인 글자 위치</strong><span id="guideText">첫소리를 눌러요</span></div>
        <div id="cheonjiinKeys" class="cheonjiin-keys">
          ${['ㅣ','ㆍ','ㅡ','ㄱㅋ','ㄴㄹ','ㄷㅌ','ㅂㅍ','ㅅㅎ','ㅈㅊ','ㅇㅁ','띄어쓰기','⌫'].map(key => `<div class="cheon-key" data-jamo="${key}">${key}<img class="finger" src="/images/single-finger-pointer.png" alt="이 키를 누르는 손가락"></div>`).join('')}
        </div>
      </div>
      <label for="typingInput">아래 칸에 똑같이 입력하세요</label>
      <input id="typingInput" autocomplete="off" autocapitalize="off" enterkeyhint="done" />
      <p id="feedback" class="feedback" aria-live="polite"></p>
      <button id="checkButton" class="check">확인하기</button>
    </section>
    <section id="arcadeView" class="arcade" hidden>
      <div class="arcade-head"><button id="arcadeBack" class="back">← 연습 선택</button><div class="arcade-stats"><span>점수 <strong id="arcadeScore">0</strong></span><span>남은 시간 <strong id="arcadeTime">45</strong>초</span></div></div>
      <div class="arcade-title"><p>🎮 타자게임</p><h2>내려오는 낱말을 입력하세요!</h2></div>
      <div id="arcadeField" class="arcade-field"><div class="finish-line"></div><div id="arcadeReady" class="arcade-ready"><span>⌨️</span><p>시작 버튼을 누르면<br>낱말이 내려와요</p></div></div>
      <label for="arcadeInput">보이는 낱말 입력</label>
      <input id="arcadeInput" class="arcade-input" autocomplete="off" autocapitalize="off" enterkeyhint="done" placeholder="낱말을 입력하세요" />
      <div class="arcade-actions"><button id="arcadeStart" class="check">게임 시작</button><span>놓친 낱말 <strong id="arcadeMissed">0</strong>개</span></div>
    </section>
    <section id="memoryView" class="memory-game" hidden>
      <div class="memory-top"><button id="memoryBack" class="back">← 연습 선택</button><div class="memory-time"><small>맞추는 시간</small><strong id="memoryTime">00:00</strong></div></div>
      <div class="memory-title"><p>🖼️ 그림 맞추기</p><h2>같은 그림 두 장을 찾아보세요</h2></div>
      <div id="difficultyButtons" class="difficulty" aria-label="난이도 선택">
        <button data-level="beginner" class="active">초급<small>6장</small></button>
        <button data-level="intermediate">중급<small>12장</small></button>
        <button data-level="advanced">고급<small>20장</small></button>
      </div>
      <div class="memory-status"><span id="memoryProgress">찾은 그림 0 / 3</span><button id="memoryRestart">↻ 다시 섞기</button></div>
      <div id="memoryBoard" class="memory-board beginner" aria-label="그림 카드"></div>
      <div id="memoryComplete" class="memory-complete" hidden><span>🎉</span><h3>모두 찾았어요!</h3><p><strong id="completeTime">00:00</strong> 만에 완성했어요.</p><button id="playAgain">한 번 더 하기</button></div>
    </section>
  </main>
  <footer>톡톡 타자교실은 인터넷이 없어도 기본 연습을 할 수 있어요.</footer>`;

const $ = id => document.getElementById(id);
const installButton = $('installButton');
if (!isStandalone) setTimeout(() => { if (!deferredPrompt) installButton.hidden = true; }, 1500);
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; installButton.hidden = false; $('installStatus').textContent = '설치 버튼을 눌러 앱으로 사용하세요'; });
installButton.addEventListener('click', async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; installButton.hidden = true; });
window.addEventListener('appinstalled', () => { deferredPrompt = null; installButton.hidden = true; $('installCard').classList.add('installed'); $('installStatus').textContent = '✓ 설치된 앱입니다'; });
$('guideButton').addEventListener('click', () => { const guide = $('installGuide'); guide.hidden = !guide.hidden; $('guideButton').setAttribute('aria-expanded', String(!guide.hidden)); });

document.querySelectorAll('[data-lesson]').forEach(button => button.addEventListener('click', () => openLesson(button.dataset.lesson)));
$('startButton').addEventListener('click', showPractice);
$('practiceHome').addEventListener('click', showHome);
$('brandHome').addEventListener('click', showHome);
$('backButton').addEventListener('click', showPractice);
$('arcadeBack').addEventListener('click', showPractice);
$('arcadeStart').addEventListener('click', startArcadeGame);
$('arcadeInput').addEventListener('input', checkArcadeWord);
$('memoryBack').addEventListener('click', showPractice);
$('memoryRestart').addEventListener('click', () => startMemoryGame(document.querySelector('[data-level].active').dataset.level));
$('playAgain').addEventListener('click', () => startMemoryGame(document.querySelector('[data-level].active').dataset.level));
document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => startMemoryGame(button.dataset.level)));
$('checkButton').addEventListener('click', checkAnswer);
$('typingInput').addEventListener('input', updateCheonjiinGuide);
$('typingInput').addEventListener('keydown', event => { if (event.key === 'Enter') checkAnswer(); });

function openLesson(key) { currentKey = key; currentIndex = 0; $('practiceView').hidden = true; if (key === 'pictures') { $('memoryView').hidden = false; startMemoryGame('beginner'); } else if (key === 'game') { $('arcadeView').hidden = false; resetArcadeGame(); } else { $('lessonView').hidden = false; $('lessonTitle').textContent = lessons[key].title; $('cheonjiinGuide').hidden = key !== 'letters'; showQuestion(); } window.scrollTo({top:0,behavior:'smooth'}); }
function showPractice() { stopMemoryTimer(); stopArcadeGame(); clearInterval(guideTimer); guideSignature = ''; $('homeView').hidden = true; $('lessonView').hidden = true; $('memoryView').hidden = true; $('arcadeView').hidden = true; $('practiceView').hidden = false; $('typingInput').blur(); $('arcadeInput').blur(); window.scrollTo({top:0,behavior:'smooth'}); }
function showHome() { stopMemoryTimer(); stopArcadeGame(); clearInterval(guideTimer); guideSignature = ''; $('practiceView').hidden = true; $('lessonView').hidden = true; $('memoryView').hidden = true; $('arcadeView').hidden = true; $('homeView').hidden = false; $('typingInput').blur(); $('arcadeInput').blur(); window.scrollTo({top:0,behavior:'smooth'}); }
function answer() { const item = lessons[currentKey].items[currentIndex % lessons[currentKey].items.length]; return typeof item === 'string' ? item : item.word; }
function showQuestion() { const item = lessons[currentKey].items[currentIndex % lessons[currentKey].items.length]; $('prompt').innerHTML = typeof item === 'string' ? item : `<span class="picture">${item.emoji}</span><span class="picture-hint">이 그림의 이름은?</span>`; $('typingInput').value = ''; $('feedback').textContent = ''; updateCheonjiinGuide(); }
function checkAnswer() { const input = $('typingInput').value.trim(); if (!input) { $('feedback').textContent = '글자를 입력해 주세요.'; return; } record.completed++; if (input === answer()) { record.correct++; $('feedback').textContent = '참 잘했어요! 👏 다음 문제입니다.'; currentIndex++; localStorage.setItem('toktok-learning-record', JSON.stringify(record)); setTimeout(showQuestion, 900); } else { $('feedback').textContent = '조금 달라요. 천천히 다시 해보세요.'; } localStorage.setItem('toktok-learning-record', JSON.stringify(record)); }

const memoryLevels = { beginner: { pairs: 3 }, intermediate: { pairs: 6 }, advanced: { pairs: 10 } };
function startMemoryGame(level) {
  stopMemoryTimer(); memoryStartedAt = null; memoryElapsed = 0; memoryFirstCard = null; memoryLocked = false; memoryMatched = 0;
  document.querySelectorAll('[data-level]').forEach(button => button.classList.toggle('active', button.dataset.level === level));
  const pairs = memoryLevels[level].pairs;
  const chosen = lessons.pictures.items.slice(0, pairs);
  const cards = [...chosen, ...chosen].map((item, index) => ({...item, id: `${item.word}-${index}`})).sort(() => Math.random() - .5);
  $('memoryTime').textContent = '00:00'; $('memoryProgress').textContent = `찾은 그림 0 / ${pairs}`; $('memoryComplete').hidden = true;
  $('memoryBoard').className = `memory-board ${level}`;
  $('memoryBoard').innerHTML = cards.map(card => `<button class="memory-card" data-picture="${card.word}" aria-label="뒤집힌 카드"><span class="card-back">?</span><span class="card-front">${card.emoji}<small>${card.word}</small></span></button>`).join('');
  document.querySelectorAll('.memory-card').forEach(card => card.addEventListener('click', () => flipMemoryCard(card, pairs)));
}
function flipMemoryCard(card, pairs) {
  if (memoryLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  if (!memoryStartedAt) { memoryStartedAt = Date.now(); memoryTimer = setInterval(updateMemoryTime, 500); }
  card.classList.add('flipped'); card.setAttribute('aria-label', `${card.dataset.picture} 카드`);
  if (!memoryFirstCard) { memoryFirstCard = card; return; }
  if (memoryFirstCard.dataset.picture === card.dataset.picture) {
    const first = memoryFirstCard;
    first.classList.add('matched'); card.classList.add('matched'); memoryFirstCard = null; memoryMatched++;
    setTimeout(() => {
      first.classList.add('cleared'); card.classList.add('cleared');
      first.disabled = true; card.disabled = true;
    }, 450);
    $('memoryProgress').textContent = `찾은 그림 ${memoryMatched} / ${pairs}`;
    if (memoryMatched === pairs) completeMemoryGame();
  } else {
    memoryLocked = true; const first = memoryFirstCard; memoryFirstCard = null;
    setTimeout(() => { first.classList.remove('flipped'); card.classList.remove('flipped'); first.setAttribute('aria-label','뒤집힌 카드'); card.setAttribute('aria-label','뒤집힌 카드'); memoryLocked = false; }, 850);
  }
}
function updateMemoryTime() { memoryElapsed = Date.now() - memoryStartedAt; $('memoryTime').textContent = formatMemoryTime(memoryElapsed); }
function formatMemoryTime(ms) { const total = Math.floor(ms / 1000); return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`; }
function stopMemoryTimer() { if (memoryTimer) clearInterval(memoryTimer); memoryTimer = null; }
function completeMemoryGame() { updateMemoryTime(); stopMemoryTimer(); $('completeTime').textContent = formatMemoryTime(memoryElapsed); $('memoryComplete').hidden = false; record.completed++; record.correct += memoryMatched; localStorage.setItem('toktok-learning-record', JSON.stringify(record)); }

const initialJamo = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const medialJamo = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const finalJamo = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const keypadGroups = {'ㄱ':'ㄱㅋ','ㄲ':'ㄱㅋ','ㅋ':'ㄱㅋ','ㄴ':'ㄴㄹ','ㄹ':'ㄴㄹ','ㄷ':'ㄷㅌ','ㄸ':'ㄷㅌ','ㅌ':'ㄷㅌ','ㅂ':'ㅂㅍ','ㅃ':'ㅂㅍ','ㅍ':'ㅂㅍ','ㅅ':'ㅅㅎ','ㅆ':'ㅅㅎ','ㅎ':'ㅅㅎ','ㅈ':'ㅈㅊ','ㅉ':'ㅈㅊ','ㅊ':'ㅈㅊ','ㅇ':'ㅇㅁ','ㅁ':'ㅇㅁ'};
const consonantTaps = {'ㄱ':['ㄱㅋ'],'ㅋ':['ㄱㅋ','ㄱㅋ'],'ㄲ':['ㄱㅋ','ㄱㅋ','ㄱㅋ'],'ㄴ':['ㄴㄹ'],'ㄹ':['ㄴㄹ','ㄴㄹ'],'ㄷ':['ㄷㅌ'],'ㅌ':['ㄷㅌ','ㄷㅌ'],'ㄸ':['ㄷㅌ','ㄷㅌ','ㄷㅌ'],'ㅂ':['ㅂㅍ'],'ㅍ':['ㅂㅍ','ㅂㅍ'],'ㅃ':['ㅂㅍ','ㅂㅍ','ㅂㅍ'],'ㅅ':['ㅅㅎ'],'ㅎ':['ㅅㅎ','ㅅㅎ'],'ㅆ':['ㅅㅎ','ㅅㅎ','ㅅㅎ'],'ㅈ':['ㅈㅊ'],'ㅊ':['ㅈㅊ','ㅈㅊ'],'ㅉ':['ㅈㅊ','ㅈㅊ','ㅈㅊ'],'ㅇ':['ㅇㅁ'],'ㅁ':['ㅇㅁ','ㅇㅁ']};
const vowelTaps = {'ㅣ':['ㅣ'],'ㅡ':['ㅡ'],'ㅏ':['ㅣ','ㆍ'],'ㅑ':['ㅣ','ㆍ','ㆍ'],'ㅓ':['ㆍ','ㅣ'],'ㅕ':['ㆍ','ㆍ','ㅣ'],'ㅗ':['ㆍ','ㅡ'],'ㅛ':['ㆍ','ㆍ','ㅡ'],'ㅜ':['ㅡ','ㆍ'],'ㅠ':['ㅡ','ㆍ','ㆍ'],'ㅐ':['ㅣ','ㆍ','ㅣ'],'ㅒ':['ㅣ','ㆍ','ㆍ','ㅣ'],'ㅔ':['ㆍ','ㅣ','ㅣ'],'ㅖ':['ㆍ','ㆍ','ㅣ','ㅣ'],'ㅚ':['ㆍ','ㅡ','ㅣ'],'ㅟ':['ㅡ','ㆍ','ㅣ'],'ㅢ':['ㅡ','ㅣ'],'ㅘ':['ㆍ','ㅡ','ㅣ','ㆍ'],'ㅙ':['ㆍ','ㅡ','ㅣ','ㆍ','ㅣ'],'ㅝ':['ㅡ','ㆍ','ㆍ','ㅣ'],'ㅞ':['ㅡ','ㆍ','ㆍ','ㅣ','ㅣ']};
function updateCheonjiinGuide() {
  if (currentKey !== 'letters') return;
  const target = answer(); const typedLength = [...$('typingInput').value].length; const next = [...target][Math.min(typedLength, [...target].length - 1)];
  const steps = getCheonjiinSteps(next); const signature = `${next}-${typedLength}`;
  if (signature !== guideSignature) { guideSignature = signature; guideStep = 0; clearInterval(guideTimer); guideTimer = setInterval(() => { guideStep = (guideStep + 1) % steps.length; renderCheonjiinStep(next, steps); }, 950); }
  renderCheonjiinStep(next, steps);
}
function getCheonjiinSteps(character) {
  if (character === ' ') return ['띄어쓰기'];
  const code = character?.charCodeAt(0); if (!(code >= 0xAC00 && code <= 0xD7A3)) return [keypadGroups[character] || 'ㅣ'];
  const offset = code - 0xAC00; const initial = initialJamo[Math.floor(offset / 588)]; const medial = medialJamo[Math.floor((offset % 588) / 28)]; const final = finalJamo[offset % 28];
  const finalParts = {'ㄳ':['ㄱ','ㅅ'],'ㄵ':['ㄴ','ㅈ'],'ㄶ':['ㄴ','ㅎ'],'ㄺ':['ㄹ','ㄱ'],'ㄻ':['ㄹ','ㅁ'],'ㄼ':['ㄹ','ㅂ'],'ㄽ':['ㄹ','ㅅ'],'ㄾ':['ㄹ','ㅌ'],'ㄿ':['ㄹ','ㅍ'],'ㅀ':['ㄹ','ㅎ'],'ㅄ':['ㅂ','ㅅ']}[final] || (final ? [final] : []);
  return [...(consonantTaps[initial] || [keypadGroups[initial]]), ...(vowelTaps[medial] || ['ㅣ']), ...finalParts.flatMap(jamo => consonantTaps[jamo] || [keypadGroups[jamo]])];
}
function renderCheonjiinStep(character, steps) {
  const index = guideStep % steps.length; const current = steps[index];
  document.querySelectorAll('.cheon-key').forEach(key => key.classList.toggle('target', key.dataset.jamo === current));
  $('guideText').innerHTML = `“${character || ''}” 입력 ${index + 1}/${steps.length} <b>${steps.join(' → ')}</b>`;
}

function resetArcadeGame() { stopArcadeGame(); arcadeScore = 0; arcadeMissed = 0; arcadeSeconds = 45; $('arcadeScore').textContent = '0'; $('arcadeMissed').textContent = '0'; $('arcadeTime').textContent = '45'; $('arcadeInput').value = ''; $('arcadeStart').textContent = '게임 시작'; $('arcadeStart').disabled = false; $('arcadeReady').hidden = false; $('arcadeReady').innerHTML = '<span>⌨️</span><p>시작 버튼을 누르면<br>낱말이 내려와요</p>'; document.querySelectorAll('.falling-word').forEach(word => word.remove()); }
function startArcadeGame() {
  resetArcadeGame(); arcadeRunning = true; $('arcadeReady').hidden = true; $('arcadeStart').textContent = '게임 중'; $('arcadeStart').disabled = true; $('arcadeInput').focus({preventScroll:true}); spawnArcadeWord();
  arcadeSpawnTimer = setInterval(spawnArcadeWord, 1800);
  arcadeClockTimer = setInterval(() => { arcadeSeconds--; $('arcadeTime').textContent = arcadeSeconds; if (arcadeSeconds <= 0) finishArcadeGame(); }, 1000);
}
function spawnArcadeWord() {
  if (!arcadeRunning) return; const word = lessons.game.items[Math.floor(Math.random() * lessons.game.items.length)]; const el = document.createElement('span'); el.className = 'falling-word'; el.textContent = word; el.dataset.word = word; el.style.left = `${8 + Math.random() * 68}%`; el.style.animationDuration = `${6 + Math.random() * 2}s`; $('arcadeField').appendChild(el);
  el.addEventListener('animationend', () => { if (!el.isConnected) return; arcadeMissed++; $('arcadeMissed').textContent = arcadeMissed; el.remove(); });
}
function checkArcadeWord() {
  if (!arcadeRunning) return; const value = $('arcadeInput').value.trim(); const match = [...document.querySelectorAll('.falling-word')].find(el => el.dataset.word === value);
  if (match) { match.classList.add('caught'); setTimeout(() => match.remove(), 250); arcadeScore += 10; $('arcadeScore').textContent = arcadeScore; $('arcadeInput').value = ''; }
}
function stopArcadeGame() { arcadeRunning = false; clearInterval(arcadeSpawnTimer); clearInterval(arcadeClockTimer); arcadeSpawnTimer = null; arcadeClockTimer = null; }
function finishArcadeGame() { stopArcadeGame(); document.querySelectorAll('.falling-word').forEach(word => word.remove()); $('arcadeReady').hidden = false; $('arcadeReady').innerHTML = `<span>🏆</span><p>게임 끝!<br><strong>${arcadeScore}점</strong>을 얻었어요</p>`; $('arcadeStart').textContent = '다시 시작'; $('arcadeStart').disabled = false; record.completed++; record.correct += arcadeScore / 10; localStorage.setItem('toktok-learning-record', JSON.stringify(record)); }

let largestViewportHeight = window.visualViewport?.height || window.innerHeight;
function updateKeyboardLayout() {
  const currentHeight = window.visualViewport?.height || window.innerHeight;
  largestViewportHeight = Math.max(largestViewportHeight, currentHeight);
  document.body.classList.toggle('keyboard-open', largestViewportHeight - currentHeight > 140);
}
window.visualViewport?.addEventListener('resize', updateKeyboardLayout);
window.visualViewport?.addEventListener('scroll', updateKeyboardLayout);
window.addEventListener('orientationchange', () => { largestViewportHeight = window.visualViewport?.height || window.innerHeight; updateKeyboardLayout(); });

if ('serviceWorker' in navigator) window.addEventListener('load', async () => {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (registration.waiting) showUpdate(registration);
    registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(registration); }); });
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  } catch (error) { console.error('Service Worker 등록 실패:', error); }
});
function showUpdate(registration) { $('updateNotice').hidden = false; $('updateButton').onclick = () => registration.waiting?.postMessage({type:'SKIP_WAITING'}); }
