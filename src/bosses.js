"use strict";
// =============================================================================
// BOSS - mỗi đảo có 1 boss với hình dạng và kỹ năng riêng biệt
//
// Mỗi boss gồm:
//   - 1 hàm vẽ: drawXxx(b, camX, camY)  — vẽ sprite trên canvas
//   - 1 hàm skill: bossSkillXxx(b, player)  — tạo đạn / tấn công đặc biệt
// Tất cả được đăng ký vào bảng tra cứu BOSS_KINDS để Enemy class dispatch.
//
// Phụ thuộc (truy cập runtime, không phải load time):
//   - ctx (canvas context) — index.html
//   - spawnParticles, rand, choice — src/render.js
//   - MagicOrb (class) — index.html (dùng ở runtime nên load order OK)
//   - enemyOrbs (array) — index.html
//
// Export ra biến toàn cục:
//   drawMonkeyKing, drawGiantScorpion, drawYeti, drawFireTiger, drawDarkKing
//   bossSkillMonkey, bossSkillScorpion, bossSkillYeti, bossSkillTiger,
//     bossSkillDarkKing
//   BOSS_KINDS  — bảng tra cứu kích thước, hpMul, dmgMul, cooldown,
//                 hàm vẽ và hàm kỹ năng cho từng loại boss
// =============================================================================

// ----- Hàm vẽ Vua Khỉ Đỏ (Đảo 1) -----
function drawMonkeyKing(b, camX, camY) {
  const x = b.x - camX, y = b.y - camY;
  const w = b.w, h = b.h;
  const t = b.animTime;
  const bob = Math.sin(t * 0.1) * 2;

  // chân
  ctx.fillStyle = "#7a3a06";
  ctx.fillRect(x + w*0.30, y + h*0.88 + bob, w*0.16, h*0.12);
  ctx.fillRect(x + w*0.54, y + h*0.88 + bob, w*0.16, h*0.12);
  // áo choàng đỏ
  ctx.fillStyle = "#a51212";
  ctx.fillRect(x + w*0.16, y + h*0.40 + bob, w*0.68, h*0.50);
  ctx.fillStyle = "#7a0a0a";
  ctx.fillRect(x + w*0.16, y + h*0.40 + bob, w*0.10, h*0.50);
  ctx.fillRect(x + w*0.74, y + h*0.40 + bob, w*0.10, h*0.50);
  // đai vàng
  ctx.fillStyle = "#3a1a06";
  ctx.fillRect(x + w*0.16, y + h*0.70 + bob, w*0.68, h*0.06);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(x + w*0.45, y + h*0.70 + bob, w*0.10, h*0.06);
  // đầu khỉ nâu
  ctx.fillStyle = "#7a3a06";
  ctx.beginPath(); ctx.arc(x + w/2, y + h*0.27 + bob, w*0.28, 0, Math.PI*2); ctx.fill();
  // mặt sáng hơn
  ctx.fillStyle = "#d4a070";
  ctx.beginPath(); ctx.arc(x + w/2, y + h*0.30 + bob, w*0.18, 0, Math.PI*2); ctx.fill();
  // tai
  ctx.fillStyle = "#7a3a06";
  ctx.beginPath(); ctx.arc(x + w*0.22, y + h*0.25 + bob, 9, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.78, y + h*0.25 + bob, 9, 0, Math.PI*2); ctx.fill();
  // mắt giận dữ
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(x + w*0.42, y + h*0.27 + bob, 5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.58, y + h*0.27 + bob, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(x + w*0.42, y + h*0.27 + bob, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.58, y + h*0.27 + bob, 2.5, 0, Math.PI*2); ctx.fill();
  // miệng
  ctx.fillStyle = "#000";
  ctx.fillRect(x + w*0.42, y + h*0.36 + bob, w*0.16, 3);
  // vương miện
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(x + w*0.26, y + h*0.06 + bob, w*0.48, 6);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w*0.28 + i*w*0.13, y + h*0.06 + bob);
    ctx.lineTo(x + w*0.34 + i*w*0.13, y + h*0.06 + bob - 12);
    ctx.lineTo(x + w*0.40 + i*w*0.13, y + h*0.06 + bob);
    ctx.fill();
  }
  ctx.fillStyle = "#ff3838";
  ctx.fillRect(x + w*0.47, y + h*0.08 + bob, 6, 6);
  // tay cầm chuối
  ctx.fillStyle = "#7a3a06";
  ctx.fillRect(x + w*0.04, y + h*0.50 + bob, w*0.13, h*0.30);
  ctx.fillRect(x + w*0.83, y + h*0.50 + bob, w*0.13, h*0.30);
  // chuối ở tay phải
  ctx.fillStyle = "#ffe04a";
  ctx.beginPath();
  ctx.ellipse(x + w*0.97, y + h*0.55 + bob, 14, 6, Math.PI*0.3, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = "#3a8a06";
  ctx.fillRect(x + w*0.95 + 8, y + h*0.50 + bob - 2, 4, 4);
}

// ----- Hàm vẽ Bọ Cạp Khổng Lồ (Đảo 2) -----
function drawGiantScorpion(b, camX, camY) {
  const x = b.x - camX, y = b.y - camY;
  const w = b.w, h = b.h;
  const t = b.animTime;
  const wob = Math.sin(t*0.15) * 3;
  // chân (3 cặp)
  ctx.fillStyle = "#1a0e2a";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + w*0.28 + i*w*0.12, y + h*0.78, 6, h*0.22);
    ctx.fillRect(x + w*0.30 + i*w*0.12, y + h*0.92, w*0.06, 5);
  }
  // thân (đốt)
  ctx.fillStyle = "#3a2a5e";
  ctx.fillRect(x + w*0.20, y + h*0.45, w*0.62, h*0.38);
  ctx.fillStyle = "#5a4a8e";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + w*0.22 + i*w*0.12, y + h*0.45, 3, h*0.38);
  }
  // đầu
  ctx.fillStyle = "#3a2a5e";
  ctx.beginPath(); ctx.arc(x + w*0.5, y + h*0.40, w*0.15, 0, Math.PI*2); ctx.fill();
  // 4 mắt đỏ
  ctx.fillStyle = "#ff2a2a";
  ctx.beginPath(); ctx.arc(x + w*0.42, y + h*0.36, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.46, y + h*0.34, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.54, y + h*0.34, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.58, y + h*0.36, 3, 0, Math.PI*2); ctx.fill();
  // 2 càng
  ctx.fillStyle = "#3a2a5e";
  // càng trái
  ctx.fillRect(x + w*0.02, y + h*0.40, w*0.20, 14);
  ctx.fillRect(x + w*0.02, y + h*0.40, 14, h*0.18);
  ctx.fillRect(x + w*0.16, y + h*0.40, 14, h*0.18);
  // càng phải
  ctx.fillRect(x + w*0.78, y + h*0.40, w*0.20, 14);
  ctx.fillRect(x + w*0.84, y + h*0.40, 14, h*0.18);
  ctx.fillRect(x + w*0.98 - 14, y + h*0.40, 14, h*0.18);
  // đuôi cong lên
  ctx.fillStyle = "#3a2a5e";
  ctx.fillRect(x + w*0.45, y + h*0.18 + wob, w*0.10, h*0.30);
  ctx.fillRect(x + w*0.40, y + h*0.10 + wob, w*0.20, 12);
  // gai độc
  ctx.fillStyle = "#ff3838";
  ctx.beginPath();
  ctx.moveTo(x + w*0.50, y + h*0.0 + wob);
  ctx.lineTo(x + w*0.42, y + h*0.10 + wob);
  ctx.lineTo(x + w*0.58, y + h*0.10 + wob);
  ctx.fill();
  // hạt độc nhỏ
  if (t % 4 === 0) {
    spawnParticles(b.x + b.w*0.50, b.y + b.h*0.05, {
      count: 1, color: "#5ec85a", speed: 1, size: 2, life: 26, gravity: 0.05
    });
  }
}

// ----- Hàm vẽ Người Tuyết Khổng Lồ (Đảo 3) -----
function drawYeti(b, camX, camY) {
  const x = b.x - camX, y = b.y - camY;
  const w = b.w, h = b.h;
  const t = b.animTime;
  const bob = Math.sin(t*0.08) * 2;
  // chân
  ctx.fillStyle = "#e6f0ff";
  ctx.fillRect(x + w*0.20, y + h*0.72 + bob, w*0.20, h*0.28);
  ctx.fillRect(x + w*0.60, y + h*0.72 + bob, w*0.20, h*0.28);
  // thân
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h*0.55 + bob, w*0.42, h*0.28, 0, 0, Math.PI*2);
  ctx.fill();
  // tay
  ctx.fillStyle = "#e6f0ff";
  ctx.fillRect(x - w*0.04, y + h*0.45 + bob, w*0.18, h*0.32);
  ctx.fillRect(x + w*0.86, y + h*0.45 + bob, w*0.18, h*0.32);
  // ngực bộ lông sẫm hơn
  ctx.fillStyle = "#dde9f2";
  ctx.fillRect(x + w*0.42, y + h*0.45 + bob, w*0.16, h*0.20);
  // đầu
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(x + w/2, y + h*0.25 + bob, w*0.27, 0, Math.PI*2); ctx.fill();
  // sừng
  ctx.fillStyle = "#a0c0e0";
  ctx.beginPath();
  ctx.moveTo(x + w*0.30, y + h*0.10 + bob);
  ctx.lineTo(x + w*0.18, y + h*0.0 + bob);
  ctx.lineTo(x + w*0.36, y + h*0.04 + bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w*0.70, y + h*0.10 + bob);
  ctx.lineTo(x + w*0.82, y + h*0.0 + bob);
  ctx.lineTo(x + w*0.64, y + h*0.04 + bob);
  ctx.fill();
  // mắt
  ctx.fillStyle = "#1a5a8a";
  ctx.fillRect(x + w*0.36, y + h*0.22 + bob, 8, 8);
  ctx.fillRect(x + w*0.56, y + h*0.22 + bob, 8, 8);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + w*0.38, y + h*0.24 + bob, 3, 3);
  ctx.fillRect(x + w*0.58, y + h*0.24 + bob, 3, 3);
  // răng nanh
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + w*0.40, y + h*0.32 + bob, w*0.20, 8);
  ctx.fillStyle = "#000";
  ctx.fillRect(x + w*0.42, y + h*0.32 + bob, 2, 6);
  ctx.fillRect(x + w*0.46, y + h*0.32 + bob, 2, 6);
  ctx.fillRect(x + w*0.52, y + h*0.32 + bob, 2, 6);
  ctx.fillRect(x + w*0.56, y + h*0.32 + bob, 2, 6);
  // hạt tuyết bay quanh
  if (t % 6 === 0) {
    spawnParticles(b.x + rand(0, b.w), b.y + rand(0, b.h*0.4), {
      count: 1, color: "#dff4ff", speed: 0.5, size: 2, life: 40, gravity: 0.05
    });
  }
}

// ----- Hàm vẽ Hổ Lửa (Đảo 4) -----
function drawFireTiger(b, camX, camY) {
  const x = b.x - camX, y = b.y - camY;
  const w = b.w, h = b.h;
  const t = b.animTime;
  const bob = Math.sin(t*0.12) * 2;
  // hào quang lửa
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.18 + 0.18 * Math.sin(t * 0.2 + i);
    ctx.fillStyle = ["#ff3838","#ff8a3c","#ffd24a"][i];
    ctx.beginPath();
    ctx.arc(x + w/2, y + h*0.55, w*0.55 + i*5, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // chân
  ctx.fillStyle = "#ff8a3c";
  ctx.fillRect(x + w*0.18, y + h*0.78 + bob, w*0.16, h*0.22);
  ctx.fillRect(x + w*0.66, y + h*0.78 + bob, w*0.16, h*0.22);
  ctx.fillStyle = "#3a1a06";
  ctx.fillRect(x + w*0.18, y + h*0.94 + bob, w*0.16, h*0.06);
  ctx.fillRect(x + w*0.66, y + h*0.94 + bob, w*0.16, h*0.06);
  // thân
  ctx.fillStyle = "#ff8a3c";
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h*0.6 + bob, w*0.42, h*0.28, 0, 0, Math.PI*2);
  ctx.fill();
  // sọc đen
  ctx.fillStyle = "#1a0a06";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + w*0.18 + i*w*0.16, y + h*0.40 + bob, 4, h*0.4);
  }
  // đuôi
  ctx.fillStyle = "#ff8a3c";
  ctx.fillRect(x + w*0.85, y + h*0.45 + bob, w*0.15, 8);
  ctx.fillRect(x + w*0.95, y + h*0.30 + bob, 8, h*0.20);
  ctx.fillStyle = "#1a0a06";
  ctx.fillRect(x + w*0.95, y + h*0.30 + bob, 8, 4);
  ctx.fillRect(x + w*0.95, y + h*0.40 + bob, 8, 4);
  // đầu
  ctx.fillStyle = "#ff8a3c";
  ctx.beginPath(); ctx.arc(x + w*0.5, y + h*0.32 + bob, w*0.27, 0, Math.PI*2); ctx.fill();
  // tai
  ctx.fillStyle = "#a51212";
  ctx.beginPath();
  ctx.moveTo(x + w*0.30, y + h*0.18 + bob);
  ctx.lineTo(x + w*0.36, y + h*0.06 + bob);
  ctx.lineTo(x + w*0.44, y + h*0.20 + bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w*0.70, y + h*0.18 + bob);
  ctx.lineTo(x + w*0.64, y + h*0.06 + bob);
  ctx.lineTo(x + w*0.56, y + h*0.20 + bob);
  ctx.fill();
  // sọc trán
  ctx.fillStyle = "#1a0a06";
  ctx.fillRect(x + w*0.36, y + h*0.14 + bob, 4, 12);
  ctx.fillRect(x + w*0.60, y + h*0.14 + bob, 4, 12);
  // mắt vàng dữ
  ctx.fillStyle = "#ffe04a";
  ctx.beginPath(); ctx.arc(x + w*0.42, y + h*0.30 + bob, 5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.58, y + h*0.30 + bob, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(x + w*0.42, y + h*0.30 + bob, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.58, y + h*0.30 + bob, 2, 0, Math.PI*2); ctx.fill();
  // miệng + nanh
  ctx.fillStyle = "#a51212";
  ctx.fillRect(x + w*0.42, y + h*0.42 + bob, w*0.16, 6);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(x + w*0.45, y + h*0.42 + bob);
  ctx.lineTo(x + w*0.47, y + h*0.50 + bob);
  ctx.lineTo(x + w*0.49, y + h*0.42 + bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w*0.51, y + h*0.42 + bob);
  ctx.lineTo(x + w*0.53, y + h*0.50 + bob);
  ctx.lineTo(x + w*0.55, y + h*0.42 + bob);
  ctx.fill();
  // tia lửa rơi
  if (t % 5 === 0) {
    spawnParticles(b.x + rand(0, b.w), b.y + b.h * 0.7, {
      count: 1, color: choice(["#ff3838","#ff8a3c","#ffd24a"]),
      speed: 0.5, size: 3, life: 25, gravity: -0.05
    });
  }
}

// ----- Hàm vẽ Vua Hải Tặc Đen (Đảo 5) -----
function drawDarkKing(b, camX, camY) {
  const x = b.x - camX, y = b.y - camY;
  const w = b.w, h = b.h;
  const t = b.animTime;
  const bob = Math.sin(t*0.07) * 3;
  // bóng tối quanh người
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#3a1a5e";
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h*0.55, w*0.55, h*0.45, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // ủng đen
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + w*0.30, y + h*0.78 + bob, w*0.15, h*0.22);
  ctx.fillRect(x + w*0.55, y + h*0.78 + bob, w*0.15, h*0.22);
  // áo choàng đen
  ctx.fillStyle = "#1a0e2a";
  ctx.fillRect(x + w*0.18, y + h*0.40 + bob, w*0.64, h*0.42);
  // viền vàng
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(x + w*0.18, y + h*0.40 + bob, w*0.64, 4);
  ctx.fillRect(x + w*0.18, y + h*0.80 + bob, w*0.64, 3);
  ctx.fillRect(x + w*0.48, y + h*0.40 + bob, 4, h*0.42);
  // đầu
  ctx.fillStyle = "#d4a070";
  ctx.beginPath(); ctx.arc(x + w*0.5, y + h*0.30 + bob, w*0.18, 0, Math.PI*2); ctx.fill();
  // mắt đỏ phát sáng
  ctx.fillStyle = "#ff0000";
  ctx.beginPath(); ctx.arc(x + w*0.43, y + h*0.28 + bob, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w*0.57, y + h*0.28 + bob, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + w*0.41, y + h*0.27 + bob, 2, 2);
  ctx.fillRect(x + w*0.55, y + h*0.27 + bob, 2, 2);
  // miệng
  ctx.fillStyle = "#3a1a06";
  ctx.fillRect(x + w*0.44, y + h*0.34 + bob, w*0.12, 3);
  // mũ ba góc
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.moveTo(x + w*0.18, y + h*0.16 + bob);
  ctx.lineTo(x + w*0.50, y + h*0.02 + bob);
  ctx.lineTo(x + w*0.82, y + h*0.16 + bob);
  ctx.lineTo(x + w*0.85, y + h*0.22 + bob);
  ctx.lineTo(x + w*0.15, y + h*0.22 + bob);
  ctx.fill();
  // đầu lâu trên mũ
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(x + w*0.5, y + h*0.12 + bob, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.fillRect(x + w*0.48, y + h*0.11 + bob, 2, 2);
  ctx.fillRect(x + w*0.51, y + h*0.11 + bob, 2, 2);
  // xương chéo
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + w*0.47, y + h*0.16 + bob, 8, 2);
  // kiếm trên tay phải
  ctx.fillStyle = "#cfd6e0";
  ctx.fillRect(x + w*0.85, y + h*0.30 + bob, 6, h*0.50);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + w*0.86, y + h*0.30 + bob, 1, h*0.40);
  ctx.fillStyle = "#3a1a06";
  ctx.fillRect(x + w*0.81, y + h*0.78 + bob, 14, 5);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(x + w*0.86, y + h*0.84 + bob, 4, 8);
  // tay trái
  ctx.fillStyle = "#1a0e2a";
  ctx.fillRect(x + w*0.04, y + h*0.42 + bob, w*0.14, h*0.30);
  // hạt năng lượng tím
  if (t % 6 === 0) {
    spawnParticles(b.x + b.w/2 + rand(-30, 30), b.y + b.h/2 + rand(-20, 20), {
      count: 1, color: "#a26bff", speed: 1, size: 3, life: 35, gravity: -0.06
    });
  }
}

// =============================================================================
// KỸ NĂNG RIÊNG cho từng boss
// Mỗi hàm tạo MagicOrb (đạn) đẩy vào enemyOrbs[] với pattern khác nhau.
// =============================================================================

// Vua Khỉ Đỏ: ném 3 quả chuối hình parabol (có trọng lực)
function bossSkillMonkey(b, player) {
  const cx = b.x + b.w/2, cy = b.y + b.h*0.25;
  const dxA = (player.x + player.w/2) - cx;
  const dyA = (player.y + player.h/2) - cy;
  for (let k = 0; k < 3; k++) {
    const flightTime = 50 + k * 6;
    const orb = new MagicOrb(cx - 10, cy - 10, 1, 0, "enemy", {
      color: "#ffd24a", glow: "#fff5a0",
      dmg: b.dmg, speed: 1, size: 18, gravity: 0.4
    });
    orb.vx = dxA / flightTime;
    orb.vy = (dyA - 0.5 * 0.4 * flightTime * flightTime) / flightTime;
    orb.life = flightTime + 30;
    enemyOrbs.push(orb);
  }
}

// Bọ Cạp Khổng Lồ: bắn 5 đạn độc xanh hình quạt
function bossSkillScorpion(b, player) {
  const cx = b.x + b.w/2, cy = b.y + b.h*0.05;   // đuôi ở trên
  const dxA = (player.x + player.w/2) - cx;
  const dyA = (player.y + player.h/2) - cy;
  const baseAng = Math.atan2(dyA, dxA);
  for (let k = -2; k <= 2; k++) {
    const a = baseAng + k * 0.18;
    enemyOrbs.push(new MagicOrb(cx - 8, cy, Math.cos(a), Math.sin(a), "enemy", {
      color: "#5ec85a", glow: "#aef0a8",
      dmg: b.dmg * 0.8, speed: 9, size: 14
    }));
  }
}

// Yeti: tỏa 8 đạn băng ra mọi hướng
function bossSkillYeti(b, player) {
  const cx = b.x + b.w/2, cy = b.y + b.h/2;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    enemyOrbs.push(new MagicOrb(cx - 10, cy - 10, Math.cos(a), Math.sin(a), "enemy", {
      color: "#9ee0ff", glow: "#dff4ff",
      dmg: b.dmg * 0.7, speed: 6, size: 18
    }));
  }
  spawnParticles(cx, cy, {
    count: 30, color: "#dff4ff", speed: 5, size: 4, life: 30
  });
}

// Hổ Lửa: phun 5 quả lửa hẹp + lao về phía người chơi
function bossSkillTiger(b, player) {
  const cx = b.x + b.w/2, cy = b.y + b.h/2;
  const dxA = (player.x + player.w/2) - cx;
  const dyA = (player.y + player.h/2) - cy;
  const baseAng = Math.atan2(dyA, dxA);
  for (let k = -2; k <= 2; k++) {
    const a = baseAng + k * 0.10;
    enemyOrbs.push(new MagicOrb(cx - 10, cy - 10, Math.cos(a), Math.sin(a), "enemy", {
      color: "#ff8a3c", glow: "#ffd4a8",
      dmg: b.dmg * 0.9, speed: 11, size: 18
    }));
  }
  // bứt tốc về phía player
  b.vx = Math.sign(dxA || 1) * 9;
  b.vy = -7;
}

// Vua Hải Tặc Đen: 6 đạn tỏa tròn + 2 đạn nhanh tới người chơi
function bossSkillDarkKing(b, player) {
  const cx = b.x + b.w/2, cy = b.y + b.h/2;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    enemyOrbs.push(new MagicOrb(cx - 10, cy - 10, Math.cos(a), Math.sin(a), "enemy", {
      color: "#a26bff", glow: "#cba9ff",
      dmg: b.dmg * 0.9, speed: 5, size: 18
    }));
  }
  const dxA = (player.x + player.w/2) - cx;
  const dyA = (player.y + player.h/2) - cy;
  const baseAng = Math.atan2(dyA, dxA);
  for (let k = -1; k <= 1; k += 2) {
    const a = baseAng + k * 0.06;
    enemyOrbs.push(new MagicOrb(cx - 10, cy - 10, Math.cos(a), Math.sin(a), "enemy", {
      color: "#fff", glow: "#cba9ff",
      dmg: b.dmg, speed: 12, size: 14
    }));
  }
}

// =============================================================================
// Bảng tra cứu boss: kích thước, chỉ số, hàm vẽ và kỹ năng
// Dùng bởi class Enemy: dispatch theo this.bossKind
// =============================================================================
const BOSS_KINDS = {
  monkey_king:    { name: "Vua Khỉ Đỏ",            w: 100, h: 120, hpMul: 1.0, dmgMul: 1.0, cooldown: 70, draw: drawMonkeyKing,    skill: bossSkillMonkey   },
  giant_scorpion: { name: "Bọ Cạp Khổng Lồ",       w: 130, h: 100, hpMul: 1.0, dmgMul: 1.0, cooldown: 50, draw: drawGiantScorpion, skill: bossSkillScorpion },
  yeti:           { name: "Người Tuyết Khổng Lồ",  w: 110, h: 130, hpMul: 1.3, dmgMul: 0.9, cooldown: 95, draw: drawYeti,          skill: bossSkillYeti     },
  fire_tiger:     { name: "Hổ Lửa",                w: 130, h: 100, hpMul: 1.0, dmgMul: 1.1, cooldown: 60, draw: drawFireTiger,     skill: bossSkillTiger    },
  dark_king:      { name: "Vua Hải Tặc Đen",       w: 100, h: 130, hpMul: 1.5, dmgMul: 1.2, cooldown: 80, draw: drawDarkKing,      skill: bossSkillDarkKing }
};
