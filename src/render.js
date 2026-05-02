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
// ASSET LOADER - đếm tài nguyên đang tải để loading screen hiển thị tiến độ
//   Mỗi nơi load asset (PNG, etc.) gọi:
//     AssetLoader.expect()         - báo trước "tôi sắp tải 1 file"
//     AssetLoader.done(ok)         - khi tải xong (ok=true) hoặc fail (ok=false)
//   Game state machine:
//     AssetLoader.isReady()        - true khi tất cả asset đã xong (success/fail)
//     AssetLoader.progress()       - 0..1 cho progress bar
// =============================================================================
const AssetLoader = {
  total: 0,
  loaded: 0,
  failed: 0,
  expect() { this.total++; },
  done(ok) { if (ok) this.loaded++; else this.failed++; },
  isReady() {
    // total>0 đảm bảo ít nhất có 1 asset đã đăng ký (tránh ready ngay frame đầu
    // khi script chưa kịp gọi expect())
    return this.total > 0 && (this.loaded + this.failed >= this.total);
  },
  progress() {
    return this.total === 0 ? 0 : (this.loaded + this.failed) / this.total;
  }
};

// =============================================================================
// SPRITE SHEET CỦA HẢI TẶC - 1 file PNG duy nhất chứa 4x4 = 16 frame
//   Hàng 0: idle  (4 frame)
//   Hàng 1: run   (4 frame)
//   Hàng 2: jump  (4 frame)
//   Hàng 3: shoot (4 frame, chưa dùng - giữ sẵn cho mở rộng tương lai)
//
// Background magenta được tự động loại bỏ (chroma key) khi tải.
// Trong Player.draw(): nếu sprite đã ready -> ctx.drawImage,
// ngược lại fallback về pixel matrix cũ (PIRATE_IDLE_*/RUN_*/JUMP).
// =============================================================================
const PIRATE_SHEET = {
  src: "assets/pirate_sprite.png",
  cols: 4, rows: 4,
  // Định nghĩa từng state: hàng nào, số frame, tốc độ đổi
  states: {
    idle:  { row: 0, frames: 4, rate: 12 },   // chậm, hơi nhún
    run:   { row: 1, frames: 4, rate: 6  },   // chạy nhanh
    jump:  { row: 2, frames: 4, rate: 8  },
    shoot: { row: 3, frames: 4, rate: 5  }
  },
  image: null,
  ready: false,
  frameW: 0,        // tính sau khi tải (= imageWidth / cols)
  frameH: 0
};

// Chroma key: pixel có màu gần với góc trên trái (background) -> alpha=0
// Cách này tổng quát, không cần biết bg màu gì sẵn (magenta/trắng/xanh đều xài được).
function chromaKey(canvas, threshold = 35) {
  const cx = canvas.getContext("2d");
  const data = cx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  // Đọc pixel góc (0,0) làm màu nền tham chiếu
  const bgR = px[0], bgG = px[1], bgB = px[2];
  for (let i = 0; i < px.length; i += 4) {
    const dr = Math.abs(px[i]   - bgR);
    const dg = Math.abs(px[i+1] - bgG);
    const db = Math.abs(px[i+2] - bgB);
    if (dr < threshold && dg < threshold && db < threshold) {
      px[i+3] = 0;
    }
  }
  cx.putImageData(data, 0, 0);
}

function loadPirateSheet() {
  AssetLoader.expect();
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    chromaKey(c);                  // loại bg magenta
    PIRATE_SHEET.image = c;
    PIRATE_SHEET.frameW = img.width  / PIRATE_SHEET.cols;
    PIRATE_SHEET.frameH = img.height / PIRATE_SHEET.rows;
    PIRATE_SHEET.ready = true;
    AssetLoader.done(true);
  };
  img.onerror = () => {
    console.warn("Không tải được sprite sheet:", PIRATE_SHEET.src,
                 "- player sẽ dùng pixel matrix cũ");
    AssetLoader.done(false);
  };
  img.src = PIRATE_SHEET.src;
}
loadPirateSheet();

// Vẽ 1 frame theo state + animTime. Trả về true nếu vẽ được, false nếu sprite
// chưa tải xong (caller fallback sang pixel matrix).
function drawPirateSpriteFrame(state, animTime, dx, dy, dw, dh, flip) {
  if (!PIRATE_SHEET.ready) return false;
  const cfg = PIRATE_SHEET.states[state];
  if (!cfg) return false;
  const idx = Math.floor(animTime / cfg.rate) % cfg.frames;
  const sx = idx     * PIRATE_SHEET.frameW;
  const sy = cfg.row * PIRATE_SHEET.frameH;
  const sw = PIRATE_SHEET.frameW;
  const sh = PIRATE_SHEET.frameH;
  if (flip) {
    ctx.save();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(PIRATE_SHEET.image, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(PIRATE_SHEET.image, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  return true;
}

// =============================================================================
// SPRITE SHEET CỦA LÍNH CANH - 4x4 grid: idle / walk / aggro / attack
// Cùng pattern với PIRATE_SHEET, dùng cho class Enemy khi kind="guard".
// =============================================================================
const GUARD_SHEET = {
  src: "assets/guard_sprite.png",
  cols: 4, rows: 4,
  states: {
    idle:   { row: 0, frames: 4, rate: 14 },   // đứng yên cảnh giới
    walk:   { row: 1, frames: 4, rate: 8  },   // tuần tra (đi bộ)
    aggro:  { row: 2, frames: 4, rate: 6  },   // đuổi player, kiếm giơ cao
    attack: { row: 3, frames: 4, rate: 5  }    // đánh kiếm
  },
  image: null,
  ready: false,
  frameW: 0,
  frameH: 0
};

function loadGuardSheet() {
  AssetLoader.expect();
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    chromaKey(c);                  // loại bg magenta
    GUARD_SHEET.image = c;
    GUARD_SHEET.frameW = img.width  / GUARD_SHEET.cols;
    GUARD_SHEET.frameH = img.height / GUARD_SHEET.rows;
    GUARD_SHEET.ready = true;
    AssetLoader.done(true);
  };
  img.onerror = () => {
    console.warn("Không tải được:", GUARD_SHEET.src,
                 "- guard sẽ dùng pixel matrix cũ");
    AssetLoader.done(false);
  };
  img.src = GUARD_SHEET.src;
}
loadGuardSheet();

function drawGuardSpriteFrame(state, animTime, dx, dy, dw, dh, flip) {
  if (!GUARD_SHEET.ready) return false;
  const cfg = GUARD_SHEET.states[state];
  if (!cfg) return false;
  const idx = Math.floor(animTime / cfg.rate) % cfg.frames;
  const sx = idx     * GUARD_SHEET.frameW;
  const sy = cfg.row * GUARD_SHEET.frameH;
  const sw = GUARD_SHEET.frameW;
  const sh = GUARD_SHEET.frameH;
  if (flip) {
    ctx.save();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(GUARD_SHEET.image, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(GUARD_SHEET.image, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  return true;
}

// =============================================================================
// ẢNH TRÁI ÁC QUỶ - 5 PNG riêng biệt (1024x1024 mỗi cái, đã transparent)
// Dùng cho: Item.draw() khi kind="fruit", drawShopIcon() khi kind="fruit",
// và HUD icon khi đang dùng power (nếu sau muốn).
// =============================================================================
const FRUIT_IMAGES = {
  dragon:  { src: "assets/item_dragon.png",  image: null, ready: false },
  flame:   { src: "assets/item_flame.png",   image: null, ready: false },
  ice:     { src: "assets/item_ice.png",     image: null, ready: false },
  thunder: { src: "assets/item_thunder.png", image: null, ready: false },
  wind:    { src: "assets/item_wind.png",    image: null, ready: false }
};

function loadFruitImages() {
  for (const key of Object.keys(FRUIT_IMAGES)) {
    const cfg = FRUIT_IMAGES[key];
    AssetLoader.expect();
    const img = new Image();
    img.onload = () => {
      cfg.image = img;
      cfg.ready = true;
      AssetLoader.done(true);
    };
    img.onerror = () => {
      console.warn("Không tải được:", cfg.src);
      AssetLoader.done(false);
    };
    img.src = cfg.src;
  }
}
loadFruitImages();

// Vẽ 1 trái ác quỷ tại (dx, dy) với kích thước (dw, dh)
// Trả về true nếu vẽ được, false nếu ảnh chưa tải xong (caller fallback)
function drawFruitImage(fruit, dx, dy, dw, dh) {
  const cfg = FRUIT_IMAGES[fruit];
  if (!cfg || !cfg.ready) return false;
  ctx.drawImage(cfg.image, dx, dy, dw, dh);
  return true;
}

// =============================================================================
// SPRITE SHEET CỦA CHÚ CÚN ĐỒNG HÀNH - 4x4 grid (idle/walk/run/attack)
// =============================================================================
const DOG_SHEET = {
  src: "assets/companion_dog.png",
  cols: 4, rows: 4,
  states: {
    idle:   { row: 0, frames: 4, rate: 14 },   // đứng panting
    walk:   { row: 1, frames: 4, rate: 8  },   // đi theo player
    run:    { row: 2, frames: 4, rate: 5  },   // đuổi enemy
    attack: { row: 3, frames: 4, rate: 5  }    // pounce/cắn
  },
  image: null, ready: false, frameW: 0, frameH: 0
};

function loadDogSheet() {
  AssetLoader.expect();
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    chromaKey(c);                  // loại bg magenta
    DOG_SHEET.image  = c;
    DOG_SHEET.frameW = img.width  / DOG_SHEET.cols;
    DOG_SHEET.frameH = img.height / DOG_SHEET.rows;
    DOG_SHEET.ready  = true;
    AssetLoader.done(true);
  };
  img.onerror = () => {
    console.warn("Không tải được:", DOG_SHEET.src,
                 "- Cún sẽ dùng pixel matrix cũ");
    AssetLoader.done(false);
  };
  img.src = DOG_SHEET.src;
}
loadDogSheet();

function drawDogSpriteFrame(state, animTime, dx, dy, dw, dh, flip) {
  if (!DOG_SHEET.ready) return false;
  const cfg = DOG_SHEET.states[state];
  if (!cfg) return false;
  const idx = Math.floor(animTime / cfg.rate) % cfg.frames;
  const sx = idx     * DOG_SHEET.frameW;
  const sy = cfg.row * DOG_SHEET.frameH;
  if (flip) {
    ctx.save();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(DOG_SHEET.image, sx, sy, DOG_SHEET.frameW, DOG_SHEET.frameH,
                  0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(DOG_SHEET.image, sx, sy, DOG_SHEET.frameW, DOG_SHEET.frameH,
                  dx, dy, dw, dh);
  }
  return true;
}

// =============================================================================
// SPRITE SHEET BOSS - mỗi boss 1 file PNG, 4x4 grid (idle/walk/charge/attack)
// Cấu trúc dictionary để dễ thêm boss mới (chỉ cần thêm 1 entry).
// =============================================================================
const BOSS_SHEETS = {
  monkey_king: {
    src: "assets/boss_monkey_king.png",
    cols: 4, rows: 4,
    states: {
      idle:   { row: 0, frames: 4, rate: 12 },
      walk:   { row: 1, frames: 4, rate: 8  },
      charge: { row: 2, frames: 4, rate: 6  },
      attack: { row: 3, frames: 4, rate: 5  }
    },
    image: null, ready: false, frameW: 0, frameH: 0
  },
  giant_scorpion: {
    src: "assets/boss_giant_scorpion.png",
    cols: 4, rows: 4,
    states: {
      idle:   { row: 0, frames: 4, rate: 12 },
      walk:   { row: 1, frames: 4, rate: 8  },
      charge: { row: 2, frames: 4, rate: 6  },
      attack: { row: 3, frames: 4, rate: 5  }
    },
    image: null, ready: false, frameW: 0, frameH: 0
  },
  yeti: {
    src: "assets/boss_yeti.png",
    cols: 4, rows: 4,
    states: {
      idle:   { row: 0, frames: 4, rate: 12 },
      walk:   { row: 1, frames: 4, rate: 8  },
      charge: { row: 2, frames: 4, rate: 6  },
      attack: { row: 3, frames: 4, rate: 5  }
    },
    image: null, ready: false, frameW: 0, frameH: 0
  },
  fire_tiger: {
    src: "assets/boss_fire_tiger.png",
    cols: 4, rows: 4,
    states: {
      idle:   { row: 0, frames: 4, rate: 12 },
      walk:   { row: 1, frames: 4, rate: 8  },
      charge: { row: 2, frames: 4, rate: 6  },
      attack: { row: 3, frames: 4, rate: 5  }
    },
    image: null, ready: false, frameW: 0, frameH: 0
  },
  dark_king: {
    src: "assets/boss_dark_king.png",
    cols: 4, rows: 4,
    states: {
      idle:   { row: 0, frames: 4, rate: 12 },
      walk:   { row: 1, frames: 4, rate: 8  },
      charge: { row: 2, frames: 4, rate: 6  },
      attack: { row: 3, frames: 4, rate: 5  }
    },
    image: null, ready: false, frameW: 0, frameH: 0
  }
  // Hoàn tất 5 boss!
};

// =============================================================================
// BACKGROUND ĐẢO - 1 ảnh 16:9 cho mỗi chủ đề đảo, dùng làm parallax bg
// Tự thêm entry khi có thêm asset (snow, volcano, ...).
// Mapping decoration -> bg key: tree=grass, cactus=desert, pine=snow, rock=volcano
// =============================================================================
const ISLAND_BACKGROUNDS = {
  grass:   { src: "assets/bg_grass.png",   image: null, ready: false },
  desert:  { src: "assets/bg_desert.png",  image: null, ready: false },
  snow:    { src: "assets/bg_snow.png",    image: null, ready: false },
  volcano: { src: "assets/bg_volcano.png", image: null, ready: false }
  // Cloud island (đảo 5) vẫn dùng gradient cũ - dramatic cho boss cuối
};

function loadIslandBackgrounds() {
  for (const key of Object.keys(ISLAND_BACKGROUNDS)) {
    const cfg = ISLAND_BACKGROUNDS[key];
    AssetLoader.expect();
    const img = new Image();
    img.onload = () => {
      cfg.image = img;
      cfg.ready = true;
      AssetLoader.done(true);
    };
    img.onerror = () => {
      console.warn("Không tải được background:", cfg.src,
                   "- đảo này dùng gradient + parallax thủ công");
      AssetLoader.done(false);
    };
    img.src = cfg.src;
  }
}
loadIslandBackgrounds();

// Mapping từ field decoration trong ISLAND_CONFIGS -> bg key
const ISLAND_BG_MAP = {
  tree:   "grass",
  cactus: "desert",
  pine:   "snow",
  rock:   "volcano"
  // cloud: chưa có asset, dùng fallback gradient
};

function loadBossSheets() {
  for (const key of Object.keys(BOSS_SHEETS)) {
    const sheet = BOSS_SHEETS[key];
    AssetLoader.expect();
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d");
      cx.drawImage(img, 0, 0);
      chromaKey(c);                   // loại bg magenta
      sheet.image  = c;
      sheet.frameW = img.width  / sheet.cols;
      sheet.frameH = img.height / sheet.rows;
      sheet.ready  = true;
      AssetLoader.done(true);
    };
    img.onerror = () => {
      console.warn("Không tải được boss sheet:", sheet.src,
                   "- boss sẽ vẽ bằng shapes thủ công");
      AssetLoader.done(false);
    };
    img.src = sheet.src;
  }
}
loadBossSheets();

// Vẽ 1 frame của boss. Tự tính displayW/H giữ aspect source frame, render
// lớn hơn collision box, "feet" đáy aligned với đáy collision.
//   bossKind: "monkey_king" | "giant_scorpion" | ...
//   state:    "idle" | "walk" | "charge" | "attack"
//   b:        Enemy instance (cần x, y, w, h, facing)
// Trả về false nếu sheet chưa sẵn sàng - caller fallback sang draw shapes.
function drawBossSpriteFrame(bossKind, state, animTime, b, camX, camY) {
  const sheet = BOSS_SHEETS[bossKind];
  if (!sheet || !sheet.ready) return false;
  const cfg = sheet.states[state];
  if (!cfg) return false;

  // Render lớn hơn collision box 1.6x theo chiều cao, giữ aspect source
  const aspectRatio = sheet.frameW / sheet.frameH;
  const displayH = b.h * 1.6;
  const displayW = displayH * aspectRatio;
  const dx = (b.x + b.w/2) - displayW/2 - camX;
  const dy = (b.y + b.h)   - displayH    - camY;

  const idx = Math.floor(animTime / cfg.rate) % cfg.frames;
  const sx = idx     * sheet.frameW;
  const sy = cfg.row * sheet.frameH;
  const flip = b.facing === -1;

  if (flip) {
    ctx.save();
    ctx.translate(dx + displayW, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet.image, sx, sy, sheet.frameW, sheet.frameH,
                  0, 0, displayW, displayH);
    ctx.restore();
  } else {
    ctx.drawImage(sheet.image, sx, sy, sheet.frameW, sheet.frameH,
                  dx, dy, displayW, displayH);
  }
  return true;
}
