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

// CompanionDog — chú Cún đồng hành (DPS - dame cao, HP thấp)
class CompanionDog {
  constructor(x, y, name) {
    this.name = name || "Buddy";
    this.kind = "dog";        // dùng để phân biệt với Vịt + skill key
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

    // HP system
    this.maxHp = 50;
    this.hp = 50;
    this.alive = true;
    this.respawnTimer = 0;    // khi chết: đếm ngược 30s (1800 frame @ 60fps)
    this.invul = 0;           // invul ngắn sau khi bị đánh

    // Upgrade level (nâng cấp ở shop)
    this.level = 1;

    // Thông số chiến đấu
    this.DOG_RANGE = 300;
    this.DOG_BITE_DIST = 44;
    this.DOG_DAMAGE = 20;
    this.DOG_SPEED = 3.2;
  }

  // Cún bị đánh - giảm hp, particles, invul ngắn
  takeDamage(dmg) {
    if (this.invul > 0 || !this.alive) return;
    this.hp -= dmg;
    this.invul = 24;
    spawnParticles(this.x + this.w/2, this.y + this.h/2, {
      count: 8, color: "#ff4040", speed: 3, size: 2, life: 20
    });
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.respawnTimer = 1800;     // 30s respawn
      // hiệu ứng chết - particles vàng + xám
      spawnParticles(this.x + this.w/2, this.y + this.h/2, {
        count: 18, color: "#bbbbbb", speed: 4, size: 3, life: 40
      });
    }
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
    if (this.invul > 0) this.invul--;

    // Khi chết: đếm ngược 30s rồi respawn tại player
    if (!this.alive) {
      this.respawnTimer--;
      if (this.respawnTimer <= 0) {
        this.alive = true;
        this.hp = this.maxHp;
        this.x = player.x;
        this.y = player.y - 30;
        this.vx = 0; this.vy = 0;
        this.invul = 60;
        spawnParticles(this.x + this.w/2, this.y + this.h/2, {
          count: 14, color: "#ffd700", speed: 3, size: 3, life: 30, shape: "star"
        });
      }
      return;       // không cập nhật AI khi đang chết
    }

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

    // Khi chết: hiện ghost icon nhỏ + countdown text
    if (!this.alive) {
      const sec = Math.ceil(this.respawnTimer / 60);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#dde6f0";
      ctx.beginPath();
      ctx.arc(sx + this.w/2, sy + this.h/2, 14, Math.PI, 0);
      ctx.fillRect(sx + this.w/2 - 14, sy + this.h/2, 28, 12);
      // 2 chấm mắt đen
      ctx.fillStyle = "#000";
      ctx.fillRect(sx + this.w/2 - 6, sy + this.h/2 - 4, 3, 3);
      ctx.fillRect(sx + this.w/2 + 3, sy + this.h/2 - 4, 3, 3);
      ctx.globalAlpha = 1;
      drawText(this.name, sx + this.w/2, sy - 18, 11, "#aaa", "#000", "center");
      drawText("Hồi sinh " + sec + "s", sx + this.w/2, sy - 6, 12, "#7afc6e", "#000", "center");
      return;
    }

    // Nhấp nháy khi đang invul (vừa bị đánh)
    if (this.invul > 0 && Math.floor(this.invul / 4) % 2 === 0) return;

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

// =============================================================================
// CompanionDuck - Vịt Vàng đồng hành (TANK - HP cao, dame thấp, chậm)
// Cùng pattern với CompanionDog, khác stats và sprite (pixel art tạm tới khi
// có asset PNG riêng)
// =============================================================================
const DUCK_PALETTE = {
  Y: "#ffd24a",   // lông vàng
  D: "#a87a14",   // shadow vàng
  O: "#ff8a3c",   // mỏ + chân cam
  W: "#ffffff",   // mắt sáng
  K: "#1a1a1a",   // viền + mắt đen
  R: "#d33b3b"    // chấm má hồng
};
const DUCK_IDLE_1 = [
  ".....KKKKK....",
  "....KYYYYYK...",
  "...KYYYYYYYK..",
  "...KYWKYWKYK..",
  "...KYYYYYYYK..",
  "...OOKYYYYK...",
  "....KYYYYYK...",
  "...KYYYYYYYK..",
  "...KYYYYYYYK..",
  "....KKOOKK....",
  "....OOOOOO....",
  "..............",
  "..............",
  ".............."
];
const DUCK_IDLE_2 = [
  ".....KKKKK....",
  "....KYYYYYK...",
  "...KYYYYYYYK..",
  "...KYWKYWKYK..",
  "...KYYYYYYYK..",
  "...OOKYYYYK...",
  "....KYYYYYK...",
  "..KYYYYYYYYK..",
  "...KYYYYYYK...",
  "....KKOOKK....",
  "...OOOOOOOO...",
  "..............",
  "..............",
  ".............."
];
const DUCK_WALK_1 = DUCK_IDLE_1;
const DUCK_WALK_2 = DUCK_IDLE_2;
const DUCK_ATTACK_1 = DUCK_IDLE_1;
const DUCK_ATTACK_2 = DUCK_IDLE_2;

class CompanionDuck {
  constructor(x, y, name) {
    this.name = name || "Donald";
    this.kind = "duck";
    this.x = x;
    this.y = y;
    this.w = 36;
    this.h = 30;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.state = "idle";
    this.animTime = 0;
    this.attackCD = 0;
    this.attackTimer = 0;
    this.targetEnemy = null;

    // HP system - TANK: HP cao gấp đôi Cún
    this.maxHp = 100;
    this.hp = 100;
    this.alive = true;
    this.respawnTimer = 0;
    this.invul = 0;
    this.level = 1;

    // Thông số TANK - chậm hơn Cún, tầm gần hơn, ít dame hơn
    this.DOG_RANGE = 250;      // tầm gần hơn (vs Cún 300)
    this.DOG_BITE_DIST = 44;
    this.DOG_DAMAGE = 10;      // dame thấp hơn (vs Cún 20)
    this.DOG_SPEED = 2.5;      // chậm hơn (vs Cún 3.2)
  }

  // Reuse logic từ Dog (gắn các method qua prototype)
  takeDamage(dmg)             { return CompanionDog.prototype.takeDamage.call(this, dmg); }
  _findNearestEnemy(level)    { return CompanionDog.prototype._findNearestEnemy.call(this, level); }
  _collide(level, axis)       { return CompanionDog.prototype._collide.call(this, level, axis); }
  update(level, player)       { return CompanionDog.prototype.update.call(this, level, player); }

  draw(camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Khi chết: ghost icon vàng
    if (!this.alive) {
      const sec = Math.ceil(this.respawnTimer / 60);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#fff5a0";
      ctx.beginPath();
      ctx.arc(sx + this.w/2, sy + this.h/2, 14, Math.PI, 0);
      ctx.fillRect(sx + this.w/2 - 14, sy + this.h/2, 28, 12);
      ctx.fillStyle = "#000";
      ctx.fillRect(sx + this.w/2 - 6, sy + this.h/2 - 4, 3, 3);
      ctx.fillRect(sx + this.w/2 + 3, sy + this.h/2 - 4, 3, 3);
      ctx.globalAlpha = 1;
      drawText(this.name, sx + this.w/2, sy - 18, 11, "#aaa", "#000", "center");
      drawText("Hồi sinh " + sec + "s", sx + this.w/2, sy - 6, 12, "#7afc6e", "#000", "center");
      return;
    }

    if (this.invul > 0 && Math.floor(this.invul / 4) % 2 === 0) return;

    // Ưu tiên sprite sheet PNG nếu đã tải xong (giống Cún)
    let drawn = false;
    let nameY = sy - 10;
    if (typeof DUCK_SHEET !== "undefined" && DUCK_SHEET.ready) {
      const dispH = this.h * 2.5;
      const dispW = dispH * (DUCK_SHEET.frameW / DUCK_SHEET.frameH);
      const dx = sx + this.w/2 - dispW/2;
      // Source frame có whitespace ở dưới -> push display dy xuống ~+20px
      const dy = sy + this.h - dispH + 20;
      let animState = this.state;
      if (this.state === "walk" && this.targetEnemy) animState = "run";
      drawn = drawDuckSpriteFrame(animState, this.animTime,
                                  dx, dy, dispW, dispH, this.facing < 0);
      nameY = dy + 16;
    }

    if (!drawn) {
      // Fallback pixel matrix tạm (khi PNG chưa tải)
      const t = this.animTime;
      let grid;
      if (this.state === "attack") {
        grid = (this.attackTimer > 9) ? DUCK_ATTACK_1 : DUCK_ATTACK_2;
      } else if (this.state === "walk") {
        grid = (Math.floor(t / 8) % 2 === 0) ? DUCK_WALK_1 : DUCK_WALK_2;
      } else {
        grid = (Math.floor(t / 22) % 2 === 0) ? DUCK_IDLE_1 : DUCK_IDLE_2;
      }
      drawPixelSprite(grid, DUCK_PALETTE, sx, sy, 3, this.facing < 0);
    }

    drawText(this.name, sx + this.w/2, nameY, 12, "#ffd700", "#000", "center");
  }
}
