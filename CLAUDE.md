# CLAUDE.md — Hướng dẫn cho Claude / Codex / dev tương lai

Đây là **bản đồ điều hướng** của project Island Pirates. Đọc file này TRƯỚC khi
mở code — biết cần mở đúng module nào thay vì tải toàn bộ ~3.700 dòng (chia cho
14 file).

---

## Cấu trúc thư mục

```
/Users/titanium/game-cua-Aki/
├── index.html               # 664 dòng - glue code (state, input, main loop)
├── src/
│   ├── render.js            # 220 - drawText, particle, pixel sprite, PIRATE_*
│   ├── audio.js             # 107 - Web Audio + 11 SFX + BGM loop
│   ├── leaderboard.js       # 207 - Firestore + cache + xuất/nhập JSON
│   ├── orb.js               #  57 - class MagicOrb (đạn phép)
│   ├── companion.js         # ~150 - class CompanionDog + sprite + AI
│   ├── bosses.js            # 475 - 5 boss draw + skill + BOSS_KINDS
│   ├── player.js            # 183 - class Player
│   ├── enemy.js             # 318 - class Enemy + sprite GUARD/BEAST
│   ├── items.js             # 184 - Item, QuestNPC, Boat
│   ├── levels.js            # 270 - ISLAND_CONFIGS + buildIsland + quests
│   ├── world.js             # 163 - drawBackground/Platforms/Decorations + camera
│   └── ui/
│       ├── hud.js           # 209 - drawHUD, drawPowerBar, drawCrosshair
│       ├── shop.js          # 240 - SHOP_ITEMS, buyShopItem, drawShop
│       └── screens.js       # 269 - title/nameInput/quest/gameover/win
├── game-design.md           # bản thiết kế chi tiết
├── CLAUDE.md                # file này
├── .gitignore
└── (firestore.rules)        # đã đặt trong Firebase Console
```

Module trong `src/` được load qua `<script src="src/...">` thông thường (KHÔNG
phải ES module). Mọi function/biến trong các file này là **toàn cục** để code
chính trong `index.html` gọi được. Thứ tự load: `render → audio → leaderboard
→ orb → bosses → player → enemy → items → levels → world → ui/hud → ui/shop
→ ui/screens` rồi cuối cùng inline `<script>` của index.html.

> ⚠️ Vì có nhiều file `src/*.js` riêng, **không double-click `index.html`** để
> chạy game (Chrome chặn `file://` load same-directory script). Phải dùng HTTP
> server local: `python3 -m http.server` rồi mở `http://localhost:8000`.

---

## Bản đồ `index.html` (664 dòng — chỉ còn glue code)

> Line numbers có thể lệch chút sau khi sửa - chạy `grep -n "^// [0-9]" index.html`
> để lấy ranh giới chính xác.

| Dòng (~) | Section | Tóm tắt |
|---|---|---|
| 1-47 | HEAD | CSS, Firebase compat SDK, **13** thẻ `<script src="src/...">` |
| 53-76 | Setup canvas + hằng số | `canvas`, `ctx`, `W`, `H`, `GRAVITY`, `JUMP_POWER`, `FRICTION`, `AIR_DRAG`, `MOVE_SPEED` |
| 78-86 | **1+2+3) RENDER** | (comment trỏ tới `src/render.js`) |
| 89-134 | **3.5) BẢNG SỨC MẠNH** | `POWERS` (5 trái + default), `FRUIT_VI_NAMES`, `POWER_ORDER` |
| 136-175 | **4-14) Comment trỏ tới module** | Player/Orb/Enemy/Item/Boss/Levels/World đã tách |
| 178-264 | **15) ĐIỀU KHIỂN** | keydown/up + mouse handlers (gồm digit 1-6, Q, E, B, L, name input) |
| 266-333 | **16) GAME STATE** | `STATE` enum, biến game state, `startGame`, `loadIsland`, `showNotice`, `commitScore` |
| 335-548 | **17) VÒNG LẶP UPDATE** | `update()` — dispatch từng STATE, va chạm, attack, transitions |
| 550-652 | **18) HÀM VẼ chính** | `draw()` — gọi tới các module draw* |
| 654-664 | **19) loop()** | `requestAnimationFrame` đệ quy |

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

### `src/companion.js` (~150 dòng)
Class `CompanionDog` — chú Cún Golden Retriever đồng hành.
- Sprite: `DOG_PALETTE` + 6 frame (idle ×2, walk ×2, attack ×2) pixel art 14×10
- AI: tìm enemy gần nhất trong `DOG_RANGE=300px`, chạy tới cắn (`DOG_DAMAGE=20`)
- Khi không có địch: lerp về bên cạnh player
- Bất tử, platform collision, tên hiển thị phía trên sprite
- Mua từ shop (200 vàng), đặt tên khi mua, reset khi Game Over

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

## Quy ước sửa code (QUAN TRỌNG)

### Surgery edit — KHÔNG rewrite cả file

Khi sửa code, **luôn dùng `Edit` (chỉnh cục bộ) thay vì `Write` (ghi đè cả
file)**. Lý do:

- File lớn (`bosses.js` 475 dòng, `enemy.js` 318 dòng…) — viết lại toàn bộ tốn
  rất nhiều token và dễ thay đổi vô tình các đoạn không liên quan.
- Diff trong git rõ hơn — review chỉ thấy đúng phần đã sửa.
- Giữ formatting / comment / blank lines của vùng xung quanh nguyên vẹn.

**Quy tắc cụ thể:**

1. **Mặc định luôn dùng `Edit`** — old_string bao đúng đoạn cần thay, new_string
   chứa nội dung mới. Bao quanh đủ context để old_string là duy nhất, không
   nhiều hơn.
2. **Chỉ dùng `Write`** khi:
   - Tạo file mới (chưa tồn tại)
   - User yêu cầu rõ "viết lại từ đầu" / "rewrite file X"
3. **Nhiều thay đổi nhỏ trong cùng file** → nhiều `Edit` liên tiếp, mỗi cái
   sửa 1 chỗ. Không gộp thành 1 `Write` tổng.
4. **Sửa pattern lặp ở nhiều chỗ** → dùng `Edit` với `replace_all: true` hoặc
   nhiều `Edit` riêng. Tránh viết lại file để đổi tên 1 biến.
5. **Refactor lớn (di chuyển khối code đi nơi khác)** → vẫn ưu tiên `Edit` cắt
   ở chỗ cũ + `Edit` chèn ở chỗ mới. Hoặc dùng `python` regex thay thế khối
   (như đã làm khi tách module) cho diff sạch.
6. **Đọc trước khi sửa** — nếu chưa biết exact text, dùng `Read` với
   `offset/limit` để xem đúng đoạn rồi mới `Edit`. Đừng đoán nội dung cũ.

Nếu lỡ định `Write` 1 file đã tồn tại — dừng lại, mở nó bằng `Read` rồi
chuyển sang `Edit`.

---

## Quy ước khác

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

### Thêm companion / pet đồng hành
1. Tạo `src/companion.js` — class với sprite pixel art (6 frame: idle×2, walk×2, attack×2)
2. AI trong `update(level, player)`: tìm enemy gần nhất trong `DOG_RANGE=300`, đuổi theo và cắn khi tới gần. Không có enemy → lerp về bên cạnh player.
3. Thêm `companionDog` variable + `STATE.DOG_NAME` trong `index.html`
4. Thêm `<script src="src/companion.js">` sau `player.js` trong HTML
5. Thêm shop item có `kind:"companion"` vào `SHOP_ITEMS`
6. Trong `buyShopItem`: transition sang `STATE.DOG_NAME` để nhập tên Cún
7. Keydown handler cho `STATE.DOG_NAME`: Enter tạo `CompanionDog`, ESC refund vàng qua `pendingDogPrice`
8. Trong `update()`: `if (companionDog) companionDog.update(level, player)`
9. Trong `draw()`: `if (companionDog) companionDog.draw(camera.x, camera.y)` + `drawDogNamePanel()`
10. `startGame()`: reset `companionDog = null`

### Sửa cửa hàng (tab-based layout)
Shop dùng layout tuyệt đối canvas (SHOP_LAYOUT) chia 4 tab: `hp`, `fruit`, `sword`, `companion`.
- Mỗi zone có Y cố định: title=50, gold=68, tabBar=88, cards bắt đầu=148, footer=664
- Click handler gọi `shopTabAt(x, y)` trả tab id hoặc null
- Keydown: ESC/←/→ xử lý **trực tiếp trong keydown** với `e.preventDefault()` + `return` (không polling `input` flag trong `update()`)
- `buyShopItem` dispatch theo `item.kind`: heal/fruit/sword/companion

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

Code đã chia thành 14 module ~50-475 dòng/file. Cần sửa ở đâu thì đọc đúng file:

- Sửa boss Yeti → `Read src/bosses.js` (475 dòng - hoặc dùng offset/limit)
- Sửa âm thanh → `Read src/audio.js` (107 dòng)
- Sửa shop → `Read src/ui/shop.js` (367 dòng — layout tab-based)
- Sửa AI quái → `Read src/enemy.js` (318 dòng)
- Sửa logic chính (state, update loop) → `Read index.html` (664 dòng)

Dùng `grep -rn "tên hàm" src/ index.html` để định vị nhanh trước khi đọc.

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
- [x] `src/companion.js` — class CompanionDog + sprite + AI (260 dòng)
- [x] `src/levels.js` — ISLAND_CONFIGS + buildIsland + quest helpers (270 dòng)
- [x] `src/world.js` — drawBackground/Platforms/Decorations + camera (163 dòng)
- [x] `src/ui/hud.js` — drawHUD, drawPowerBar, drawCrosshair (209 dòng)
- [x] `src/ui/shop.js` — SHOP_ITEMS, buyShopItem, drawShop (367 dòng — layout tab-based)
- [x] `src/ui/screens.js` — title/nameInput/quest/gameover/win (269 dòng)

🎉 **Tất cả 14 module đã tách xong.** `index.html` giảm từ ~3.300 → 664
dòng (-80%). Phần còn lại chủ yếu là: HEAD, canvas setup, hằng số vật lý,
POWERS table, input handlers, STATE, startGame/loadIsland/showNotice/commitScore,
update() loop, draw() loop chính, vòng lặp `loop()`.
