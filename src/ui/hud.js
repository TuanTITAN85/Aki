"use strict";
// =============================================================================
// HUD - thanh thông tin trên cùng phải, thanh sức mạnh trên giữa, boss bar,
// crosshair, hint dưới đáy. Tất cả phẳng (không viền), vạch nhấn 3-4px.
//
// Phụ thuộc:
//   ctx, W, H, player, level, quests, input, POWERS, POWER_ORDER (index.html)
//   render.js: drawText, clamp
// =============================================================================

function drawCrosshair() {
  const x = input.mouseX, y = input.mouseY;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 18, y); ctx.lineTo(x - 6, y);
  ctx.moveTo(x + 6, y);  ctx.lineTo(x + 18, y);
  ctx.moveTo(x, y - 18); ctx.lineTo(x, y - 6);
  ctx.moveTo(x, y + 6);  ctx.lineTo(x, y + 18);
  ctx.stroke();
}

// =============================================================================
// Thanh sức mạnh ở giữa trên cùng - 6 ô tương ứng phím 1..6
// Ô đang dùng tô vàng + gạch chân, ô đã sở hữu hiện icon, ô chưa có hiện "?"
// =============================================================================
function drawPowerBar() {
  const slots = POWER_ORDER;        // 6 mặt
  const sw = 70, sh = 64, pad = 6;
  const total = slots.length * sw + (slots.length - 1) * pad;
  const startX = (W - total) / 2;
  const y = 14;

  for (let i = 0; i < slots.length; i++) {
    const power  = slots[i];
    const cfg    = POWERS[power];
    const owned  = player.inventory.includes(power);
    const active = player.power === power;
    const x = startX + i * (sw + pad);

    // Slot phẳng: nền màu khác nhau theo trạng thái + vạch nhấn dưới đáy nếu active
    ctx.fillStyle = active ? "rgba(255, 210, 74, 0.18)"
                  : owned  ? "rgba(14, 22, 48, 0.78)"
                           : "rgba(14, 22, 48, 0.42)";
    ctx.fillRect(x, y, sw, sh);
    if (active) {
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(x, y + sh - 3, sw, 3);  // vạch vàng dưới đáy = đang dùng
    }

    drawText((i + 1) + "",
             x + sw/2, y + 4, 12,
             active ? "#ffd24a" : (owned ? "#dbe6f5" : "#5a6680"),
             "#000", "center");

    if (owned) {
      // Trái ác quỷ -> dùng PNG. "default" (Phép Cơ Bản) -> circle vì không có PNG
      const isFruit = power !== "default";
      let drawn = false;
      if (isFruit) {
        const iconSize = 36;
        drawn = drawFruitImage(power,
                               x + sw/2 - iconSize/2,
                               y + 30 - iconSize/2,
                               iconSize, iconSize);
      }
      if (!drawn) {
        // Default (hoặc fruit chưa tải): vẽ circle theo màu power
        ctx.fillStyle = cfg.glow;
        ctx.beginPath(); ctx.arc(x + sw/2, y + 30, 14, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = cfg.color;
        ctx.beginPath(); ctx.arc(x + sw/2, y + 30, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + sw/2 - 4, y + 26, 3, 3);
      }
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(x + sw/2 - 8, y + 22, 16, 16);
      drawText("?", x + sw/2, y + 22, 18, "#666", "#000", "center");
    }

    // tên nhỏ ở đáy ô (cắt gọn)
    let name = cfg.name;
    ctx.font = "bold 11px sans-serif";
    while (ctx.measureText(name).width > sw - 6 && name.length > 4) {
      name = name.slice(0, -1);
    }
    drawText(name, x + sw/2, y + sh - 14, 11,
             owned ? (active ? "#ffd24a" : "#fff") : "#666", "#000", "center");
  }

  // gợi ý phím nhỏ
  drawText("1-6 hoặc Q : đổi sức mạnh",
           W/2, y + sh + 4, 12, "#aef", "#000", "center");
}

// =============================================================================
// HUD chính - panel TRÁI (HP/mạng/điểm/vàng/sức mạnh/kiếm), panel PHẢI (nhiệm
// vụ), thẻ tên người chơi góc trên trái, boss bar giữa, hint dưới đáy phải
// =============================================================================
function drawHUD() {
  // Tên người chơi - thẻ nhỏ trên cùng góc trái (trên panel chính)
  ctx.fillStyle = "rgba(14, 22, 48, 0.80)";
  ctx.fillRect(20, 20, 220, 30);
  ctx.fillStyle = "#5dccff";
  ctx.fillRect(20, 20, 3, 30);
  drawText(player.name, 32, 28, 17, "#dbe6f5", "#000");

  // === PANEL CHÍNH (trái) - đảo, HP, mạng, điểm, vàng, sức mạnh, kiếm ===
  const panelX = 20, panelY = 60, panelW = 340, panelH = 350;
  ctx.fillStyle = "rgba(14, 22, 48, 0.82)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(panelX, panelY, panelW, 3);

  // Tên đảo - co chữ lại nếu quá dài
  let nameSize = 20;
  ctx.font = `bold ${nameSize}px sans-serif`;
  while (ctx.measureText(level.name).width > panelW - 24 && nameSize > 14) {
    nameSize--;
    ctx.font = `bold ${nameSize}px sans-serif`;
  }
  drawText(level.name, panelX + panelW/2, panelY + 12, nameSize, "#ffe18a", "#000", "center");

  // Máu - thanh không viền
  const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
  drawText("Máu", panelX + 14, panelY + 46, 14, "#a8b6cc");
  const barX = panelX + 60, barW = panelW - 76, barH = 16;
  ctx.fillStyle = "rgba(255, 90, 90, 0.18)";
  ctx.fillRect(barX, panelY + 46, barW, barH);
  ctx.fillStyle = "#ff5a5a";
  ctx.fillRect(barX, panelY + 46, barW * hpRatio, barH);
  drawText(`${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`,
           barX + barW/2, panelY + 47, 13, "#fff", "#000", "center");

  // Mạng (trái tim) - không có ô viền cho trái tim mất, dùng heart mờ thay
  drawText("Mạng", panelX + 14, panelY + 76, 14, "#a8b6cc");
  const livesShown = Math.max(3, player.lives);
  for (let i = 0; i < livesShown; i++) {
    const hx = panelX + 66 + i * 28, hy = panelY + 80;
    const filled = i < player.lives;
    ctx.fillStyle = filled ? "#ff5a76" : "rgba(255, 90, 118, 0.15)";
    ctx.beginPath();
    ctx.arc(hx + 4,  hy + 4, 6, 0, Math.PI * 2);
    ctx.arc(hx + 14, hy + 4, 6, 0, Math.PI * 2);
    ctx.moveTo(hx, hy + 6);
    ctx.lineTo(hx + 9, hy + 18);
    ctx.lineTo(hx + 18, hy + 6);
    ctx.fill();
  }

  // Điểm + Vàng
  drawText("Điểm: " + player.score, panelX + 14, panelY + 110, 17, "#ffd24a", "#000");
  drawText("Vàng: " + player.gold,  panelX + 14, panelY + 132, 17, "#fff5a0", "#000");

  // Sức mạnh hiện tại - icon PNG cho 5 trái, circle cho default
  const pcfg = POWERS[player.power] || POWERS.default;
  drawText("Sức mạnh:", panelX + 14, panelY + 156, 15, "#aef", "#000");
  const icx = panelX + 110, icy = panelY + 165;
  let drawnIcon = false;
  if (player.power !== "default") {
    drawnIcon = drawFruitImage(player.power, icx - 11, icy - 11, 22, 22);
  }
  if (!drawnIcon) {
    // Fallback: circle theo màu power
    ctx.fillStyle = pcfg.glow;
    ctx.beginPath(); ctx.arc(icx, icy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pcfg.color;
    ctx.beginPath(); ctx.arc(icx, icy, 6, 0, Math.PI * 2); ctx.fill();
  }
  drawText(pcfg.name, panelX + 124, panelY + 156, 15, pcfg.color, "#000");

  // Kiếm hiện tại
  const swordNames = ["(chưa có)", "Kiếm Đồng", "Kiếm Bạc", "Kiếm Vàng"];
  const swordCols  = ["#888",       "#cc7a1a",   "#dde0e6",  "#ffd24a"];
  drawText("Kiếm:", panelX + 14, panelY + 182, 15, "#aef", "#000");
  drawText(swordNames[player.swordTier] +
           (player.swordTier > 0 ? `  (×${player.swordMultiplier()})` : ""),
           panelX + 64, panelY + 182, 15, swordCols[player.swordTier], "#000");

  // === PANEL NHIỆM VỤ (phải) - tách riêng, kích thước nhỏ hơn ===
  const qpX = W - 300, qpY = 20, qpW = 280;
  const qpH = 40 + Math.max(1, quests.length) * 22 + 8;   // tự co theo số quest
  ctx.fillStyle = "rgba(14, 22, 48, 0.82)";
  ctx.fillRect(qpX, qpY, qpW, qpH);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(qpX, qpY, qpW, 3);
  drawText("NHIỆM VỤ", qpX + qpW/2, qpY + 12, 16, "#ffe18a", "#000", "center");
  let qy = qpY + 38;
  for (const q of quests) {
    const sym = q.done ? "✓" : "•";
    const col = q.done ? "#7afc6e" : "#fff";
    let label = q.text;
    let s = 13;
    ctx.font = `bold ${s}px sans-serif`;
    const maxW = qpW - 80;
    while (ctx.measureText(label).width > maxW && label.length > 6) {
      label = label.slice(0, -1);
    }
    if (label !== q.text) label = label.slice(0, -1) + "…";
    drawText(`${sym} ${label}`, qpX + 14, qy, s, col, "#000");
    drawText(`${q.progress}/${q.target}`,
             qpX + qpW - 14, qy, s, col, "#000", "right");
    qy += 22;
  }

  // Bảng máu boss - giữ giữa trên, dưới Power Bar
  if (level.boss && level.boss.alive && level.boss.aggro) {
    const bx = W/2 - 260, by = 110;
    ctx.fillStyle = "rgba(14, 22, 48, 0.85)";
    ctx.fillRect(bx, by, 520, 44);
    ctx.fillStyle = "#ff5a5a";
    ctx.fillRect(bx, by, 520, 3);
    drawText("BOSS  ·  " + level.config.bossName,
             W/2, by + 8, 16, "#ff8a8a", "#000", "center");
    const r = clamp(level.boss.hp / level.boss.maxHp, 0, 1);
    ctx.fillStyle = "rgba(255, 90, 90, 0.18)"; ctx.fillRect(bx + 10, by + 26, 500, 12);
    ctx.fillStyle = "#ff3838";                 ctx.fillRect(bx + 10, by + 26, 500 * r, 12);
  }

  // Hint phím dưới đáy - chuyển sang PHẢI để không đè panel chính trái
  ctx.fillStyle = "rgba(14, 22, 48, 0.78)";
  ctx.fillRect(W - 420, H - 110, 400, 90);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(W - 420, H - 110, 3, 90);
  drawText("← → : Đi   ↑ / Cách : Nhảy",          W - 408, H - 102, 15, "#dbe6f5");
  drawText("Chuột trái : Phép Khống Chế Từ Xa",   W - 408, H -  82, 15, "#cba9ff");
  drawText("Enter : Bảng nhiệm vụ (gần NPC)",     W - 408, H -  62, 15, "#5dd968");
  drawText("E : Cửa Hàng  ·  1-6 / Q : Đổi sức mạnh", W - 408, H -  42, 15, "#ffe18a");
}
