"use strict";
// =============================================================================
// MAGIC ORB - đạn phép thuật, dùng cho cả người chơi và boss
//
// Constructor truyền VECTOR hướng (dirX, dirY) thay vì tọa độ đích.
// `cfg` chứa color, glow, dmg, speed, size, gravity. Nếu thiếu cfg thì:
//   - owner === "player" => dùng POWERS.default
//   - owner === "enemy"  => fallback đỏ generic
//
// Các trường hợp đặc biệt:
//   - Đạn parabol (chuối của Vua Khỉ): cfg.gravity > 0
//   - Pierce/spread/multi: skill function tự push nhiều orb với cfg khác nhau
//
// Phụ thuộc: ctx, spawnParticles (render.js), POWERS (index.html)
// =============================================================================

class MagicOrb {
  constructor(x, y, dirX, dirY, owner = "player", cfg = null) {
    this.x = x; this.y = y;
    this.cfg = cfg || (owner === "player" ? POWERS.default : {
      color: "#ff5050", glow: "#ffb0b0",
      dmg: 14, speed: 7, size: 16, cd: 0, name: "Boss"
    });
    this.size = this.cfg.size || 14;
    this.w = this.size; this.h = this.size;
    const d = Math.hypot(dirX, dirY) || 1;
    const sp = this.cfg.speed || 9;
    this.vx = (dirX / d) * sp;
    this.vy = (dirY / d) * sp;
    this.life = 80;
    this.owner = owner;
    this.dmg = this.cfg.dmg;
    this.gravity = this.cfg.gravity || 0;     // dùng cho đạn parabol (chuối, v.v.)
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
    // Vệt sáng phía sau
    spawnParticles(this.x + this.size/2, this.y + this.size/2, {
      count: 1, color: this.cfg.color, speed: 0.4, size: 3, life: 18, gravity: 0
    });
  }
  draw(camX, camY) {
    const cx = this.x - camX + this.size/2, cy = this.y - camY + this.size/2;
    // hào quang ngoài
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = this.cfg.glow;
    ctx.beginPath(); ctx.arc(cx, cy, this.size * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.cfg.color;
    ctx.beginPath(); ctx.arc(cx, cy, this.size * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, cy, this.size * 0.18, 0, Math.PI * 2); ctx.fill();
  }
}
