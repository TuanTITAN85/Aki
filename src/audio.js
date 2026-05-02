"use strict";
// =============================================================================
// HỆ THỐNG ÂM THANH - Web Audio API (không dùng file ngoài)
// Tất cả tiếng đều sinh từ oscillator để khỏi cần tải file mp3/wav.
//
// API toàn cục (gọi trực tiếp từ index.html):
//   ensureAudio()                       - khởi tạo AudioContext sau user gesture
//   playTone(freq, dur, opts)           - phát 1 tone đơn lẻ với envelope
//   sfxJump / sfxShoot / sfxHitEnemy ...- hiệu ứng game
//   startBGM() / stopBGM()              - nhạc nền lặp
// =============================================================================

let audioCtx = null;

function ensureAudio() {
  // Trình duyệt yêu cầu phải có hành động người dùng (click/phím) trước khi tạo
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

// Phát một tone đơn giản với envelope tắt dần
function playTone(freq, dur, opts = {}) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = opts.type || "square";
  o.frequency.setValueAtTime(freq, t0);
  if (opts.endFreq != null) {
    o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.endFreq), t0 + dur);
  }
  const vol = opts.vol == null ? 0.1 : opts.vol;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

// Các hiệu ứng âm thanh trong game
function sfxJump()   { playTone(380, 0.12, { type: "square",   endFreq: 720, vol: 0.07 }); }
function sfxShoot()  { playTone(660, 0.08, { type: "square",   endFreq: 990, vol: 0.05 }); }
function sfxHitEnemy(){ playTone(680, 0.06, { type: "square",   endFreq: 320, vol: 0.07 }); }
function sfxKillEnemy() {
  playTone(440, 0.10, { type: "square",   endFreq: 200, vol: 0.09 });
  setTimeout(() => playTone(220, 0.18, { type: "sawtooth", endFreq: 70, vol: 0.09 }), 80);
}
function sfxHurt()   { playTone(220, 0.25, { type: "sawtooth", endFreq: 80,  vol: 0.13 }); }
function sfxCoin() {
  playTone(880, 0.06, { type: "sine", vol: 0.10 });
  setTimeout(() => playTone(1320, 0.10, { type: "sine", vol: 0.10 }), 60);
}
function sfxFruit() {
  // Cung 4 nốt đi lên - báo "vừa được sức mạnh mới"
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => setTimeout(() =>
    playTone(f, 0.16, { type: "triangle", vol: 0.13 }), i * 90));
}
function sfxSplash() {
  // Tiếng nước văng + rơi sâu
  playTone(180, 0.4, { type: "sawtooth", endFreq: 60, vol: 0.16 });
  setTimeout(() => playTone(120, 0.30, { type: "sine", endFreq: 50, vol: 0.10 }), 100);
}
function sfxBossShoot(){ playTone(180, 0.18, { type: "sawtooth", endFreq: 90, vol: 0.10 }); }
function sfxWin() {
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((f, i) => setTimeout(() =>
    playTone(f, 0.22, { type: "triangle", vol: 0.14 }), i * 130));
}
function sfxGameOver() {
  const notes = [440, 392, 349, 261];
  notes.forEach((f, i) => setTimeout(() =>
    playTone(f, 0.32, { type: "sawtooth", vol: 0.13 }), i * 200));
}
// Tiếng "thất bại" rõ rệt - deep tone + descending wail dài 1.5s
function sfxFail() {
  // Tone trầm bắt đầu mạnh
  playTone(220, 0.6, { type: "sawtooth", endFreq: 60, vol: 0.18 });
  // Sau 200ms thêm tiếng wail descending
  setTimeout(() => playTone(330, 0.5, { type: "sawtooth", endFreq: 110, vol: 0.14 }), 200);
  // Cuối cùng tiếng buồn thật trầm
  setTimeout(() => playTone(110, 0.7, { type: "sine", endFreq: 50, vol: 0.16 }), 600);
  // Nốt nhỏ kết thúc
  setTimeout(() => playTone(82, 0.4, { type: "triangle", vol: 0.12 }), 1100);
}

// Tiếng nổ boss khi chết - deep + bright explosion
function sfxBossDeath() {
  // Pha 1: explosion trầm
  playTone(80, 0.4, { type: "sawtooth", endFreq: 30, vol: 0.22 });
  // Pha 2: chùm tone descending trumpet-ish
  setTimeout(() => playTone(440, 0.3, { type: "square", endFreq: 220, vol: 0.16 }), 100);
  setTimeout(() => playTone(330, 0.4, { type: "square", endFreq: 110, vol: 0.14 }), 250);
  // Pha 3: tiếng vàng rơi xuống (coin chime cao)
  setTimeout(() => playTone(880,  0.15, { type: "sine", vol: 0.12 }), 500);
  setTimeout(() => playTone(1320, 0.18, { type: "sine", vol: 0.12 }), 600);
  setTimeout(() => playTone(1760, 0.20, { type: "sine", vol: 0.10 }), 720);
}

// Nhạc nền: melody pirate kiểu La thứ, lặp vô tận khi đang chơi
const BGM_NOTES = [
  // Câu nhạc 1
  440, 523, 659, 880,  784, 659, 523, 659,
  // Câu nhạc 2
  698, 587, 494, 587,  523, 659, 440, 659
];
const BGM_BASS = [
  110, 110, 110, 110, 110, 110, 110, 110,
  87,  87,  87,  87,  73,  73,  110, 110
];
let bgmInterval = null;
let bgmStep = 0;
function startBGM() {
  if (!audioCtx || bgmInterval) return;
  bgmStep = 0;
  bgmInterval = setInterval(() => {
    const m = BGM_NOTES[bgmStep % BGM_NOTES.length];
    const b = BGM_BASS[bgmStep % BGM_BASS.length];
    playTone(m, 0.30, { type: "triangle", vol: 0.04 });
    if (bgmStep % 2 === 0) playTone(b, 0.45, { type: "sine", vol: 0.05 });
    bgmStep++;
  }, 320);
}
function stopBGM() {
  if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
}
