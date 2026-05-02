"use strict";
// =============================================================================
// VẬT PHẨM + NPC + THUYỀN
//   - class Item   — tiền vàng (coin) + trái ác quỷ (fruit), bồng bềnh, nhặt được
//   - class QuestNPC — người dân cho nhiệm vụ (chấm than vàng nổi trên đầu)
//   - class Boat   — thuyền cuối đảo, đứng vào để sang đảo mới
//
// Phụ thuộc:
//   render.js: rectsHit, choice, drawText, drawPixelSprite, spawnParticles
//   audio.js : sfxCoin, sfxFruit
//   index.html: POWERS, FRUIT_VI_NAMES (bảng sức mạnh), showNotice
//   ctx (canvas)
// =============================================================================

class Item {
  constructor(x, y, kind) {
    this.x = x; this.y = y; this.w = 24; this.h = 24;
    this.kind = kind;          // "coin" | "fruit"
    this.bob = Math.random() * Math.PI * 2;
    this.alive = true;
    if (kind === "fruit") {
      // chọn loại trái ngẫu nhiên
      this.fruit = choice(["dragon", "flame", "ice", "thunder", "wind"]);
      this.w = 28; this.h = 28;
    }
  }
  update(player) {
    if (!this.alive) return;
    this.bob += 0.08;
    if (rectsHit(this, player)) {
      this.alive = false;
      if (this.kind === "coin") {
        player.gold += 10;
        player.score += 20;
        sfxCoin();
        spawnParticles(this.x + this.w/2, this.y + this.h/2, {
          count: 18, color: "#ffe04a", speed: 4, size: 3, life: 30, shape: "star"
        });
      } else {
        // Ăn trái ác quỷ -> thêm vào kho (vẫn giữ tất cả trái cũ)
        const already = player.inventory.includes(this.fruit);
        player.acquireFruit(this.fruit);
        player.hp = Math.min(player.maxHp, player.hp + 25);
        player.score += 200;
        sfxFruit();
        const pcolor = (POWERS[this.fruit] && POWERS[this.fruit].color) || "#ff64d4";
        spawnParticles(this.x + this.w/2, this.y + this.h/2, {
          count: 36, color: pcolor, speed: 5, size: 4, life: 40, shape: "star"
        });
        spawnParticles(player.x + player.w/2, player.y + player.h/2, {
          count: 24, color: pcolor, speed: 4, size: 3, life: 30
        });
        const msg = already
          ? "Đã ăn lại " + (FRUIT_VI_NAMES[this.fruit] || this.fruit) + "!"
          : "Sức mạnh mới: " + (FRUIT_VI_NAMES[this.fruit] || this.fruit) +
            "! Bấm 1-6 để đổi qua lại.";
        showNotice(msg, 200);
      }
    }
  }
  draw(camX, camY) {
    if (!this.alive) return;
    const yOff = Math.sin(this.bob) * 4;
    const cx = this.x - camX, cy = this.y - camY + yOff;
    if (this.kind === "coin") {
      // Đồng xu vàng - ưu tiên sprite sheet xoay (4 frame), fallback circle
      // Animation tự xoay theo bob counter (đã có sẵn cho yOff)
      const dispW = 32, dispH = 32;
      const dispX = cx + this.w/2 - dispW/2;
      const dispY = cy + this.h/2 - dispH/2;
      // bob là rad, nhân lên để có animTime đủ nhanh
      const animTime = Math.floor(this.bob * 10);
      if (!drawCoinFrame(animTime, dispX, dispY, dispW, dispH)) {
        // Fallback: vòng tròn $ cũ
        ctx.fillStyle = "#fff5a0";
        ctx.beginPath(); ctx.arc(cx + 12, cy + 12, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f5c542";
        ctx.beginPath(); ctx.arc(cx + 12, cy + 12, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#a87a14";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("$", cx + 12, cy + 17);
      }
    } else {
      // Trái ác quỷ - dùng PNG asset (1024x1024 source, scale xuống 36x36)
      // căn giữa collision box 28x28, có hiệu ứng bồng bềnh từ yOff
      const dispW = 36, dispH = 36;
      const dispX = cx + this.w/2 - dispW/2;
      const dispY = cy + this.h/2 - dispH/2;
      if (!drawFruitImage(this.fruit, dispX, dispY, dispW, dispH)) {
        // Fallback: vẽ circles cũ nếu PNG chưa tải xong
        const colors = {
          dragon:  ["#ff4a4a", "#7a0a0a"],
          flame:   ["#ff8a3c", "#a51212"],
          ice:     ["#9ee0ff", "#1c5a8a"],
          thunder: ["#fff14a", "#a8881a"],
          wind:    ["#aaffd0", "#1a7a4a"]
        }[this.fruit];
        ctx.fillStyle = colors[1];
        ctx.beginPath(); ctx.arc(cx + 14, cy + 16, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colors[0];
        ctx.beginPath(); ctx.arc(cx + 14, cy + 16, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(cx + 8, cy + 10, 3, 3);
        ctx.fillStyle = "#3a8a2a";
        ctx.fillRect(cx + 12, cy + 2, 4, 6);
        ctx.fillStyle = "#5ec85a";
        ctx.fillRect(cx + 16, cy + 4, 6, 3);
      }
    }
  }
}

// =============================================================================
// NPC giao nhiệm vụ - đứng đầu đảo, có dấu chấm than vàng nổi trên đầu
// =============================================================================
class QuestNPC {
  constructor(x, y, island) {
    this.x = x; this.y = y; this.w = 36; this.h = 48;
    this.island = island;
    this.bob = 0;
  }
  update() { this.bob += 0.06; }
  inRange(player) {
    return Math.hypot(
      (this.x + this.w/2) - (player.x + player.w/2),
      (this.y + this.h/2) - (player.y + player.h/2)
    ) < 80;
  }
  draw(camX, camY) {
    const yOff = Math.sin(this.bob) * 2;
    const palette = {
      K: "#1a1a1a", S: "#ffd6a8", G: "#3a8a2a", B: "#1a5a8a",
      Y: "#f5c542", W: "#fff", R: "#d33b3b"
    };
    const grid = [
      "...YYYYYY...",
      "..YYYYYYYY..",
      "..YYYYYYYY..",
      "...SSSSSS...",
      "..SSKSKSSS..",
      "..SSSSSSSS..",
      "...SKKKSS...",
      "..GGGGGGGG..",
      "..GGGYGGGG..",
      "..GGGYGGGG..",
      "..GGGGGGGG..",
      "...BBBBBB...",
      "...BB..BB...",
      "...BB..BB...",
      "..KKK..KKK..",
      "..KKK..KKK.."
    ];
    drawPixelSprite(grid, palette, this.x - camX, this.y - camY + yOff, 3);

    // Dấu chấm than nổi trên đầu
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(this.x - camX + 18, this.y - camY - 14 + yOff, 10, 0, Math.PI * 2);
    ctx.fill();
    drawText("!", this.x - camX + 18, this.y - camY - 24 + yOff, 22, "#000", "#ffd700", "center");
  }
}

// =============================================================================
// Thuyền hải tặc - đứng vào để sang đảo tiếp theo (sau khi xong nhiệm vụ)
// =============================================================================
class Boat {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 80; this.h = 40;
    this.bob = 0;
  }
  update() { this.bob += 0.05; }
  inRange(player) { return rectsHit(this, player); }
  draw(camX, camY) {
    const yOff = Math.sin(this.bob) * 3;
    const cx = this.x - camX, cy = this.y - camY + yOff;
    // thân thuyền
    ctx.fillStyle = "#7a3a00";
    ctx.fillRect(cx, cy + 18, 80, 18);
    ctx.fillStyle = "#a8631a";
    ctx.fillRect(cx + 4, cy + 18, 72, 6);
    // cột buồm
    ctx.fillStyle = "#3a1a06";
    ctx.fillRect(cx + 36, cy - 30, 6, 50);
    // buồm
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx + 14, cy - 28, 22, 28);
    ctx.fillStyle = "#d33b3b";
    ctx.fillRect(cx + 14, cy - 28, 22, 4);
    // cờ hải tặc đầu lâu
    ctx.fillStyle = "#000";
    ctx.fillRect(cx + 42, cy - 30, 18, 12);
    drawText("☠", cx + 51, cy - 30, 12, "#fff", "#000", "center");
  }
}
