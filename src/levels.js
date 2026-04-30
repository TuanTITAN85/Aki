"use strict";
// =============================================================================
// LEVELS - cấu hình 5 đảo + Level Builder + helpers nhiệm vụ
//
// Phụ thuộc:
//   render.js: rand
//   bosses.js: BOSS_KINDS
//   enemy.js : Enemy
//   items.js : Item, QuestNPC, Boat
//
// Export:
//   ISLAND_CONFIGS — mảng 5 đảo (tên, màu, boss, beasts, decoration, quests)
//   buildIsland(idx) — sinh level (platforms, enemies, items, npcs, boats)
//   makeQuestState(idx), updateQuests(quests, event), allQuestsDone(quests)
// =============================================================================

const ISLAND_CONFIGS = [
  {
    name: "Đảo Cỏ Xanh",
    skyTop: "#7ed6ff", skyBot: "#cdebff",
    groundTop: "#6ec85a", groundBot: "#3a7a2a",
    sandTop: "#f7e4a8",
    waterColor: "#1c8ad0",
    bossName: "Vua Khỉ Đỏ",
    bossKind: "monkey_king",
    bossTheme: "monkey",
    beastThemes: ["snake", "boar", "monkey", "wolf", "tiger"],
    decoration: "tree",
    quests: [
      { type: "kill_guards", count: 5, text: "Đánh bại 5 lính canh trên đảo" },
      { type: "collect_coins", count: 5, text: "Thu thập 5 tiền vàng" },
      { type: "kill_boss", count: 1, text: "Đánh bại boss Vua Khỉ Đỏ" }
    ]
  },
  {
    name: "Đảo Sa Mạc Vàng",
    skyTop: "#ffc97a", skyBot: "#ffe6b8",
    groundTop: "#e6b85a", groundBot: "#a87a2a",
    sandTop: "#f5d680",
    waterColor: "#1c8ad0",
    bossName: "Bọ Cạp Khổng Lồ",
    bossKind: "giant_scorpion",
    bossTheme: "spider",
    beastThemes: ["snake", "spider", "wolf", "tiger", "boar"],
    decoration: "cactus",
    quests: [
      { type: "kill_beasts", count: 5, text: "Tiêu diệt 5 thú rừng" },
      { type: "collect_fruit", count: 1, text: "Tìm 1 trái ma thuật bí mật" },
      { type: "kill_boss", count: 1, text: "Đánh bại Bọ Cạp Khổng Lồ" }
    ]
  },
  {
    name: "Đảo Tuyết Trắng",
    skyTop: "#aee0ff", skyBot: "#e8f5ff",
    groundTop: "#ffffff", groundBot: "#b8d8e6",
    sandTop: "#dde9f2",
    waterColor: "#0c5a8a",
    bossName: "Người Tuyết Khổng Lồ",
    bossKind: "yeti",
    bossTheme: "yeti",
    beastThemes: ["wolf", "bear", "yeti", "wolf", "bear"],
    decoration: "pine",
    quests: [
      { type: "kill_guards", count: 5, text: "Hạ gục 5 lính canh băng giá" },
      { type: "kill_beasts", count: 5, text: "Hạ 5 thú rừng tuyết" },
      { type: "kill_boss", count: 1, text: "Đánh bại Người Tuyết Khổng Lồ" }
    ]
  },
  {
    name: "Đảo Núi Lửa",
    skyTop: "#ff7a3c", skyBot: "#ffb87a",
    groundTop: "#7a3a1a", groundBot: "#3a1a06",
    sandTop: "#a85a2a",
    waterColor: "#a51212",
    bossName: "Hổ Lửa",
    bossKind: "fire_tiger",
    bossTheme: "tiger",
    beastThemes: ["tiger", "snake", "boar", "wolf", "spider"],
    decoration: "rock",
    quests: [
      { type: "collect_coins", count: 8, text: "Nhặt 8 tiền vàng giữa dung nham" },
      { type: "kill_guards", count: 5, text: "Đánh bại 5 lính canh núi lửa" },
      { type: "kill_boss", count: 1, text: "Đánh bại Hổ Lửa" }
    ]
  },
  {
    name: "Đảo Trời Mây",
    skyTop: "#ff9bd4", skyBot: "#cdc7ff",
    groundTop: "#cba9ff", groundBot: "#6a4ab0",
    sandTop: "#e0d2ff",
    waterColor: "#1c2a8a",
    bossName: "Vua Hải Tặc Đen",
    bossKind: "dark_king",
    bossTheme: "spider",
    beastThemes: ["spider", "snake", "yeti", "wolf", "tiger"],
    decoration: "cloud",
    quests: [
      { type: "kill_guards", count: 5, text: "Đánh bại 5 lính tinh nhuệ" },
      { type: "kill_beasts", count: 5, text: "Đánh bại 5 thú huyền thoại" },
      { type: "kill_boss", count: 1, text: "Đánh bại VUA HẢI TẶC ĐEN!" }
    ]
  }
];

// =============================================================================
// LEVEL BUILDER - sinh nền, kẻ thù, vật phẩm cho 1 đảo
// =============================================================================
function buildIsland(index) {
  const cfg = ISLAND_CONFIGS[index];
  const level = {
    name: cfg.name,
    config: cfg,
    width: 4200,
    groundY: 560,
    deathY: 900,
    spawnX: 100,
    spawnY: 400,
    platforms: [],
    enemies: [],
    items: [],
    npcs: [],
    boats: [],
    decorations: []
  };

  // Nền chính - 4 đoạn cách nhau (rớt xuống biển ở giữa)
  level.platforms.push({ x: 0, y: 560, w: 1200, h: 200, type: "ground" });
  level.platforms.push({ x: 1280, y: 560, w: 900, h: 200, type: "ground" });
  level.platforms.push({ x: 2260, y: 560, w: 800, h: 200, type: "ground" });
  level.platforms.push({ x: 3140, y: 560, w: 1060, h: 200, type: "ground" });

  // Các bục lơ lửng - leo cao tìm vàng
  const floats = [
    { x: 320, y: 460, w: 140, h: 24 },
    { x: 540, y: 380, w: 140, h: 24 },
    { x: 760, y: 320, w: 120, h: 24 },
    { x: 1100, y: 420, w: 180, h: 24 },
    { x: 1450, y: 360, w: 160, h: 24 },
    { x: 1700, y: 280, w: 140, h: 24 },
    { x: 2000, y: 380, w: 160, h: 24 },
    { x: 2400, y: 320, w: 140, h: 24 },
    { x: 2620, y: 420, w: 140, h: 24 },
    { x: 2900, y: 350, w: 160, h: 24 },
    { x: 3200, y: 440, w: 140, h: 24 },
    { x: 3450, y: 360, w: 160, h: 24 },
    { x: 3700, y: 300, w: 140, h: 24 }
  ];
  for (const f of floats) {
    level.platforms.push({ ...f, type: "float" });
  }

  // NPC giao nhiệm vụ ngay đầu đảo
  level.npcs.push(new QuestNPC(180, 512, index));

  // Sinh 5 lính canh rải đều khắp đảo
  const guardSpots = [600, 1300, 2050, 2700, 3500];
  for (const gx of guardSpots) {
    const e = new Enemy(gx, 500, {
      kind: "guard",
      hp: 70 + index * 30,        // dày máu hơn nhiều
      dmg: 14 + index * 5,        // gây sát thương cao hơn
      scoreReward: 60 + index * 20,
      goldReward: 6 + index * 2
    });
    level.enemies.push(e);
  }

  // Sinh 5 thú rừng - nhanh và hung dữ
  const beastSpots = [400, 980, 1600, 2300, 3300];
  for (let i = 0; i < beastSpots.length; i++) {
    const e = new Enemy(beastSpots[i], 500, {
      kind: "beast",
      theme: cfg.beastThemes[i % cfg.beastThemes.length],
      hp: 55 + index * 25,
      dmg: 12 + index * 4,
      w: 42, h: 42,
      scoreReward: 50 + index * 15,
      goldReward: 5 + index * 2
    });
    level.enemies.push(e);
  }

  // Sinh boss ở cuối đảo - mỗi đảo 1 boss khác nhau (xem BOSS_KINDS)
  const bk = BOSS_KINDS[cfg.bossKind] || {};
  const bossW = bk.w || 80, bossH = bk.h || 100;
  const boss = new Enemy(3850, 560 - bossH, {
    kind: "boss",
    boss: true,
    bossKind: cfg.bossKind,
    bossName: cfg.bossName,
    hp:  Math.round((450 + index * 200) * (bk.hpMul  || 1)),
    dmg: Math.round((24  + index * 7)   * (bk.dmgMul || 1)),
    w: bossW, h: bossH,
    scoreReward: 500 + index * 200,
    goldReward: 50 + index * 25
  });
  level.enemies.push(boss);
  level.boss = boss;

  // Tiền vàng - rải nhiều khắp đảo (>= 10)
  const coinSpots = [
    [350, 420], [380, 420], [410, 420],
    [580, 340], [610, 340], [640, 340],
    [800, 280], [830, 280],
    [1140, 380], [1180, 380], [1220, 380],
    [1490, 320], [1520, 320],
    [1740, 240], [1770, 240], [1800, 240],
    [2050, 340], [2080, 340],
    [2440, 280], [2470, 280],
    [2660, 380], [2940, 310], [2970, 310],
    [3240, 400], [3270, 400], [3490, 320], [3740, 260]
  ];
  for (const [cx, cy] of coinSpots) {
    level.items.push(new Item(cx, cy, "coin"));
  }

  // Trái ma thuật - ít, quý
  level.items.push(new Item(1750, 240, "fruit"));
  level.items.push(new Item(2950, 310, "fruit"));
  if (index >= 2) level.items.push(new Item(3500, 320, "fruit"));

  // Thuyền ở cuối đảo (xuất hiện sau khi giết boss)
  level.boats.push(new Boat(4050, 540));

  // Cây/đá trang trí
  for (let i = 0; i < 25; i++) {
    level.decorations.push({
      x: 60 + i * 165 + rand(-30, 30),
      y: 560,
      kind: cfg.decoration,
      size: rand(0.8, 1.2)
    });
  }

  return level;
}

// =============================================================================
// HELPERS NHIỆM VỤ - tạo state cho 1 đảo, update khi sự kiện xảy ra
// =============================================================================
function makeQuestState(islandIdx) {
  const cfg = ISLAND_CONFIGS[islandIdx];
  return cfg.quests.map(q => ({
    type: q.type,
    text: q.text,
    target: q.count,
    progress: 0,
    done: false
  }));
}

function updateQuests(quests, event) {
  // event = "kill_guard" | "kill_beast" | "kill_boss" | "collect_coin" | "collect_fruit"
  for (const q of quests) {
    if (q.done) continue;
    let inc = 0;
    if (q.type === "kill_guards"   && event === "kill_guard")    inc = 1;
    if (q.type === "kill_beasts"   && event === "kill_beast")    inc = 1;
    if (q.type === "kill_boss"     && event === "kill_boss")     inc = 1;
    if (q.type === "collect_coins" && event === "collect_coin")  inc = 1;
    if (q.type === "collect_fruit" && event === "collect_fruit") inc = 1;
    if (inc) {
      q.progress = Math.min(q.target, q.progress + inc);
      if (q.progress >= q.target) q.done = true;
    }
  }
}
function allQuestsDone(quests) {
  return quests.every(q => q.done);
}
