"use strict";
// =============================================================================
// WORLD - vẽ nền + platform + decoration + camera follow
//
// Phụ thuộc:
//   ctx, W, H (index.html)
//   render.js: clamp
//
// Export:
//   drawBackground(level, camX) — bầu trời, mặt trời, mây, núi, biển, sóng
//   drawPlatforms(level, camX, camY) — đất chính + bục lơ lửng
//   drawDecorations(level, camX, camY) — cây/cactus/pine/rock/cloud
//   camera, updateCamera(player, level) — camera lerp follow
// =============================================================================

function drawBackground(level, camX) {
  const cfg = level.config;

  // Ưu tiên ảnh nền PNG nếu có asset cho đảo này (mapping qua decoration)
  const bgKey = ISLAND_BG_MAP && ISLAND_BG_MAP[cfg.decoration];
  const bg    = bgKey && ISLAND_BACKGROUNDS[bgKey];
  if (bg && bg.ready) {
    // Vẽ ảnh full canvas với parallax 0.3 (di chuyển 30% so với camera)
    // Lặp 2 lần liên tiếp + Math.floor để toạ độ luôn nguyên + overlap 1px
    // (đè vào nhau 1 pixel để chặn vạch đen subpixel ở chỗ nối)
    let offsetX = -((camX * 0.3) % W);
    if (offsetX > 0) offsetX -= W;
    offsetX = Math.floor(offsetX);
    ctx.drawImage(bg.image, offsetX,         0, W + 1, H);
    ctx.drawImage(bg.image, offsetX + W,     0, W + 1, H);
    // Vẫn vẽ sóng động phía dưới để cảm giác biển sống động
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 30; i++) {
      const wx = ((i * 60 - camX * 0.6) % (W + 60) + (W + 60)) % (W + 60);
      ctx.fillRect(wx, 670 + (i % 3) * 8, 30, 3);
    }
    return;
  }

  // Fallback: gradient + sun + clouds + mountains thủ công
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, cfg.skyTop);
  g.addColorStop(1, cfg.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath(); ctx.arc(W - 160, 120, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff5a0";
  ctx.beginPath(); ctx.arc(W - 160, 120, 44, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 320 - camX * 0.2) % (W + 200) + (W + 200)) % (W + 200) - 100;
    const cy = 80 + (i % 3) * 50;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.arc(cx + 24, cy + 4, 22, 0, Math.PI * 2);
    ctx.arc(cx - 24, cy + 6, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = cfg.groundBot;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 10; i++) {
    const mx = ((i * 380 - camX * 0.4) % (W + 400) + (W + 400)) % (W + 400) - 200;
    const my = 380;
    ctx.beginPath();
    ctx.moveTo(mx, my + 200);
    ctx.lineTo(mx + 180, my);
    ctx.lineTo(mx + 360, my + 200);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = cfg.waterColor;
  ctx.fillRect(0, 660, W, H - 660);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  for (let i = 0; i < 30; i++) {
    const wx = ((i * 60 - camX * 0.6) % (W + 60) + (W + 60)) % (W + 60);
    ctx.fillRect(wx, 670 + (i % 3) * 8, 30, 3);
  }
}

function drawPlatforms(level, camX, camY) {
  const cfg = level.config;
  for (const p of level.platforms) {
    const px = p.x - camX, py = p.y - camY;
    if (px + p.w < -50 || px > W + 50) continue; // ngoài màn hình thì bỏ qua
    if (p.type === "ground") {
      // đất chính
      ctx.fillStyle = cfg.groundTop;
      ctx.fillRect(px, py, p.w, 12);
      ctx.fillStyle = cfg.sandTop;
      ctx.fillRect(px, py + 12, p.w, 8);
      ctx.fillStyle = cfg.groundBot;
      ctx.fillRect(px, py + 20, p.w, p.h - 20);
      // chấm nhỏ trang trí
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      for (let i = 0; i < p.w; i += 24) {
        ctx.fillRect(px + i + 6, py + 30, 3, 3);
        ctx.fillRect(px + i + 14, py + 60, 3, 3);
      }
    } else {
      // bục lơ lửng
      ctx.fillStyle = cfg.groundBot;
      ctx.fillRect(px, py + 4, p.w, p.h);
      ctx.fillStyle = cfg.groundTop;
      ctx.fillRect(px, py, p.w, 8);
      ctx.fillStyle = cfg.sandTop;
      ctx.fillRect(px, py + 8, p.w, 4);
    }
  }
}

function drawDecorations(level, camX, camY) {
  for (const d of level.decorations) {
    const px = d.x - camX, py = d.y - camY;
    if (px < -100 || px > W + 100) continue;
    const s = d.size;
    if (d.kind === "tree") {
      // cây dừa / cây xanh đơn giản
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px - 4 * s, py - 70 * s, 8 * s, 70 * s);
      ctx.fillStyle = "#3a8a2a";
      ctx.beginPath(); ctx.arc(px, py - 70 * s, 28 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6ec85a";
      ctx.beginPath(); ctx.arc(px - 8, py - 76 * s, 18 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 12, py - 72 * s, 16 * s, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === "cactus") {
      ctx.fillStyle = "#2a8a4a";
      ctx.fillRect(px - 6, py - 56, 12, 56);
      ctx.fillRect(px - 18, py - 38, 6, 22);
      ctx.fillRect(px + 12, py - 46, 6, 26);
    } else if (d.kind === "pine") {
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px - 4, py - 20, 8, 20);
      ctx.fillStyle = "#1a5a2a";
      ctx.beginPath();
      ctx.moveTo(px, py - 90);
      ctx.lineTo(px + 28, py - 20);
      ctx.lineTo(px - 28, py - 20);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px, py - 70);
      ctx.lineTo(px + 22, py - 30);
      ctx.lineTo(px - 22, py - 30);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(px - 22, py - 24, 44, 4);
    } else if (d.kind === "rock") {
      ctx.fillStyle = "#3a1a06";
      ctx.beginPath(); ctx.arc(px, py - 14, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#7a3a1a";
      ctx.beginPath(); ctx.arc(px - 4, py - 18, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff7a3c";
      ctx.fillRect(px - 16, py - 4, 32, 4); // dung nham
    } else if (d.kind === "cloud") {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath(); ctx.arc(px, py - 30, 18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 16, py - 26, 14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px - 16, py - 22, 12, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// =============================================================================
// CAMERA - lerp follow theo player, clamp ở rìa đảo
// =============================================================================
const camera = { x: 0, y: 0, tx: 0, ty: 0 };

function updateCamera(player, level) {
  camera.tx = player.x + player.w / 2 - W / 2;
  camera.ty = player.y + player.h / 2 - H / 2 - 60;
  camera.tx = clamp(camera.tx, 0, level.width - W);
  camera.ty = clamp(camera.ty, -120, 200);
  // camera đuổi mượt
  camera.x += (camera.tx - camera.x) * 0.12;
  camera.y += (camera.ty - camera.y) * 0.12;
}
