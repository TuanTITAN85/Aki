"use strict";
// =============================================================================
// COMPANION DOG - Chú Cún Golden Retriever đồng hành cùng Hải tặc
// Bất tử, cắn lính/thú trong phạm vi ~300px, quanh quẩn khi không có địch
//
// Phụ thuộc (truy cập runtime):
//   GRAVITY, player (index.html)
//   render.js: rectsHit, clamp, spawnParticles, drawPixelSprite, drawText
//   audio.js : sfxCoin
//
// Export:
//   class CompanionDog
// =============================================================================

// Sprite Golden Retriever — grid 14×10, scale 3 (42×30 px)
// Palette: F=golden, D=dark-golden, S=snout, N=nose/eyes, X=black, W=white

const DOG_PALETTE = {
  F: "#d4a050",  // golden fur
  D: "#a07030",  // dark golden shadow
  S: "#ffd6a8",  // snout / belly
  N: "#1a1a1a",  // nose / eyes
  X: "#000000",  // outline / claws
  W: "#ffffff"   // white highlight / teeth
};

// Idle frame 1 — đuôi hạ xuống
const DOG_IDLE_1 = [
  "..FFFFFFFFFF..",
  ".FFDDDDDDDDF..",
  "FDDDSSSSSDDDF.",
  "FDSSNNNDDNSNDF",
  "FSDDDDDDDDDDDF",
  "FFDDDDDDDDDFF.",
  ".FDFSSSSSDF...",
  "..FDDDDDDDFF..",
  "..XXFDDDFFXX..",
  "....XX..XX...."
];

// Idle frame 2 — đuôi hơi nhấc lên
const DOG_IDLE_2 = [
  "..FFFFFFFFFF..",
  ".FFDDDDDDDDF..",
  "FDDDSSSSSDDDF.",
  "FDSSNNNDDNSNDF",
  "FSDDDDDDDDDDDF",
  "FFDDDDDDDDDFF.",
  ".FDFSSSSSDF...",
  "..FDDDDDDDFF..",
  "..XXFDDDFFXX..",
  "...XXX..XXX..."
];

// Walk frame 1 — chân trước phải nhấc, chân sau trái
const DOG_WALK_1 = [
  "..FFFFFFFFFF..",
  ".FFDDDDDDDDF..",
  "FDDDSSSSSDDDF.",
  "FDSSNNNDDNSNDF",
  "FSDDDDDDDDDDDF",
  "FFDDDDDDDDDFF.",
  ".FDFSSSSSDF...",
  "..FDDDDDDDFF..",
  ".XXFD....FDXX.",
  "..X........X.."
];

// Walk frame 2 — chân trước trái nhấc, chân sau phải
const DOG_WALK_2 = [
  "..FFFFFFFFFF..",
  ".FFDDDDDDDDF..",
  "FDDDSSSSSDDDF.",
  "FDSSNNNDDNSNDF",
  "FSDDDDDDDDDDDF",
  "FFDDDDDDDDDFF.",
  ".FDFSSSSSDF...",
  "..FDDDDDDDFF..",
  ".XXF....F.DXX.",
  "....X..X....X."
];

// Attack frame — miệng mở rộng, 2 chân trước vồ
const DOG_ATTACK_1 = [
  "..FFFFFFFFFF..",
  ".FFDDDDDDDDF..",
  "FDDDSSSSSNNN..",
  "FDSSNND.DDDNW.",
  "FSDDDDD.DDDWFW",
  "FFDDDDDDDDDFF.",
  ".FDFSSSSSDF...",
  "..FDDDDDDDFF..",
  ".XXFD....FDXX.",
  "..X........X.."
];

// Attack frame 2 — miệng đóng lại sau cắn
const DOG_ATTACK_2 = [
  "..FFFFFFFFFF..",
  ".FFDDDDDDDDF..",
  "FDDDSSSSSDDDF.",
  "FDSSNNNDDNSNDF",
  "FSDDDDDDDDDDDF",
  "FFDDDDDDDDDFF.",
  ".FDFSSSSSDF...",
  "..FDDDDDDDFF..",
  ".XXFD....FDXX.",
  "..X........X.."
];

// CompanionDog — chú Cún đồng hành
class CompanionDog {
  constructor(x, y, name) {
    this.name = name || "Buddy";
    this.x = x;
    this.y = y;
    this.w = 36;
    this.h = 30;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;          // 1=phải, -1=trái
    this.state = "idle";      // "idle" | "walk" | "attack"
    this.animTime = 0;
    this.attackCD = 0;        // cooldown giữa 2 lần cắn
    this.attackTimer = 0;     // thời gian animation cắn đang chạy
    this.targetEnemy = null;
    this.alive = true;

    // Thông số
    this.DOG_RANGE = 300;     // bán kính phát hiện enemy (pixel)
    this.DOG_BITE_DIST = 44;  // khoảng cách để cắn được enemy
    this.DOG_DAMAGE = 20;     // sát thương mỗi lần cắn
    this.DOG_SPEED = 3.2;     // tốc độ chạy tới enemy
  }

  // Tìm enemy gần nhất trong tầm
  _findNearestEnemy(level) {
    let nearest = null;
    let minDist = this.DOG_RANGE;
    for (const e of level.enemies) {
      if (!e.alive) continue;
      const dx = (e.x + e.w/2) - (this.x + this.w/2);
      const dy = (e.y + e.h/2) - (this.y + this.h/2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  // Va chạm platform — di chuyển trước trục X rồi Y
  _collide(level, axis) {
    for (const p of level.platforms) {
      if (rectsHit(this, p)) {
        if (axis === "x") {
          if (this.vx > 0) this.x = p.x - this.w;
          else if (this.vx < 0) this.x = p.x + p.w;
          this.vx = 0;
        } else {
          if (this.vy > 0) { this.y = p.y - this.h; this.onGround = true; }
          else if (this.vy < 0) this.y = p.y + p.h;
          this.vy = 0;
        }
      }
    }
  }

  update(level, player) {
    this.animTime++;
    if (this.attackCD > 0) this.attackCD--;
    if (this.attackTimer > 0) this.attackTimer--;

    // Tìm enemy gần nhất
    const target = this._findNearestEnemy(level);
    this.targetEnemy = target;

    if (target) {
      // Có địch trong tầm → đuổi theo và cắn
      const dx = (target.x + target.w/2) - (this.x + this.w/2);
      const dy = (target.y + target.h/2) - (this.y + this.h/2);
      const dist = Math.sqrt(dx*dx + dy*dy);

      this.facing = dx >= 0 ? 1 : -1;

      if (dist > this.DOG_BITE_DIST) {
        // Chưa đến khoảng cách cắn → di chuyển tới
        this.vx = (dx / dist) * this.DOG_SPEED;
        this.state = "walk";
      } else {
        // Đến nơi → cắn!
        this.vx = 0;
        this.state = "attack";
        if (this.attackCD <= 0) {
          target.takeDamage(this.DOG_DAMAGE);
          this.attackCD = 35;
          this.attackTimer = 18;
          // Hiệu ứng cắn
          spawnParticles(target.x + target.w/2, target.y + target.h/2, {
            count: 8, color: "#ffd700", speed: 3, size: 2, life: 15, shape: "star"
          });
          sfxCoin();
        }
      }
    } else {
      // Không có địch → theo sát bên cạnh player
      this.vx = 0;
      this.state = "idle";

      // Offset bên cạnh player theo hướng player đang nhìn
      const targetX = player.x + player.w/2 + player.facing * 55 - this.w/2;
      const targetY = player.y + player.h - this.h;
      const dx = targetX - this.x;
      const dy = targetY - this.y;

      // Lerp nhẹ về vị trí mục tiêu
      this.x += dx * 0.12;
      this.y += dy * 0.12;
      this.facing = player.facing;
    }

    // Áp dụng vật lý
    if (this.state !== "idle") {
      this.vy += GRAVITY;
      if (this.vy > 15) this.vy = 15;

      // Di chuyển X
      this.x += this.vx;
      this.onGround = false;
      this._collide(level, "x");

      // Di chuyển Y
      this.y += this.vy;
      this._collide(level, "y");
      if (this.onGround) this.vy = 0;
    }
  }

  draw(camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Ưu tiên sprite sheet PNG nếu đã tải xong
    let drawn = false;
    let nameY = sy - 10;     // mặc định cho fallback
    if (typeof DOG_SHEET !== "undefined" && DOG_SHEET.ready) {
      const dispH = this.h * 2.5;
      const dispW = dispH * (DOG_SHEET.frameW / DOG_SHEET.frameH);
      const dx = sx + this.w/2 - dispW/2;
      // Source frame có whitespace ở dưới -> push display dy xuống ~+20px
      // để chân nhân vật chạm sát đáy collision (ground level)
      const dy = sy + this.h - dispH + 20;
      // Map state -> sprite row: walk + đang đuổi enemy => "run"
      let animState = this.state;
      if (this.state === "walk" && this.targetEnemy) animState = "run";
      drawn = drawDogSpriteFrame(animState, this.animTime,
                                 dx, dy, dispW, dispH, this.facing < 0);
      // Tên hiển thị TRÊN ĐỈNH SPRITE (không đè mặt Cún như trước)
      // dy là top của display, character bên trong frame có whitespace ~20-25px
      // nên thực tế đỉnh đầu ở khoảng dy + 25; đặt name cách trên thêm 14px
      nameY = dy + 16;
    }

    if (!drawn) {
      // Fallback pixel matrix cũ nếu sprite chưa tải
      const t = this.animTime;
      let grid;
      if (this.state === "attack") {
        grid = (this.attackTimer > 9) ? DOG_ATTACK_1 : DOG_ATTACK_2;
      } else if (this.state === "walk") {
        grid = (Math.floor(t / 8) % 2 === 0) ? DOG_WALK_1 : DOG_WALK_2;
      } else {
        grid = (Math.floor(t / 18) % 2 === 0) ? DOG_IDLE_1 : DOG_IDLE_2;
      }
      drawPixelSprite(grid, DOG_PALETTE, sx, sy, 3, this.facing < 0);
    }

    // Vẽ tên phía trên đầu Cún (vị trí được tính theo sprite render hoặc fallback)
    drawText(this.name, sx + this.w/2, nameY, 12, "#ffd700", "#000", "center");
  }
}
