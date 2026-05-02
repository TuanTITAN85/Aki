"use strict";
// =============================================================================
// CỬA HÀNG - 13 mặt hàng chia 4 tab (Hồi Phẩm / Trái Ác Quỷ / Kiếm / Đồng Hành)
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
  { id:"hp_small",   kind:"heal",     name:"Bình Máu Nhỏ",   desc:"Hồi 30 máu",          price:20,  cat:"hp"    },
  { id:"hp_big",     kind:"heal_full",name:"Bình Máu Lớn",   desc:"Hồi đầy máu",         price:50,  cat:"hp"    },
  { id:"max_hp",     kind:"max_hp",   name:"Tăng Máu Tối Đa",desc:"+20 máu tối đa",      price:120, cat:"hp"    },
  { id:"extra_life", kind:"life",     name:"Mạng Sống Thêm", desc:"+1 mạng",             price:300, cat:"hp"    },
  { id:"fruit_flame",  kind:"fruit", fruit:"flame",   name:"Trái Lửa",  desc:"32 dmg, bắn nhanh",    price:80,  cat:"fruit" },
  { id:"fruit_ice",    kind:"fruit", fruit:"ice",     name:"Trái Băng", desc:"22 dmg × 2 viên",      price:120, cat:"fruit" },
  { id:"fruit_wind",   kind:"fruit", fruit:"wind",    name:"Trái Gió",  desc:"16 dmg × 3 viên quạt", price:150, cat:"fruit" },
  { id:"fruit_dragon", kind:"fruit", fruit:"dragon",  name:"Trái Rồng", desc:"60 dmg cực mạnh",      price:220, cat:"fruit" },
  { id:"fruit_thunder",kind:"fruit", fruit:"thunder", name:"Trái Sét",  desc:"85 dmg, sát thương cao",price:320, cat:"fruit" },
  { id:"sword_bronze", kind:"sword", tier:1, name:"Kiếm Đồng", desc:"+20% sát thương",  price:150, cat:"sword" },
  { id:"sword_silver", kind:"sword", tier:2, name:"Kiếm Bạc",  desc:"+50% sát thương",  price:380, cat:"sword" },
  { id:"sword_gold",   kind:"sword", tier:3, name:"Kiếm Vàng", desc:"+100% sát thương", price:800, cat:"sword" },
  { id:"companion_dog",  kind:"companion", companionKind:"dog",
    name:"Chú Cún Golden Retriever",
    desc:"DPS - dame cao, máu thấp (300px range)",  price:200, cat:"companion" },
  { id:"companion_duck", kind:"companion", companionKind:"duck",
    name:"Vịt Vàng Donald",
    desc:"TANK - máu cao, dame thấp (250px range)", price:250, cat:"companion" },
  { id:"upgrade_companion", kind:"upgrade_companion",
    name:"Nâng Cấp Đồng Hành",
    desc:"+25 HP, +10 dame mỗi cấp (giá tăng 100/lần)",
    price:100, cat:"upgrade" }
];

// Tab hiện tại
let shopTab = "hp"; // "hp" | "fruit" | "sword" | "companion" | "upgrade"

// Các tab
const SHOP_TABS = [
  { id:"hp",        label:"Hồi Phẩm",    icon:"+",  color:"#ff6a6a" },
  { id:"fruit",     label:"Trái Ác Quỷ", icon:"●",  color:"#d48aff" },
  { id:"sword",     label:"Kiếm",        icon:"⚔",  color:"#ffd24a" },
  { id:"companion", label:"Đồng Hành",   icon:"🐕", color:"#d4a050" },
  { id:"upgrade",   label:"Nâng Cấp",    icon:"↑",  color:"#5dccff" }
];

// Bố cục cửa hàng (tất cả tọa độ canvas tuyệt đối)
const SHOP_LAYOUT = {
  panelX: 40, panelY: 24, panelW: 1200, panelH: 672,

  titleY: 50,     // canvas y của title (baseline)
  goldY: 68,      // canvas y của dòng vàng (baseline)

  tabBarY: 88,    // canvas y bắt đầu tab bar
  tabBarH: 44,    // chiều cao tab bar

  footerY: 664,   // canvas y bắt đầu footer

  cardW: 364, cardH: 118, cols: 3, gap: 14,
  startX: 56,     // canvas x bắt đầu card
  startY: 148    // canvas y bắt đầu card row đầu tiên
};

// Rect của một card trong tab hiện tại
function shopCardRect(idx) {
  const L = SHOP_LAYOUT;
  const col = idx % L.cols, row = Math.floor(idx / L.cols);
  return {
    x: L.startX + col * (L.cardW + L.gap),
    y: L.startY + row * (L.cardH + L.gap),
    w: L.cardW, h: L.cardH
  };
}

// Lấy items thuộc tab hiện tại
function shopTabItems() {
  return SHOP_ITEMS.filter(it => it.cat === shopTab);
}

// Tính giá thực tế cho một item (upgrade_companion tăng theo tổng level)
function shopItemPrice(item) {
  if (item.kind === "upgrade_companion") {
    const dogLv  = (typeof companionDog  !== "undefined" && companionDog)  ? companionDog.level  : 0;
    const duckLv = (typeof companionDuck !== "undefined" && companionDuck) ? companionDuck.level : 0;
    const totalLv = dogLv + duckLv;
    return totalLv === 0 ? item.price : 100 * totalLv;
  }
  return item.price;
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
  // Tính giá thực tế (upgrade có giá tăng theo level)
  if (item.kind === "upgrade_companion") {
    const dogLv  = (typeof companionDog  !== "undefined" && companionDog)  ? companionDog.level  : 0;
    const duckLv = (typeof companionDuck !== "undefined" && companionDuck) ? companionDuck.level : 0;
    if (dogLv + duckLv === 0) {
      showNotice("Cần mua đồng hành (Cún hoặc Vịt) trước khi nâng cấp!", 150);
      sfxHurt();
      return;
    }
  }
  const actualPrice = shopItemPrice(item);

  // === PHASE 1: Check ALL conditions ===
  if (player.gold < actualPrice) {
    showNotice("Không đủ vàng để mua " + item.name + "!", 90);
    sfxHurt();
    return;
  }
  if (item.kind === "sword" && player.swordTier >= item.tier) {
    showNotice("Bạn đã có kiếm bằng hoặc tốt hơn rồi!", 90);
    sfxHurt();
    return;
  }
  if (item.kind === "companion") {
    // Check trùng companion theo kind
    if (item.companionKind === "dog" && companionDog) {
      showNotice("Bạn đã có Cún rồi!", 180);
      sfxHurt();
      return;
    }
    if (item.companionKind === "duck" && companionDuck) {
      showNotice("Bạn đã có Vịt rồi!", 180);
      sfxHurt();
      return;
    }
  }

  // === PHASE 2: Trừ vàng (atomic - 1 lần duy nhất, không trùng) ===
  player.gold -= actualPrice;

  // === PHASE 3: Apply effect ===
  if (item.kind === "heal")        player.hp = Math.min(player.maxHp, player.hp + 30);
  else if (item.kind === "heal_full") player.hp = player.maxHp;
  else if (item.kind === "max_hp") { player.maxHp += 20; player.hp += 20; }
  else if (item.kind === "life")    player.lives += 1;
  else if (item.kind === "fruit") {
    player.acquireFruit(item.fruit);
    showNotice("Đã mua " + item.name + "! Bấm 1-6 để đổi qua lại.", 180);
  }
  else if (item.kind === "sword") {
    player.swordTier = item.tier;
    showNotice("Bạn vừa nhận " + item.name + "!", 150);
  }
  else if (item.kind === "companion") {
    // Chuyển sang màn hình nhập tên (Cún hoặc Vịt)
    gameState = STATE.DOG_NAME;
    dogNameInput = "";
    pendingDogPrice = actualPrice;        // refund khi escape
    pendingCompanionKind = item.companionKind || "dog";
    // Reset + focus input ẩn để IME tiếng Việt hoạt động (giống NAME_INPUT)
    if (typeof nameInputEl !== "undefined") {
      nameInputEl.value = "";
      nameInputEl.style.pointerEvents = "auto";
      Promise.resolve().then(() => nameInputEl.focus());
    }
    sfxCoin();                            // tiếng confirm trước khi đổi state
    return;                               // quay ra ngay (đổi state -> shop đóng)
  }
  else if (item.kind === "upgrade_companion") {
    // Tăng level cho TẤT CẢ companion đang có (dog + duck)
    let upgraded = [];
    if (companionDog) {
      companionDog.level++;
      companionDog.maxHp += 25;
      companionDog.hp     = companionDog.maxHp;       // heal full khi nâng
      companionDog.DOG_DAMAGE += 10;
      upgraded.push("Cún " + companionDog.name);
    }
    if (companionDuck) {
      companionDuck.level++;
      companionDuck.maxHp += 25;
      companionDuck.hp     = companionDuck.maxHp;
      companionDuck.DOG_DAMAGE += 10;
      upgraded.push("Vịt " + companionDuck.name);
    }
    showNotice("Đã nâng cấp: " + upgraded.join(", ") + "!", 200);
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
    // Dùng PNG asset 44x44 căn giữa, fallback circles nếu chưa tải
    const dispW = 48, dispH = 48;
    if (!drawFruitImage(item.fruit, cx - dispW/2, cy - dispH/2, dispW, dispH)) {
      const cfg = POWERS[item.fruit];
      ctx.fillStyle = "#3a8a2a";
      ctx.fillRect(cx - 2, cy - 24, 4, 8);
      ctx.fillStyle = cfg.glow;
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = cfg.color;
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(cx - 6, cy - 8, 4, 4);
    }
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
  } else if (item.kind === "companion") {
    // Chú Cún Golden Retriever - vẽ bằng canvas primitives
    ctx.fillStyle = "#d4a050";
    ctx.beginPath(); ctx.ellipse(cx, cy, 28, 18, 0, 0, Math.PI * 2); ctx.fill(); // body
    ctx.fillStyle = "#a07030";
    ctx.beginPath(); ctx.ellipse(cx - 8, cy, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); // shadow
    ctx.fillStyle = "#d4a050";
    ctx.beginPath(); ctx.ellipse(cx + 22, cy - 4, 14, 12, 0, 0, Math.PI * 2); ctx.fill(); // head
    ctx.fillStyle = "#a07030";
    ctx.beginPath(); ctx.ellipse(cx + 14, cy - 14, 6, 8, -0.3, 0, Math.PI * 2); ctx.fill(); // ear
    ctx.beginPath(); ctx.ellipse(cx + 26, cy - 12, 6, 8, 0.3, 0, Math.PI * 2); ctx.fill(); // ear
    ctx.fillStyle = "#ffd6a8";
    ctx.beginPath(); ctx.ellipse(cx + 32, cy + 2, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); // snout
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath(); ctx.ellipse(cx + 37, cy, 3, 3, 0, 0, Math.PI * 2); ctx.fill(); // nose
    ctx.beginPath(); ctx.arc(cx + 24, cy - 6, 3, 0, Math.PI * 2); ctx.fill(); // eye
  }
}

// Vẽ cửa hàng (mở khi bấm E)
function drawShop() {
  // backdrop làm mờ thế giới phía sau
  ctx.fillStyle = "rgba(8, 14, 30, 0.88)";
  ctx.fillRect(0, 0, W, H);

  const L = SHOP_LAYOUT;

  // Panel chính
  ctx.fillStyle = "#141d3a";
  ctx.fillRect(L.panelX, L.panelY, L.panelW, L.panelH);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(L.panelX, L.panelY, L.panelW, 4);    // vạch vàng đỉnh

  // === Header: tiêu đề ===
  drawText("CỬA HÀNG HẢI TẶC",
    L.panelX + L.panelW/2, L.titleY, 30, "#ffd24a", "#000", "center");
  drawText("💰 " + player.gold,
    L.panelX + L.panelW - 30, L.goldY, 22, "#fff5a0", "#000", "right");

  // === Tab bar (tách biệt khỏi header) ===
  const tabCount = SHOP_TABS.length;
  const tabW = (L.panelW - 40) / tabCount;
  // Nền tab bar - dùng màu nhạt hơn panel để phân biệt
  ctx.fillStyle = "#1a2448";
  ctx.fillRect(L.panelX, L.tabBarY, L.panelW, L.tabBarH);
  // Vạch phân cách tab bar vs header
  ctx.fillStyle = "#ffd24a44";
  ctx.fillRect(L.panelX, L.tabBarY - 2, L.panelW, 2);

  for (let i = 0; i < tabCount; i++) {
    const tab = SHOP_TABS[i];
    const tx = L.panelX + 20 + i * tabW;
    const active = shopTab === tab.id;
    const hover = (input.mouseX >= tx && input.mouseX <= tx + tabW &&
                   input.mouseY >= L.tabBarY && input.mouseY <= L.tabBarY + L.tabBarH);

    // Nền tab
    ctx.fillStyle = active ? tab.color + "40" : (hover ? tab.color + "20" : "transparent");
    ctx.fillRect(tx + 2, L.tabBarY + 4, tabW - 4, L.tabBarH - 8);

    // Vạch dưới tab đang active
    if (active) {
      ctx.fillStyle = tab.color;
      ctx.fillRect(tx + 2, L.tabBarY + L.tabBarH - 4, tabW - 4, 4);
    }

    // Tên tab
    const labelCol = active ? "#fff" : (hover ? "#ddd" : "#7a8aaa");
    drawText(tab.label, tx + tabW/2, L.tabBarY + L.tabBarH/2 + 6, 18, labelCol, "#000", "center");
  }

  // === Item cards ===
  const items = shopTabItems();
  const maxItems = 9;  // tối đa 3 rows × 3 cols

  for (let i = 0; i < Math.min(items.length, maxItems); i++) {
    const it = items[i];
    const r  = shopCardRect(i);

    const itPrice    = shopItemPrice(it);
    const enough     = player.gold >= itPrice;
    const ownedFruit = it.kind === "fruit" && player.inventory.includes(it.fruit);
    const activeFruit= it.kind === "fruit" && player.power === it.fruit;
    const ownedSword = it.kind === "sword" && player.swordTier >= it.tier;
    // Companion ownership phải khớp theo companionKind (dog/duck), không lẫn lộn
    const ownedCompanion = it.kind === "companion" && (
      (it.companionKind === "dog"  && typeof companionDog  !== "undefined" && companionDog) ||
      (it.companionKind === "duck" && typeof companionDuck !== "undefined" && companionDuck)
    );

    // hover (chuột nằm trong)
    const hover = (input.mouseX >= r.x && input.mouseX <= r.x + r.w &&
                   input.mouseY >= r.y && input.mouseY <= r.y + r.h);

    // nền card phẳng - vạch màu mỏng phía trái báo trạng thái
    let bgCol  = "#1c264a";
    let accent = "#3a4a78";
    if (activeFruit)        { bgCol = "#1f3a2a"; accent = "#5dd968"; }
    else if (ownedFruit)   { bgCol = "#1c3548"; accent = "#5dccff"; }
    else if (ownedSword)    { bgCol = "#1f3a2a"; accent = "#5dd968"; }
    else if (ownedCompanion){ bgCol = "#1f3a2a"; accent = "#5dd968"; }
    else if (!enough)       { accent = "#3a3a3a"; }
    if (hover && !activeFruit && !ownedCompanion) {
      bgCol  = ownedFruit ? "#1f4258" : "#22305c";
      accent = ownedFruit ? "#7ad4ff" : "#ffd24a";
    }

    ctx.fillStyle = bgCol;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = accent;
    ctx.fillRect(r.x, r.y, 4, r.h);  // vạch trái

    // icon
    drawShopIcon(it, r.x + 48, r.y + r.h/2);

    // tên + mô tả
    const textMaxW = r.w - 110;
    let nameSize = 19;
    ctx.font = `bold ${nameSize}px sans-serif`;
    while (ctx.measureText(it.name).width > textMaxW && nameSize > 14) {
      nameSize--; ctx.font = `bold ${nameSize}px sans-serif`;
    }
    drawText(it.name, r.x + 94, r.y + 18, nameSize, "#ffd24a", "#000");

    let descSize = 13;
    ctx.font = `bold ${descSize}px sans-serif`;
    let desc = it.desc;
    while (ctx.measureText(desc).width > textMaxW && desc.length > 6) {
      desc = desc.slice(0, -1);
    }
    if (desc !== it.desc) desc = desc.slice(0, -1) + "…";
    drawText(desc, r.x + 94, r.y + 44, descSize, "#ccc", "#000");

    // dòng trạng thái + giá
    if (activeFruit) {
      drawText("ĐANG DÙNG", r.x + r.w - 14, r.y + r.h - 28, 18, "#7afc6e", "#000", "right");
    } else if (ownedFruit) {
      drawText("ĐÃ CÓ · Miễn phí đổi", r.x + r.w - 14, r.y + r.h - 28, 16, "#7ad4ff", "#000", "right");
    } else if (ownedSword) {
      drawText("ĐÃ CÓ", r.x + r.w - 14, r.y + r.h - 28, 18, "#7afc6e", "#000", "right");
    } else if (ownedCompanion) {
      drawText("ĐÃ CÓ", r.x + r.w - 14, r.y + r.h - 28, 18, "#7afc6e", "#000", "right");
    } else {
      const priceCol = enough ? "#fff5a0" : "#ff6a6a";
      drawText(itPrice + " 💰", r.x + r.w - 14, r.y + r.h - 28, 22, priceCol, "#000", "right");
      drawText(enough ? "[Bấm mua]" : "[Thiếu vàng]",
               r.x + 94, r.y + r.h - 28, 13, enough ? "#7afc6e" : "#ff6a6a", "#000");
    }
  }

  // === Footer ===
  ctx.fillStyle = "#1a2448";
  ctx.fillRect(L.panelX, L.footerY, L.panelW, 56);
  drawText("Bấm E hoặc ESC để đóng cửa hàng",
    L.panelX + L.panelW/2, L.footerY + 32, 16, "#8ea6c8", "#000", "center");

  // Thông báo nổi (nếu có) - trước footer
  if (noticeTimer > 0 && questNotice) {
    const notY = L.footerY - 52;
    ctx.fillStyle = "rgba(0,0,0,0.82)";
    ctx.fillRect(W/2 - 400, notY, 800, 44);
    drawText(questNotice, W/2, notY + 22, 20, "#fff", "#000", "center");
  }
}

// Click handler cho tab — trả về tab id nếu click vào tab, null otherwise
function shopTabAt(x, y) {
  const L = SHOP_LAYOUT;
  const tabCount = SHOP_TABS.length;
  const tabW = (L.panelW - 40) / tabCount;
  if (y >= L.tabBarY && y <= L.tabBarY + L.tabBarH) {
    for (let i = 0; i < tabCount; i++) {
      const tx = L.panelX + 20 + i * tabW;
      if (x >= tx && x <= tx + tabW) return SHOP_TABS[i].id;
    }
  }
  return null;
}
