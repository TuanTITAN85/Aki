"use strict";
// =============================================================================
// PLAYER - lớp nhân vật chính (hải tặc)
//
// Phụ thuộc (truy cập runtime):
//   Constants từ index.html: GRAVITY, MOVE_SPEED, JUMP_POWER, FRICTION, AIR_DRAG
//   render.js: clamp, rectsHit, spawnParticles, drawPixelSprite,
//              PIRATE_PALETTE, PIRATE_IDLE_1/2, PIRATE_RUN_1/2, PIRATE_JUMP
//   audio.js : sfxJump, sfxHurt, sfxSplash
//
// Export ra biến toàn cục: class Player
//
// State quan trọng:
//   power     — id sức mạnh hiện tại (key trong POWERS)
//   inventory — list các sức mạnh đã sở hữu, đổi qua lại bằng phím 1-6 hoặc Q
//   swordTier — 0..3, hệ số sát thương = [1.0, 1.2, 1.5, 2.0]
//   invul     — frame còn lại của trạng thái bất tử sau khi bị đánh
// =============================================================================

class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 36; this.h = 48;        // kích thước hộp va chạm
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.facing = 1;                 // 1 = nhìn phải, -1 = nhìn trái
    this.animTime = 0;
    this.state = "idle";             // idle | run | jump
    this.maxHp = 100; this.hp = 100;
    this.lives = 3;
    this.score = 0;
    this.gold = 0;
    this.invul = 0;                  // bất tử tạm thời sau khi bị đánh
    this.attackCooldown = 0;
    this.dead = false;
    this.power = "default";          // sức mạnh đang dùng
    this.inventory = ["default"];    // danh sách sức mạnh đã sở hữu
    this.swordTier = 0;              // cấp kiếm: 0=chưa có, 1=Đồng, 2=Bạc, 3=Vàng
    this.name = "Hải Tặc";           // tên người chơi (nhập ở màn hình đầu)
  }

  // Hệ số sát thương theo cấp kiếm
  swordMultiplier() {
    return [1.0, 1.2, 1.5, 2.0][this.swordTier] || 1.0;
  }

  // Thêm trái ác quỷ vào kho. Nếu chưa có thì thêm và chuyển sang dùng luôn
  acquireFruit(fruit) {
    if (!this.inventory.includes(fruit)) {
      this.inventory.push(fruit);
    }
    this.power = fruit;
  }

  update(input, level) {
    if (this.dead) return;

    // Di chuyển trái phải
    if (input.left)  { this.vx -= 0.7; this.facing = -1; }
    if (input.right) { this.vx += 0.7; this.facing =  1; }
    this.vx = clamp(this.vx, -MOVE_SPEED, MOVE_SPEED);

    // Nhảy bằng phím cách hoặc mũi tên lên
    if ((input.jump || input.up) && this.onGround) {
      this.vy = -JUMP_POWER;
      this.onGround = false;
      sfxJump();
      // hiệu ứng bụi khi nhảy
      spawnParticles(this.x + this.w/2, this.y + this.h, {
        count: 10, color: "#fff7d6", speed: 3, size: 3, life: 25, upward: 1, gravity: 0.1
      });
    }

    // Trọng lực
    this.vy += GRAVITY;
    if (this.vy > 18) this.vy = 18;

    // Áp dụng vận tốc + xử lý va chạm với nền
    this.x += this.vx;
    this._collide(level, "x");
    this.onGround = false;            // sẽ được bật lại nếu chạm đỉnh platform
    this.y += this.vy;
    this._collide(level, "y");

    // Ma sát
    if (this.onGround) this.vx *= FRICTION;
    else this.vx *= AIR_DRAG;
    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    // Cập nhật trạng thái animation
    if (!this.onGround) this.state = "jump";
    else if (Math.abs(this.vx) > 0.5) this.state = "run";
    else this.state = "idle";
    this.animTime += 1;

    if (this.invul > 0) this.invul--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    // Rơi xuống biển = mất 1 mạng ngay (không nương tay)
    if (this.y > level.deathY) {
      this.fallIntoSea(level);
    }
  }

  // Mất 1 mạng do rơi xuống biển
  fallIntoSea(level) {
    sfxSplash();
    spawnParticles(this.x + this.w/2, level.deathY - 20, {
      count: 30, color: "#9be0ff", speed: 6, size: 4, life: 40, gravity: 0.25
    });
    this.lives--;
    if (this.lives <= 0) {
      this.dead = true;
      this.hp = 0;
      return;
    }
    this.hp = this.maxHp;
    this.respawn(level);
  }

  _collide(level, axis) {
    for (const p of level.platforms) {
      if (rectsHit(this, p)) {
        if (axis === "x") {
          if (this.vx > 0) this.x = p.x - this.w;
          else if (this.vx < 0) this.x = p.x + p.w;
          this.vx = 0;
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

  respawn(level) {
    this.x = level.spawnX;
    this.y = level.spawnY;
    this.vx = 0; this.vy = 0;
    this.invul = 90;
  }

  takeDamage(dmg) {
    if (this.invul > 0 || this.dead) return;
    this.hp -= dmg;
    this.invul = 60;
    sfxHurt();
    spawnParticles(this.x + this.w/2, this.y + this.h/2, {
      count: 12, color: "#ff4040", speed: 4, size: 3, life: 30
    });
    if (this.hp <= 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.dead = true;
        this.hp = 0;
      } else {
        this.hp = this.maxHp;
      }
    }
  }

  draw(camX, camY) {
    // Nhấp nháy khi đang bất tử
    if (this.invul > 0 && Math.floor(this.invul / 4) % 2 === 0) return;

    const flip = (this.facing === -1);

    // Sprite hiển thị 64x96 (lớn hơn collision box 36x48 để chi tiết rõ),
    // căn giữa theo X và đáy theo Y - "feet" sprite chạm đáy collision box
    const displayW = 64, displayH = 96;
    const dx = this.x - camX - (displayW - this.w) / 2;
    const dy = this.y - camY - (displayH - this.h);

    // Ưu tiên sprite sheet PNG nếu đã tải xong (idle / run / jump đều có asset)
    if (drawPirateSpriteFrame(this.state, this.animTime,
                              dx, dy, displayW, displayH, flip)) {
      return;
    }

    // Fallback (sprite chưa tải xong / state lạ): pixel matrix cũ
    let grid;
    if (this.state === "jump") grid = PIRATE_JUMP;
    else if (this.state === "run") {
      grid = (Math.floor(this.animTime / 6) % 2 === 0) ? PIRATE_RUN_1 : PIRATE_RUN_2;
    } else {
      grid = (Math.floor(this.animTime / 30) % 2 === 0) ? PIRATE_IDLE_1 : PIRATE_IDLE_2;
    }
    drawPixelSprite(grid, PIRATE_PALETTE, this.x - camX, this.y - camY, 3, flip);
  }
}
