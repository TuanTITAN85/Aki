"use strict";
// =============================================================================
// RENDER HELPERS - tiện ích chung cho việc vẽ + sprite của nhân vật chính
//
// Module này gom các thứ "không có dependency" để load đầu tiên:
//   - Hàm tiện ích chung: rand, randi, choice, clamp, rectsHit
//   - drawText (vẽ chữ có viền)
//   - Hệ thống Particle
//   - drawPixelSprite (vẽ sprite từ ma trận chữ + bảng màu)
//   - PIRATE_PALETTE + 5 sprite tư thế của Hải tặc (idle/run/jump)
//
// Phụ thuộc: chỉ `ctx` (canvas 2D context) - được khai báo ở index.html.
// Vì các hàm chỉ dùng `ctx` ở runtime (không phải load time) nên thứ tự load
// không quan trọng miễn là `ctx` tồn tại trước khi gọi.
// =============================================================================

// ----- Tiện ích chung -----
const rand   = (a, b) => a + Math.random() * (b - a);
const randi  = (a, b) => Math.floor(rand(a, b + 1));
const choice = arr => arr[randi(0, arr.length - 1)];
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Kiểm tra hai hình chữ nhật có chạm nhau không (AABB)
function rectsHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Vẽ chữ có viền (cho dễ đọc trên nền)
function drawText(text, x, y, size = 18, color = "#fff", outline = "#000", align = "left") {
  ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.lineWidth = Math.max(2, size / 8);
  ctx.strokeStyle = outline;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// =============================================================================
// HỆ THỐNG HẠT (Particle System)
// Dùng cho bụi khi nhảy, sao khi nhặt vật phẩm, vụ nổ khi đánh trúng, v.v.
// =============================================================================
const particles = [];

function spawnParticles(x, y, opts = {}) {
  // opts: count, color, speed, size, life, gravity, spread, upward, shape
  const count = opts.count || 12;
  for (let i = 0; i < count; i++) {
    const ang = rand(0, Math.PI * 2);
    const sp  = rand((opts.speed || 3) * 0.3, opts.speed || 3);
    particles.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - (opts.upward || 0),
      life: opts.life || 35,
      maxLife: opts.life || 35,
      size: opts.size || 3,
      color: opts.color || "#ffd54a",
      gravity: opts.gravity == null ? 0.18 : opts.gravity,
      shape: opts.shape || "square"   // "square" | "star"
    });
  }
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles(camX, camY) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.shape === "star") {
      // ngôi sao 4 cánh đơn giản
      const s = p.size * (0.5 + alpha);
      ctx.fillRect(p.x - camX - s, p.y - camY - 1, s * 2, 2);
      ctx.fillRect(p.x - camX - 1, p.y - camY - s, 2, s * 2);
    } else {
      const s = p.size * (0.5 + alpha);
      ctx.fillRect(p.x - camX - s/2, p.y - camY - s/2, s, s);
    }
  }
  ctx.globalAlpha = 1;
}

// =============================================================================
// VẼ PIXEL ART
// Mỗi sprite là ma trận chữ - mỗi ký tự ứng với 1 màu trong palette
// =============================================================================
function drawPixelSprite(grid, palette, dx, dy, pixel = 3, flip = false) {
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === "." || ch === " ") continue;
      const color = palette[ch];
      if (!color) continue;
      const cx = flip ? (line.length - 1 - col) : col;
      ctx.fillStyle = color;
      ctx.fillRect(dx + cx * pixel, dy + row * pixel, pixel, pixel);
    }
  }
}

// ----- Sprite của Hải tặc (nhân vật chính) -----
// Bảng màu: K=đen, S=da, R=đỏ (mũ), W=trắng, B=xanh áo, Y=vàng, P=tím (mắt),
// G=xám (kiếm), O=cam
const PIRATE_PALETTE = {
  K: "#1b1f2a",
  S: "#ffd6a8",
  R: "#d33b3b",
  W: "#ffffff",
  B: "#2b6dff",
  Y: "#f5c542",
  P: "#3a2a5e",
  G: "#cfd6e0",
  O: "#ff8a3c",
  X: "#000000"
};

// Mỗi pose là 1 ma trận ~12 cột x 16 dòng
const PIRATE_IDLE_1 = [
  "....RRRRRR..",
  "...RWRRRRRR.",
  "....RRRRRR..",
  "....SSSSSS..",
  "...SSKSKSS..",   // mặt + mắt
  "...SSSSSSS..",
  "....KSSSK...",   // miệng cười
  "...BBBBBBB..",
  "..BBBYBBBB..",   // áo có nút vàng
  "..BBBYBBBBG.",   // tay phải cầm chuôi kiếm (G)
  "..BBBBBBBBG.",
  "...KKKKKK.G.",
  "...KK..KK.G.",
  "...KK..KK...",
  "..KKK..KKK..",
  "..KKK..KKK.."
];
const PIRATE_IDLE_2 = [
  "....RRRRRR..",
  "...RWRRRRRR.",
  "....RRRRRR..",
  "....SSSSSS..",
  "...SSKSKSS..",
  "...SSSSSSS..",
  "....KSSSK...",
  "...BBBBBBB..",
  "...BBBYBBB..",
  "..BBBYBBBBG.",
  "..BBBBBBBBG.",
  "...KKKKKK.G.",
  "...KK..KK.G.",
  "...KK..KK...",
  "..KKK..KKK..",
  "..KKK..KKK.."
];
const PIRATE_RUN_1 = [
  "....RRRRRR..",
  "...RWRRRRRR.",
  "....RRRRRR..",
  "....SSSSSS..",
  "...SSKSKSS..",
  "...SSSSSSS..",
  "....KSSSK...",
  "...BBBBBBB..",
  "..BBBBYBBB.G",
  "..BBBBYBBBBG",
  "...BBBBBBB.G",
  "...KKKKKK...",
  "..KK....KK..",
  ".KK......KK.",
  ".KK......KK.",
  "KKK.......KK"
];
const PIRATE_RUN_2 = [
  "....RRRRRR..",
  "...RWRRRRRR.",
  "....RRRRRR..",
  "....SSSSSS..",
  "...SSKSKSS..",
  "...SSSSSSS..",
  "....KSSSK...",
  "..BBBBBBB...",
  "GBBBBBYBBB..",
  "GBBBBBYBBBB.",
  "GBBBBBBBB...",
  "...KKKKKK...",
  "...KK..KKK..",
  "..KK....KKK.",
  "..KK......KK",
  "..KKK......K"
];
const PIRATE_JUMP = [
  "....RRRRRR..",
  "...RWRRRRRR.",
  "....RRRRRR..",
  "....SSSSSS..",
  "...SSKSKSS..",
  "...SSSSSSS..",
  "....KSSSK...",
  "...BBBBBBB..",
  "GGBBBYBBBBGG",
  ".GBBBYBBBBG.",
  "..BBBBBBBB..",
  "...KKKKKK...",
  "...KK..KK...",
  "..KK....KK..",
  "..KK....KK..",
  "............"
];

// =============================================================================
// SPRITE SHEET MỚI cho hải tặc (PNG từ assets/)
// Mỗi animation là 1 file: các frame xếp ngang, kích thước bằng nhau.
// Background trắng được chuyển thành alpha=0 ngay khi tải (chroma key).
//
// Trong Player.draw(): nếu sprite đã tải xong -> dùng ctx.drawImage,
// ngược lại fallback về PIRATE_IDLE_*/PIRATE_RUN_*/PIRATE_JUMP pixel matrix.
// State "jump" hiện tại chưa có asset PNG -> luôn dùng pixel matrix cũ.
// =============================================================================
const PIRATE_SPRITES = {
  idle: { src: "assets/pirate_idle.png", frameW: 400, frameH: 397, count: 4, image: null, ready: false },
  run:  { src: "assets/pirate_run.png",  frameW: 400, frameH: 397, count: 4, image: null, ready: false }
};

// Tải ảnh + chroma key trắng -> alpha=0 (Gemini xuất background trắng đặc)
function loadPirateSprites() {
  for (const key of Object.keys(PIRATE_SPRITES)) {
    const cfg = PIRATE_SPRITES[key];
    const img = new Image();
    img.onload = () => {
      // Vẽ image lên canvas tạm để xử lý pixel
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d");
      cx.drawImage(img, 0, 0);
      const data = cx.getImageData(0, 0, c.width, c.height);
      const px = data.data;
      // Pixel gần trắng (>240 ở cả 3 kênh) -> trong suốt
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] > 240 && px[i+1] > 240 && px[i+2] > 240) {
          px[i+3] = 0;
        }
      }
      cx.putImageData(data, 0, 0);
      cfg.image = c;          // dùng canvas đã alpha hoá thay cho image gốc
      cfg.ready = true;
    };
    img.onerror = () => {
      console.warn("Không tải được sprite:", cfg.src,
                   "- player sẽ dùng pixel matrix cũ");
      cfg.ready = false;
    };
    img.src = cfg.src;
  }
}
loadPirateSprites();

// Vẽ 1 frame của sprite hải tặc. Trả về true nếu vẽ thành công, false nếu
// sprite chưa tải xong (caller nên fallback sang pixel matrix).
function drawPirateSpriteFrame(state, frameIdx, dx, dy, dw, dh, flip) {
  const cfg = PIRATE_SPRITES[state];
  if (!cfg || !cfg.ready) return false;
  const sx = (frameIdx % cfg.count) * cfg.frameW;
  const sy = 0;
  if (flip) {
    ctx.save();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(cfg.image, sx, sy, cfg.frameW, cfg.frameH, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(cfg.image, sx, sy, cfg.frameW, cfg.frameH, dx, dy, dw, dh);
  }
  return true;
}
