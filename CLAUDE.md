# CLAUDE.md — Hướng dẫn cho Claude / Codex / dev tương lai

Đây là **bản đồ điều hướng** của project Island Pirates. Đọc file này TRƯỚC khi
mở `index.html` để biết cần đọc đúng vùng dòng nào — tránh phải tải toàn bộ
~3300 dòng vào context.

---

## Cấu trúc thư mục

```
/Users/titanium/game-cua-Aki/
├── index.html          # game chính (1 file, ~3300 dòng)
├── src/                # các module đã tách (load qua <script> tags)
│   ├── audio.js        # Web Audio + BGM + SFX
│   └── leaderboard.js  # Firestore + cache + import/export JSON
├── game-design.md      # bản thiết kế chi tiết
├── CLAUDE.md           # file này
└── (firestore.rules)   # đã đặt trong Firebase Console
```

Module trong `src/` được load qua `<script src="src/...">` thông thường (không
phải ES module). Mọi function/biến trong các file này là **toàn cục** để code
chính trong `index.html` gọi được.

---

## Bản đồ `index.html` (~664 dòng — 13 module đã tách hết)

> Line numbers có thể lệch chút sau khi sửa - chạy `grep -n "^// [0-9]" index.html`
> để lấy ranh giới chính xác.

| Dòng (~) | Section | Tóm tắt |
|---|---|---|
| 1-32 | HEAD | CSS, Firebase compat SDK, `<script src="src/...">` (4 module) |
| 35-65 | Setup canvas + hằng số | `W`, `H`, `GRAVITY`, `JUMP_POWER`, `FRICTION` |
| 70-78 | **1+2+3) RENDER** | (đã tách → `src/render.js`) — chỉ comment trỏ tới module |
| 80-126 | **3.5) BẢNG SỨC MẠNH** | `POWERS` (5 trái + default), `POWER_ORDER`, `FRUIT_VI_NAMES` |
| 128-300 | **4) class Player** | physics, animation, takeDamage, fallIntoSea, acquireFruit |
| 302-347 | **5) class MagicOrb** | đạn phép thuật + gravity (cho parabol chuối) |
| 349-653 | **6) class Enemy** | guard / beast / boss; AI, attack pattern, draw dispatch theo `bossKind` |
| 655-743 | **7) class Item** | coin + fruit (gọi `player.acquireFruit`) |
| 745-794 | **8) class QuestNPC** | NPC giao nhiệm vụ (chấm than vàng) |
| 796-827 | **9) class Boat** | thuyền sang đảo (kèm cờ đầu lâu) |
| 829-834 | **9.5) BOSS** | (đã tách → `src/bosses.js`) — chỉ comment |
| 836-926 | **10) ISLAND_CONFIGS** | 5 đảo: tên, màu sắc, bossKind, themes, decorations, quests |
| 928-1060 | **11) buildIsland** | sinh platforms, enemies, items, NPCs, boats |
| 1062-1094 | **12) NHIỆM VỤ** | `makeQuestState`, `updateQuests`, `allQuestsDone` |
| 1096-1232 | **13) VẼ NỀN** | `drawBackground`, `drawPlatforms`, `drawDecorations` |
| 1233-1245 | **14) CAMERA** | `updateCamera` (lerp follow) |
| 1247-1333 | **15) ĐIỀU KHIỂN** | keydown/up + mouse handlers (digit 1-6, Q, E, B, L) |
| 1335-1472 | **16) GAME STATE** | `STATE` enum, `SHOP_ITEMS`, shop layout, `buyShopItem`, `startGame`, `showNotice` |
| 1474-1687 | **17) VÒNG LẶP UPDATE** | xử lý từng STATE, va chạm, attack, transitions |
| 1689-2394 | **18) HÀM VẼ** | render world, UI, panels |
| ↳ HUD, drawPowerBar | thanh sức mạnh + panel góc phải | |
| ↳ drawShop, drawShopIcon, drawQuestPanel | các overlay | |
| ↳ drawTitleScreen, drawNameInput | màn ngoài game | |
| ↳ drawGameOver, drawWin, drawLeaderboardPanel | màn kết thúc | |
| 2396-2406 | **19) VÒNG LẶP GAME** | `loop()` + `requestAnimationFrame` |

---

## Module đã tách (trong `src/`)

### `src/render.js` (220 dòng)
Tiện ích chung + particle + pixel art helpers. Toàn bộ "không phụ thuộc gameplay".
- Tiện ích: `rand`, `randi`, `choice`, `clamp`, `rectsHit`
- `drawText(text, x, y, size?, color?, outline?, align?)`
- Particle: `particles[]`, `spawnParticles`, `updateParticles`, `drawParticles`
- `drawPixelSprite(grid, palette, x, y, pixel, flip)`
- Sprite Hải tặc: `PIRATE_PALETTE`, `PIRATE_IDLE_1/2`, `PIRATE_RUN_1/2`, `PIRATE_JUMP`

### `src/audio.js` (107 dòng)
Hệ thống âm thanh sinh từ Web Audio API.
- `ensureAudio()` — gọi sau user gesture để khởi tạo AudioContext
- `playTone(freq, dur, opts)` — tone đơn lẻ với envelope
- SFX: `sfxJump`, `sfxShoot`, `sfxHitEnemy`, `sfxKillEnemy`, `sfxHurt`, `sfxCoin`,
  `sfxFruit`, `sfxSplash`, `sfxBossShoot`, `sfxWin`, `sfxGameOver`
- BGM: `startBGM()`, `stopBGM()`

### `src/leaderboard.js` (207 dòng)
Bảng xếp hạng — Firestore cloud + localStorage cache + xuất/nhập file.
- `loadLeaderboard()` — đọc từ cache (sync, không chờ network)
- `saveLeaderboard(list)` — ghi cache
- `addScoreToLeaderboard(name, score, islands, won)` — thêm điểm + push cloud
- `refreshLeaderboardFromCloud()` — kéo top 10 từ Firestore
- `exportLeaderboard()` — tải file JSON
- `importLeaderboard()` — chọn file JSON khôi phục
- Biến trạng thái: `cloudStatus` (loading/online/offline), `leaderboardCache`,
  `typedName`, `scoreSavedThisRound`, `lastSavedEntry`

### `src/bosses.js` (475 dòng)
5 boss đa dạng — mỗi đảo 1 boss khác hoàn toàn về hình + skill.
- `drawMonkeyKing`, `drawGiantScorpion`, `drawYeti`, `drawFireTiger`, `drawDarkKing`
- `bossSkillMonkey` (3 chuối parabol), `bossSkillScorpion` (5 đạn quạt),
  `bossSkillYeti` (8 đạn radial), `bossSkillTiger` (5 đạn + dash),
  `bossSkillDarkKing` (6 tỏa tròn + 2 nhanh)
- `BOSS_KINDS` — bảng tra cứu w/h/hpMul/dmgMul/cooldown/draw/skill

### `src/player.js` (183 dòng)
Class `Player` — hải tặc do người chơi điều khiển. Methods:
- `update(input, level)` — xử lý di chuyển, nhảy, va chạm, rơi biển
- `acquireFruit(fruit)` — thêm trái vào kho và đổi sang dùng
- `swordMultiplier()` — hệ số sát thương theo cấp kiếm [1, 1.2, 1.5, 2.0]
- `takeDamage(dmg)`, `fallIntoSea(level)`, `respawn(level)`
- `draw(camX, camY)` — vẽ sprite hải tặc theo state (idle/run/jump)

### `src/enemy.js` (318 dòng)
Class `Enemy` (lính canh / thú rừng / boss) + sprite data.
- Sprite: `GUARD_PALETTE`, `GUARD_BODY_1/2`, `BEAST_BODY_1/2`, `makeBeastPalette(theme)`
- AI: tuần tra → quay đầu ở mép → aggro khi thấy player → đuổi/nhảy/đánh
- Boss: dispatch tới `BOSS_KINDS[bossKind].draw/skill`
- Methods: `update(level, player)`, `takeDamage`, `_collide`, `draw`

### `src/items.js` (184 dòng)
Vật phẩm + NPC + thuyền — đều có animation bồng bềnh nhẹ.
- `class Item` — coin (+10💰 / +20 điểm) hoặc fruit (random 5 loại, gọi
  `player.acquireFruit`, hồi 25 hp + 200 điểm)
- `class QuestNPC` — đứng đầu đảo, dấu ! vàng nổi trên đầu, `inRange(player)`
- `class Boat` — đứng vào để sang đảo, có cờ hải tặc đầu lâu

### `src/orb.js` (57 dòng)
Class `MagicOrb` — đạn phép thuật cho cả player và enemy. Constructor nhận
vector hướng (dirX, dirY). Hỗ trợ gravity (cho đạn parabol như chuối).

### `src/levels.js` (270 dòng)
Cấu hình + sinh đảo + helpers nhiệm vụ.
- `ISLAND_CONFIGS` — mảng 5 đảo với màu, boss, themes, decoration, quests
- `buildIsland(idx)` — sinh platforms + 5 lính + 5 thú + boss + ~30 vàng + 1-3 trái + 1 thuyền + decorations
- `makeQuestState`, `updateQuests`, `allQuestsDone`

### `src/world.js` (163 dòng)
Vẽ thế giới + camera lerp.
- `drawBackground` — bầu trời gradient + mặt trời + mây + núi + biển + sóng
- `drawPlatforms` — đất chính (3 lớp) + bục lơ lửng
- `drawDecorations` — tree/cactus/pine/rock/cloud
- `camera`, `updateCamera(player, level)` — lerp 0.12 follow + clamp rìa

### `src/ui/hud.js` (209 dòng)
HUD trong game.
- `drawCrosshair` — vòng tròn ngắm theo chuột
- `drawPowerBar` — 6 ô sức mạnh trên giữa, ô đang dùng có gạch chân vàng
- `drawHUD` — panel góc phải (đảo, máu, mạng, điểm, vàng, sức mạnh, kiếm,
  nhiệm vụ) + thẻ tên người chơi góc trái + boss bar giữa + hint dưới đáy

### `src/ui/shop.js` (240 dòng)
Cửa hàng - mở/đóng bằng E.
- `SHOP_ITEMS` (12 món), `SHOP_LAYOUT`, `shopCardRect(idx)`
- `buyShopItem(item)` — mua, đổi miễn phí nếu đã có fruit
- `drawShopIcon`, `drawShop` — render lưới 3x4 thẻ phẳng

### `src/ui/screens.js` (269 dòng)
Các màn hình full-screen ngoài gameplay.
- `drawSpaceBackground` — nền sao + sóng dùng chung
- `drawLeaderboardPanel(x,y,w,h, highlight)` — top 10 + chỉ báo cloud
- `drawTitleScreen` — 2 cột (hướng dẫn + leaderboard)
- `drawNameInput` — ô nhập tên có con trỏ nhấp nháy
- `drawQuestPanel` — overlay khi mở bảng nhiệm vụ
- `drawGameOver`, `drawWin` — kèm leaderboard với entry vừa lập tô vàng

---

## Quy ước

### Section markers trong code
Mỗi section đánh dấu 3 dòng:
```js
// ===========================================================================
// N) TÊN SECTION ----------------------------------------------------------
// ===========================================================================
```
Grep nhanh tất cả: `grep -n "^// [0-9]" index.html`

### Comment
- Tất cả comment **bằng tiếng Việt**.
- Comment giải thích **WHY**, không phải WHAT (tên hàm/biến đã tự nói WHAT).

### Style
- Hàng tab = 2 spaces
- Single quotes cho string thường, template literal cho có biến
- Đặt tên biến: camelCase (JS), kebab-case (file)
- Class: PascalCase

---

## Patterns hay dùng

### Tạo enemy mới
1. Quyết kind: `"guard"` | `"beast"` | `"boss"`
2. Nếu boss: thêm vào `BOSS_KINDS` (line ~1548) + hàm vẽ + hàm skill
3. Nếu beast/guard: chỉ cần thay `theme`, `hp`, `dmg` trong `buildIsland`

### Thêm power mới
1. Thêm vào `POWERS` (line ~370)
2. Thêm vào `POWER_ORDER` array
3. Thêm tên VN vào `FRUIT_VI_NAMES`
4. Thêm thẻ vào `SHOP_ITEMS`

### Thêm field cho leaderboard entry
1. Sửa `addScoreToLeaderboard` trong `src/leaderboard.js`
2. Sửa Firestore Security Rules (Firebase Console)
3. Sửa `drawLeaderboardPanel` để hiển thị

### Đổi UI panel
- Tất cả panel theo design **flat**: nền solid + vạch nhấn 3-4px ở 1 cạnh
- Không dùng `strokeRect` viền 4 cạnh
- Palette: gold `#ffd24a`, success `#5dd968`, danger `#ff5a5a`, info `#5dccff`,
  surface `rgba(14,22,48,0.78-0.92)`, muted `#a8b6cc`

---

## Khi sửa code

### Test
1. **Cú pháp**: `node -e "..."` parse JS (xem session log)
2. **Thủ công**: chạy `python3 -m http.server 8000` rồi mở `localhost:8000`
3. Chơi qua từng đảo, mở shop, nhặt trái, click leaderboard

### Deploy
- Push lên `main` branch → tự deploy lên `aki.tuantitan.com`
- Repo: `https://github.com/TuanTITAN85/Aki`

### Firebase
- Project: `island-pirates`
- Region: `asia-southeast1`
- Collection: `leaderboard`
- Console: https://console.firebase.google.com/project/island-pirates

---

## Tiết kiệm token khi nhờ AI

Thay vì `Read index.html` (~3300 dòng), dùng:
- `Read index.html offset=1124 limit=60` — đọc đúng `drawMonkeyKing`
- `Read src/audio.js` — module nhỏ, đọc trọn
- `grep -n "function drawShop"` để tìm điểm bắt đầu rồi `Read offset=...`

Dùng `Edit` thay vì `Write` cho file lớn — diff thay vì toàn nội dung.

---

## Lộ trình refactor (TODO)

Tách dần theo từng lần làm việc — KHÔNG nên tách đồng loạt:

- [x] `src/audio.js` — Web Audio + SFX + BGM (107 dòng)
- [x] `src/leaderboard.js` — Firestore + cache + import/export (207 dòng)
- [x] `src/render.js` — drawText, particle, pixel sprite, PIRATE_* (220 dòng)
- [x] `src/bosses.js` — 5 boss draw + skill + BOSS_KINDS (475 dòng)
- [x] `src/player.js` — class Player (183 dòng)
- [x] `src/enemy.js` — class Enemy + sprite GUARD_*/BEAST_* (318 dòng)
- [x] `src/items.js` — Item, QuestNPC, Boat (184 dòng)
- [x] `src/orb.js` — class MagicOrb (57 dòng)
- [x] `src/levels.js` — ISLAND_CONFIGS + buildIsland + quest helpers (270 dòng)
- [x] `src/world.js` — drawBackground/Platforms/Decorations + camera (163 dòng)
- [x] `src/ui/hud.js` — drawHUD, drawPowerBar, drawCrosshair (209 dòng)
- [x] `src/ui/shop.js` — SHOP_ITEMS, buyShopItem, drawShop (240 dòng)
- [x] `src/ui/screens.js` — title/nameInput/quest/gameover/win (269 dòng)

🎉 **Tất cả 13 module đã tách xong.** `index.html` giảm từ ~3.300 → 664
dòng (-80%). Phần còn lại chủ yếu là: HEAD, canvas setup, hằng số vật lý,
POWERS table, input handlers, STATE, startGame/loadIsland/showNotice/commitScore,
update() loop, draw() loop chính, vòng lặp `loop()`.
