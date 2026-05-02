"use strict";
// =============================================================================
// ENEMY - lớp kẻ thù (lính canh / thú rừng / boss) + sprite tương ứng
//
// Phụ thuộc (truy cập runtime):
//   GRAVITY (index.html)
//   render.js: rectsHit, clamp, spawnParticles, drawPixelSprite
//   audio.js : sfxBossShoot
//   bosses.js: BOSS_KINDS (cho dispatch boss skill + draw)
//   index.html: MagicOrb (class), enemyOrbs (array)
//
// Export:
//   GUARD_PALETTE, GUARD_BODY_1, GUARD_BODY_2
//   makeBeastPalette(theme)
//   BEAST_BODY_1, BEAST_BODY_2
//   class Enemy
// =============================================================================

// Sprite lính canh - mặc đồng phục đen-đỏ
const GUARD_PALETTE = {
  K: "#1a1a1a", S: "#ffd6a8", R: "#a51212", W: "#fff",
  Y: "#f5c542", G: "#666", X: "#000"
};
const GUARD_BODY_1 = [
  "...KKKKKK...",
  "..KKKRRKKK..",
  "..KSSSSSSK..",
  "..SSKSKSSS..",
  "..SSSSSSSS..",
  "...SKKK SS..",
  "..RRRRRRRR..",
  "..RRYRYRRR..",
  ".KRRRRRRRRK.",
  ".KRRRRRRRRK.",
  "..KKKKKKKK..",
  "...KK..KK...",
  "...KK..KK...",
  "..KKK..KKK..",
  "..KKK..KKK..",
  "..KKK..KKK.."
];
const GUARD_BODY_2 = [
  "...KKKKKK...",
  "..KKKRRKKK..",
  "..KSSSSSSK..",
  "..SSKSKSSS..",
  "..SSSSSSSS..",
  "...SKKK SS..",
  "..RRRRRRRR..",
  "..RRYRYRRR..",
  ".KRRRRRRRRK.",
  "..KRRRRRRK..",
  "..KKKKKKKK..",
  "...KK..KK...",
  "..KK....KK..",
  "..KK....KK..",
  ".KK......KK.",
  ".KK......KK."
];

// Sprite thú rừng - dùng chung khung, đổi bảng màu để có rắn / hổ / heo / sói / khỉ
function makeBeastPalette(theme) {
  switch (theme) {
    case "tiger":  return { B: "#ff9b1c", D: "#7a3a00", W: "#fff", K: "#0a0a0a", P: "#ffd9b3" };
    case "snake":  return { B: "#3ec46a", D: "#1f7a3a", W: "#fff", K: "#0a0a0a", P: "#9ff0b8" };
    case "boar":   return { B: "#7a3a00", D: "#3a1a00", W: "#fff", K: "#0a0a0a", P: "#a86a40" };
    case "wolf":   return { B: "#7a8395", D: "#3a4252", W: "#fff", K: "#0a0a0a", P: "#cfd6e0" };
    case "bear":   return { B: "#5b3a1a", D: "#2a1a06", W: "#fff", K: "#0a0a0a", P: "#a47550" };
    case "monkey": return { B: "#a0691a", D: "#5a3a06", W: "#fff", K: "#0a0a0a", P: "#ffd6a8" };
    case "spider": return { B: "#3a2a5e", D: "#1a0e2a", W: "#fff", K: "#0a0a0a", P: "#a26bff" };
    case "yeti":   return { B: "#e6f0ff", D: "#a8c0e0", W: "#fff", K: "#0a0a0a", P: "#ffd6a8" };
  }
  return { B: "#888", D: "#444", W: "#fff", K: "#000", P: "#aaa" };
}
const BEAST_BODY_1 = [
  "..............",
  "..BBB....BB...",
  ".BPBBB..BBPB..",   // tai
  ".BBBBBBBBBBB..",
  ".BDBBKBBKBBD..",   // mắt
  ".BBBBBBBBBBB..",
  ".BBBPPPPPPBB..",   // mõm
  ".BDBBKKKKBBD..",
  ".BBBBBBBBBBB..",
  "..BBBBBBBBB...",
  "..BB.BB.BB....",
  "..BB.BB.BB....",
  "..KK.KK.KK....",
  "..............",
  "..............",
  ".............."
];
const BEAST_BODY_2 = [
  "..............",
  "..BBB....BB...",
  ".BPBBB..BBPB..",
  ".BBBBBBBBBBB..",
  ".BDBBKBBKBBD..",
  ".BBBBBBBBBBB..",
  ".BBBPPPPPPBB..",
  ".BDBBKKKKBBD..",
  ".BBBBBBBBBBB..",
  "..BBBBBBBBB...",
  "...BB.BB.BB...",
  "...BB.BB.BB...",
  "...KK.KK.KK...",
  "..............",
  "..............",
  ".............."
];

// Lớp cha cho mọi kẻ thù
class Enemy {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.w = opts.w || 36; this.h = opts.h || 48;
    this.vx = 0; this.vy = 0;
    this.hp = opts.hp || 30;
    this.maxHp = this.hp;
    this.dmg = opts.dmg || 10;
    this.kind = opts.kind || "guard";  // guard | beast | boss
    this.theme = opts.theme || null;
    this.facing = -1;
    this.animTime = 0;
    this.patrolL = x - 120;
    this.patrolR = x + 120;
    this.alive = true;
    this.onGround = false;
    this.hitFlash = 0;
    this.aggro = false;
    this.attackCD = 0;
    this.scoreReward = opts.scoreReward || 50;
    this.goldReward  = opts.goldReward  || 5;
    this.boss = !!opts.boss;
    this.bossName = opts.bossName || "";
    this.bossKind = opts.bossKind || null;     // mỗi đảo 1 loại boss khác nhau
    this.shootCD = 0;
    this.rewarded = false;            // đã được tính điểm/quest chưa
    // Boss 2 phase (chỉ áp dụng nếu opts.phaseTwo = true)
    this.hasTwoPhases = !!opts.phaseTwo;
    this.bossPhase = 1;               // 1 = phase đầu, 2 = phase rage
    this.bossPhase2Hp = Math.round((opts.hp || 100) * 0.6);  // HP phase 2 = 60%
    this.dmgPhase1 = opts.dmg || 10;
    this.dmgPhase2 = Math.round((opts.dmg || 10) * 1.5);     // dame phase 2 = +50%
    this.phaseRageTimer = 0;          // 60 frame hiện hào quang giận khi chuyển phase
  }

  // Kiểm tra có nền bên dưới điểm (x, y) không (dùng để khỏi đi rơi mép)
  _hasGroundBelow(level, x, y) {
    for (const p of level.platforms) {
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h + 6) return true;
    }
    return false;
  }

  update(level, player) {
    if (!this.alive) return;

    // Trong giai đoạn countdown: quái không di chuyển + không đánh + không bắn
    // (vẫn rơi theo trọng lực + va chạm để không lộn xộn vị trí)
    const inCountdown = (typeof countdownTimer !== "undefined") && countdownTimer > 0;

    const dx = (player.x + player.w/2) - (this.x + this.w/2);
    const dy = (player.y + player.h/2) - (this.y + this.h/2);
    const dist = Math.hypot(dx, dy);

    // Tìm thấy người chơi -> đuổi (chặn nếu đang countdown).
    // Range giảm 30%: enemy 460->322, boss 800->560
    if (!inCountdown && dist < (this.boss ? 560 : 322)) this.aggro = true;

    let speed = this.boss ? 3.4 : (this.kind === "beast" ? 3.6 : 2.6);

    if (this.aggro) {
      this.vx = Math.sign(dx) * speed;
      this.facing = Math.sign(dx) || this.facing;
      // Smart aggro: không tự rơi xuống hố nếu đứng trên đất
      // (boss vẫn lao như cũ - boss thường ở khu vực cuối, ít hố)
      if (!this.boss && this.onGround && this.vx !== 0) {
        const checkX = this.vx > 0 ? this.x + this.w + 4 : this.x - 4;
        const checkY = this.y + this.h + 4;
        if (!this._hasGroundBelow(level, checkX, checkY)) {
          // Mép cliff phía trước -> nhảy nếu player cao hơn, không thì dừng
          if (dy < -10 && Math.random() < 0.4) {
            this.vy = -13;        // nhảy mạnh hơn để vượt hố
          } else {
            this.vx = 0;          // đứng tại mép, không lao xuống
          }
        }
      }
      // Nhảy nếu thấy người chơi cao hơn (boss/quái nhảy thường xuyên hơn)
      const jumpChance = this.boss ? 0.08 : 0.07;
      if (this.onGround && dy < -20 && Math.random() < jumpChance) this.vy = -12;
      // Boss dùng kỹ năng riêng theo loại (skill range giảm 30%: 700 -> 490)
      // Boss cũng không bắn nếu offscreen
      if (this.boss) {
        this.shootCD--;
        const bossOnScreen = (typeof camera !== "undefined")
                           ? isOnScreen(this, camera.x, camera.y, 60)
                           : true;
        if (this.shootCD <= 0 && dist < 490 && bossOnScreen) {
          const bk = BOSS_KINDS[this.bossKind];
          if (bk && bk.skill) {
            bk.skill(this, player);
            this.shootCD = bk.cooldown || 60;
          } else {
            // dự phòng: 3 đạn quạt cũ
            const dxA = (player.x + player.w/2) - (this.x + this.w/2);
            const dyA = (player.y + player.h/2) - (this.y + this.h/2);
            const baseAng = Math.atan2(dyA, dxA);
            for (let k = -1; k <= 1; k++) {
              const a = baseAng + k * 0.22;
              enemyOrbs.push(new MagicOrb(
                this.x + this.w/2 - 9, this.y + this.h/2 - 9,
                Math.cos(a), Math.sin(a), "enemy",
                { color: "#ff5050", glow: "#ffb0b0", dmg: this.dmg, speed: 7.5, size: 18 }
              ));
            }
            this.shootCD = 55;
          }
          sfxBossShoot();
        }
      }
    } else {
      // Tuần tra
      this.vx = speed * 0.5 * this.facing;
      if (this.x < this.patrolL) this.facing = 1;
      if (this.x > this.patrolR) this.facing = -1;
      // Đứng trên đất mà tới mép thì quay đầu để khỏi đi rơi xuống biển
      if (this.onGround) {
        const checkX = this.facing > 0 ? this.x + this.w + 4 : this.x - 4;
        const checkY = this.y + this.h + 4;
        if (!this._hasGroundBelow(level, checkX, checkY)) {
          this.facing *= -1;
          this.vx = speed * 0.5 * this.facing;
        }
      }
    }

    // Trọng lực
    this.vy += GRAVITY;
    if (this.vy > 18) this.vy = 18;

    // Va chạm
    this.x += this.vx;
    this._collide(level, "x");
    this.onGround = false;
    this.y += this.vy;
    this._collide(level, "y");

    // Offscreen check: enemy không gây damage nếu đã ra khỏi screen
    // (player không thể "ăn dame oan" khi không thấy quái)
    const onScreen = (typeof camera !== "undefined")
                   ? isOnScreen(this, camera.x, camera.y, 40)
                   : true;

    // Đánh người chơi nếu chạm (chặn nếu đang countdown / offscreen)
    if (!inCountdown && onScreen && rectsHit(this, player) && this.attackCD <= 0) {
      player.takeDamage(this.dmg);
      this.attackCD = 40;
      player.vx = Math.sign(dx || 1) * 6;
      player.vy = -7;
    }

    // Đánh đồng hành (Cún + Vịt) nếu chạm - dame nhẹ hơn so với đánh player
    if (!inCountdown && onScreen && this.attackCD <= 0) {
      if (typeof companionDog !== "undefined" && companionDog && companionDog.alive
          && rectsHit(this, companionDog)) {
        companionDog.takeDamage(Math.floor(this.dmg * 0.5));
        this.attackCD = 40;
      } else if (typeof companionDuck !== "undefined" && companionDuck && companionDuck.alive
                 && rectsHit(this, companionDuck)) {
        // Vịt là TANK, ăn dame thấp hơn nữa
        companionDuck.takeDamage(Math.floor(this.dmg * 0.35));
        this.attackCD = 40;
      }
    }
    if (this.attackCD > 0) this.attackCD--;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.phaseRageTimer > 0) this.phaseRageTimer--;   // animation hào quang giận
    this.animTime++;

    // Rơi xuống biển = chết luôn (để nhiệm vụ vẫn hoàn thành được)
    if (this.alive && this.y > level.deathY) {
      this.alive = false;
      spawnParticles(this.x + this.w/2, level.deathY - 20, {
        count: 18, color: "#9be0ff", speed: 5, size: 4, life: 30
      });
    }
  }

  _collide(level, axis) {
    for (const p of level.platforms) {
      if (rectsHit(this, p)) {
        if (axis === "x") {
          if (this.vx > 0) this.x = p.x - this.w;
          else if (this.vx < 0) this.x = p.x + p.w;
          this.vx = 0;
          this.facing *= -1;
        } else {
          if (this.vy > 0) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.onGround = true;
          } else if (this.vy < 0) {
            this.y = p.y + p.h;
            this.vy = 0;
          }
        }
      }
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.hitFlash = 5;        // duration ngắn lại (8 -> 5) để bớt chói
    spawnParticles(this.x + this.w/2, this.y + this.h/2, {
      count: 14, color: "#ffea60", speed: 4, size: 3, life: 28
    });
    if (this.hp <= 0) {
      // Boss với 2 phase: chuyển sang phase 2 thay vì chết
      if (this.boss && this.hasTwoPhases && this.bossPhase === 1) {
        this.bossPhase = 2;
        this.hp = this.bossPhase2Hp;
        this.maxHp = this.bossPhase2Hp;       // reset maxHp -> bar đầy lại
        this.dmg = this.dmgPhase2;
        this.phaseRageTimer = 60;             // 1s rage animation
        // Hiệu ứng "tỏa giận" - particles tím + đỏ
        spawnParticles(this.x + this.w/2, this.y + this.h/2, {
          count: 40, color: "#a26bff", speed: 6, size: 4, life: 50
        });
        spawnParticles(this.x + this.w/2, this.y + this.h/2, {
          count: 30, color: "#ff5a5a", speed: 5, size: 4, life: 45
        });
        if (typeof sfxBossShoot === "function") sfxBossShoot();
        return;            // không chết, không spawn death particle
      }
      this.alive = false;
      spawnParticles(this.x + this.w/2, this.y + this.h/2, {
        count: 28, color: "#ff7a3c", speed: 6, size: 4, life: 40
      });
    }
  }

  draw(camX, camY) {
    if (!this.alive) return;
    const flash = this.hitFlash > 0;
    if (flash) {
      ctx.globalAlpha = 0.35;     // bớt chói (0.7 -> 0.35) khi bị bắn trúng
      ctx.fillStyle = "#fff";
      ctx.fillRect(this.x - camX - 2, this.y - camY - 2, this.w + 4, this.h + 4);
      ctx.globalAlpha = 1;
    }

    if (this.kind === "guard") {
      // Ưu tiên sprite sheet PNG nếu đã tải xong
      const flip = this.facing === -1;
      const displayW = 48, displayH = 72;     // lớn hơn collision box 36x48 cho rõ chi tiết
      const dx = this.x - camX - (displayW - this.w) / 2;
      const dy = this.y - camY - (displayH - this.h);
      // Chọn animation state từ trạng thái enemy:
      //   attackCD vừa reset (mới đánh xong) -> attack swing
      //   aggro -> chase với kiếm giơ cao
      //   moving + !aggro -> walk patrol
      //   stationary -> idle
      let animState;
      if (this.attackCD > 30) animState = "attack";       // ngay sau khi đánh
      else if (this.aggro)    animState = "aggro";
      else if (Math.abs(this.vx) > 0.3) animState = "walk";
      else                    animState = "idle";
      if (drawGuardSpriteFrame(animState, this.animTime,
                               dx, dy, displayW, displayH, flip)) {
        // OK, vẽ xong
      } else {
        // Fallback pixel matrix cũ khi sprite chưa sẵn sàng
        const grid = (Math.floor(this.animTime / 8) % 2 === 0) ? GUARD_BODY_1 : GUARD_BODY_2;
        drawPixelSprite(grid, GUARD_PALETTE, this.x - camX, this.y - camY, 3, flip);
      }
    } else if (this.kind === "beast") {
      const grid = (Math.floor(this.animTime / 8) % 2 === 0) ? BEAST_BODY_1 : BEAST_BODY_2;
      const pal = makeBeastPalette(this.theme);
      const flip = this.facing === -1;
      const px = (this.theme === "yeti" || this.boss) ? 4 : 3;
      drawPixelSprite(grid, pal, this.x - camX, this.y - camY, px, flip);
    } else if (this.kind === "boss") {
      // Boss phase 2: vẽ aura giận (đỏ-tím nở thở) phía sau sprite
      if (this.bossPhase === 2) {
        const cx = this.x - camX + this.w/2;
        const cy = this.y - camY + this.h/2;
        const pulse = 0.4 + 0.2 * Math.sin(this.animTime * 0.15);
        // Burst hào quang khi mới chuyển phase
        const rage = this.phaseRageTimer > 0
                   ? 1 + (this.phaseRageTimer / 60) * 1.2
                   : 1;
        const r1 = (Math.max(this.w, this.h) * 0.9) * rage;
        const r2 = r1 * 1.4;
        ctx.globalAlpha = 0.35 * pulse;
        ctx.fillStyle = "#ff3838";
        ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.5 * pulse;
        ctx.fillStyle = "#a26bff";
        ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      const bk = BOSS_KINDS[this.bossKind];
      if (bk && bk.draw) {
        bk.draw(this, camX, camY);
      } else {
        const grid = (Math.floor(this.animTime / 8) % 2 === 0) ? GUARD_BODY_1 : GUARD_BODY_2;
        const pal = { ...GUARD_PALETTE, R: "#7a1a1a", K: "#0a0a0a", Y: "#ffd24a" };
        drawPixelSprite(grid, pal, this.x - camX, this.y - camY, 5, this.facing === -1);
      }
    }

    // Thanh máu (boss có thanh máu lớn riêng vẽ ở UI)
    if (!this.boss) {
      const ratio = clamp(this.hp / this.maxHp, 0, 1);
      ctx.fillStyle = "#000";
      ctx.fillRect(this.x - camX, this.y - camY - 8, this.w, 4);
      ctx.fillStyle = "#ff4040";
      ctx.fillRect(this.x - camX, this.y - camY - 8, this.w * ratio, 4);
    }
  }
}
