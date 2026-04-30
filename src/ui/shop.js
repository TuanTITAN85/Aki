"use strict";
// =============================================================================
// CỬA HÀNG - 12 mặt hàng (HP, mạng, 5 trái ác quỷ, 3 cấp kiếm)
// Mở/đóng bằng phím E hoặc ESC. Click chuột vào thẻ để mua.
// Trái đã sở hữu -> bấm để đổi miễn phí.
//
// Phụ thuộc:
//   ctx, W, H, player, input, noticeTimer, questNotice (index.html)
//   render.js: drawText
//   audio.js : sfxCoin, sfxHurt
//   index.html: POWERS, FRUIT_VI_NAMES, showNotice, spawnParticles
//
// Export:
//   SHOP_ITEMS, SHOP_LAYOUT, shopCardRect(idx), buyShopItem(item),
//   drawShopIcon(item, cx, cy), drawShop()
// =============================================================================

const SHOP_ITEMS = [
  { id:"hp_small",   kind:"heal",     name:"Bình Máu Nhỏ",   desc:"Hồi 30 máu",          price:20 },
  { id:"hp_big",     kind:"heal_full",name:"Bình Máu Lớn",   desc:"Hồi đầy máu",         price:50 },
  { id:"max_hp",     kind:"max_hp",   name:"Tăng Máu Tối Đa",desc:"+20 máu tối đa",      price:120 },
  { id:"extra_life", kind:"life",     name:"Mạng Sống Thêm", desc:"+1 mạng",             price:300 },
  { id:"fruit_flame",  kind:"fruit", fruit:"flame",   name:"Trái Lửa",  desc:"32 dmg, bắn nhanh",    price:80  },
  { id:"fruit_ice",    kind:"fruit", fruit:"ice",     name:"Trái Băng", desc:"22 dmg × 2 viên",      price:120 },
  { id:"fruit_wind",   kind:"fruit", fruit:"wind",    name:"Trái Gió",  desc:"16 dmg × 3 viên quạt", price:150 },
  { id:"fruit_dragon", kind:"fruit", fruit:"dragon",  name:"Trái Rồng", desc:"60 dmg cực mạnh",      price:220 },
  { id:"fruit_thunder",kind:"fruit", fruit:"thunder", name:"Trái Sét",  desc:"85 dmg, sát thương cao",price:320 },
  { id:"sword_bronze", kind:"sword", tier:1, name:"Kiếm Đồng", desc:"+20% sát thương",  price:150 },
  { id:"sword_silver", kind:"sword", tier:2, name:"Kiếm Bạc",  desc:"+50% sát thương",  price:380 },
  { id:"sword_gold",   kind:"sword", tier:3, name:"Kiếm Vàng", desc:"+100% sát thương", price:800 }
];

// Bố cục lưới cửa hàng (lưu rect mỗi mục để bắt click)
const SHOP_LAYOUT = {
  panelX: 60, panelY: 60, panelW: 1160, panelH: 600,
  cardW: 360, cardH: 124, cols: 3, gap: 14,
  startX: 80, startY: 160
};
function shopCardRect(idx) {
  const L = SHOP_LAYOUT;
  const col = idx % L.cols, row = Math.floor(idx / L.cols);
  return {
    x: L.startX + col * (L.cardW + L.gap),
    y: L.startY + row * (L.cardH + L.gap),
    w: L.cardW, h: L.cardH
  };
}

// Mua một mặt hàng
function buyShopItem(item) {
  // Đã sở hữu trái này -> bấm là đổi miễn phí (không tốn vàng)
  if (item.kind === "fruit" && player.inventory.includes(item.fruit)) {
    if (player.power === item.fruit) {
      showNotice("Bạn đang dùng " + item.name + " rồi!", 90);
      return;
    }
    player.power = item.fruit;
    showNotice("Đã đổi sang " + item.name + " (miễn phí)!", 120);
    sfxCoin();
    return;
  }
  if (player.gold < item.price) {
    showNotice("Không đủ vàng để mua " + item.name + "!", 90);
    sfxHurt();
    return;
  }
  if (item.kind === "sword" && player.swordTier >= item.tier) {
    showNotice("Bạn đã có kiếm bằng hoặc tốt hơn rồi!", 90);
    sfxHurt();
    return;
  }
  player.gold -= item.price;
  if (item.kind === "heal")       player.hp = Math.min(player.maxHp, player.hp + 30);
  else if (item.kind === "heal_full") player.hp = player.maxHp;
  else if (item.kind === "max_hp") { player.maxHp += 20; player.hp += 20; }
  else if (item.kind === "life")   player.lives += 1;
  else if (item.kind === "fruit") {
    player.acquireFruit(item.fruit);
    showNotice("Đã mua " + item.name + "! Bấm 1-6 để đổi qua lại.", 180);
  }
  else if (item.kind === "sword") {
    player.swordTier = item.tier;
    showNotice("Bạn vừa nhận " + item.name + "!", 150);
  }
  sfxCoin();
  spawnParticles(player.x + player.w/2, player.y + player.h/2, {
    count: 18, color: "#fff5a0", speed: 4, size: 3, life: 30, shape: "star"
  });
}

// Vẽ icon trong thẻ shop tuỳ theo loại mặt hàng
function drawShopIcon(item, cx, cy) {
  if (item.kind === "heal" || item.kind === "heal_full") {
    // bình thuốc đỏ
    ctx.fillStyle = "#5a2a06";
    ctx.fillRect(cx - 8, cy - 18, 16, 6);          // nắp
    ctx.fillStyle = "#7a3a06";
    ctx.fillRect(cx - 4, cy - 22, 8, 6);
    ctx.fillStyle = item.kind === "heal_full" ? "#ff1a1a" : "#ff6a6a";
    ctx.fillRect(cx - 12, cy - 12, 24, 28);
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - 8, cy - 8, 4, 6);            // điểm sáng
    drawText("+", cx, cy + 2, 16, "#fff", "#000", "center");
  } else if (item.kind === "max_hp") {
    // trái tim lớn
    ctx.fillStyle = "#ff4a6a";
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 4, 9, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 4, 9, 0, Math.PI * 2);
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx + 14, cy);
    ctx.fill();
    drawText("+", cx, cy - 8, 14, "#fff", "#000", "center");
  } else if (item.kind === "life") {
    // chữ 1UP kiểu game
    ctx.fillStyle = "#7afc6e";
    ctx.fillRect(cx - 22, cy - 14, 44, 28);
    drawText("1UP", cx, cy - 8, 16, "#fff", "#000", "center");
  } else if (item.kind === "fruit") {
    const cfg = POWERS[item.fruit];
    ctx.fillStyle = "#3a8a2a";
    ctx.fillRect(cx - 2, cy - 24, 4, 8);           // cuống
    ctx.fillStyle = cfg.glow;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cfg.color;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - 6, cy - 8, 4, 4);
  } else if (item.kind === "sword") {
    // kiếm với màu khác nhau theo cấp
    const colors = [null,
      ["#cc7a1a", "#8a4a06"],   // đồng
      ["#dde0e6", "#9aa0aa"],   // bạc
      ["#ffd24a", "#a87a14"]];  // vàng
    const [c1, c2] = colors[item.tier];
    ctx.fillStyle = "#3a1a06"; ctx.fillRect(cx - 3, cy + 6, 6, 14);
    ctx.fillStyle = c2;        ctx.fillRect(cx - 12, cy + 4, 24, 4);
    ctx.fillStyle = c1;        ctx.fillRect(cx - 2, cy - 22, 4, 28);
    ctx.fillStyle = "#fff";    ctx.fillRect(cx - 1, cy - 22, 1, 22);
    ctx.fillStyle = c2;        ctx.fillRect(cx - 2, cy - 24, 4, 4);
  }
}

// Vẽ cửa hàng (mở khi bấm E)
function drawShop() {
  // backdrop làm mờ thế giới phía sau
  ctx.fillStyle = "rgba(8, 14, 30, 0.82)";
  ctx.fillRect(0, 0, W, H);

  const L = SHOP_LAYOUT;
  // panel chính - nền phẳng, chỉ một vạch nhấn vàng ở đỉnh
  ctx.fillStyle = "#141d3a";
  ctx.fillRect(L.panelX, L.panelY, L.panelW, L.panelH);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(L.panelX, L.panelY, L.panelW, 4);

  // tiêu đề
  drawText("CỬA HÀNG HẢI TẶC",
    L.panelX + L.panelW/2, L.panelY + 24, 30, "#ffd24a", "#000", "center");
  drawText("Vàng của bạn: " + player.gold,
    L.panelX + 30, L.panelY + 78, 20, "#ffe18a", "#000", "left");
  drawText("Bấm E hoặc ESC để đóng",
    L.panelX + L.panelW - 30, L.panelY + 80, 16, "#8ea6c8", "#000", "right");

  // các thẻ hàng
  for (let i = 0; i < SHOP_ITEMS.length; i++) {
    const it = SHOP_ITEMS[i];
    const r  = shopCardRect(i);

    const enough     = player.gold >= it.price;
    const ownedFruit = it.kind === "fruit" && player.inventory.includes(it.fruit);
    const activeFruit= it.kind === "fruit" && player.power === it.fruit;
    const ownedSword = it.kind === "sword" && player.swordTier >= it.tier;

    // hover (chuột nằm trong)
    const hover = (input.mouseX >= r.x && input.mouseX <= r.x + r.w &&
                   input.mouseY >= r.y && input.mouseY <= r.y + r.h);

    // nền card phẳng - không viền, chỉ một vạch màu mỏng phía trái để báo trạng thái
    let bgCol  = "#1c264a";
    let accent = "#3a4a78";
    if (activeFruit)      { bgCol = "#1f3a2a"; accent = "#5dd968"; }
    else if (ownedFruit)  { bgCol = "#1c3548"; accent = "#5dccff"; }
    else if (ownedSword)  { bgCol = "#1f3a2a"; accent = "#5dd968"; }
    else if (!enough)     { accent = "#3a3a3a"; }
    if (hover && !activeFruit) {
      bgCol  = ownedFruit ? "#1f4258" : "#22305c";
      accent = ownedFruit ? "#7ad4ff" : "#ffd24a";
    }

    ctx.fillStyle = bgCol;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = accent;
    ctx.fillRect(r.x, r.y, 4, r.h);

    // icon
    drawShopIcon(it, r.x + 50, r.y + r.h/2);

    // tên + mô tả (tự co cỡ chữ nếu quá dài để khỏi tràn ra ngoài thẻ)
    const textMaxW = r.w - 120;
    let nameSize = 20;
    ctx.font = `bold ${nameSize}px sans-serif`;
    while (ctx.measureText(it.name).width > textMaxW && nameSize > 14) {
      nameSize--;
      ctx.font = `bold ${nameSize}px sans-serif`;
    }
    drawText(it.name, r.x + 100, r.y + 12, nameSize, "#ffd24a", "#000");
    let descSize = 13;
    ctx.font = `bold ${descSize}px sans-serif`;
    let desc = it.desc;
    while (ctx.measureText(desc).width > textMaxW && desc.length > 6) {
      desc = desc.slice(0, -1);
    }
    if (desc !== it.desc) desc = desc.slice(0, -1) + "…";
    drawText(desc, r.x + 100, r.y + 40, descSize, "#fff", "#000");

    // dòng trạng thái + giá
    if (activeFruit) {
      drawText("ĐANG DÙNG", r.x + r.w - 14, r.y + r.h - 32, 18, "#7afc6e", "#000", "right");
    } else if (ownedFruit) {
      drawText("Bấm để đổi (miễn phí)", r.x + 100, r.y + r.h - 26, 13, "#7ad4ff", "#000");
      drawText("ĐÃ CÓ", r.x + r.w - 14, r.y + r.h - 32, 16, "#7ad4ff", "#000", "right");
    } else if (ownedSword) {
      drawText("ĐÃ CÓ", r.x + r.w - 14, r.y + r.h - 32, 18, "#7afc6e", "#000", "right");
    } else {
      const priceCol = enough ? "#fff5a0" : "#ff6a6a";
      drawText(it.price + " 💰", r.x + r.w - 14, r.y + r.h - 32, 20, priceCol, "#000", "right");
      drawText(enough ? "[Bấm để mua]" : "[Thiếu vàng]",
               r.x + 100, r.y + r.h - 26, 13, enough ? "#7afc6e" : "#ff6a6a", "#000");
    }
  }

  // thông báo nổi (nếu có)
  if (noticeTimer > 0 && questNotice) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(W/2 - 360, L.panelY + L.panelH - 56, 720, 44);
    drawText(questNotice, W/2, L.panelY + L.panelH - 48, 20, "#fff", "#000", "center");
  }
}
