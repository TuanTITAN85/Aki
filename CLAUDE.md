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

## Bản đồ `index.html`

| Dòng | Section | Tóm tắt |
|---|---|---|
| 1-29 | HEAD | CSS, Firebase compat SDK |
| 32-56 | Setup canvas + hằng số vật lý | `W`, `H`, `GRAVITY`, `MOVE_SPEED`, `JUMP_POWER` |
| 63-87 | **1) TIỆN ÍCH** | `rand`, `clamp`, `rectsHit`, `drawText` |
| 89-186 | **1.5) ÂM THANH** | (đã tách → `src/audio.js`) `playTone`, `sfxJump`, BGM |
| 188-239 | **2) HẠT (Particle)** | `spawnParticles`, `updateParticles`, `drawParticles` |
| 241-366 | **3) PIXEL ART HELPERS** | `drawPixelSprite` + sprite data (PIRATE_*, GUARD_*, BEAST_*) |
| 368-414 | **3.5) BẢNG SỨC MẠNH** | `POWERS` (5 trái + default), `POWER_ORDER`, `FRUIT_VI_NAMES` |
| 416-588 | **4) class Player** | physics, animation, takeDamage, fallIntoSea, acquireFruit |
| 590-635 | **5) class MagicOrb** | đạn phép thuật + gravity (cho parabol chuối) |
| 637-941 | **6) class Enemy** | guard / beast / boss; AI, attack pattern, draw dispatch theo `bossKind` |
| 943-1031 | **7) class Item** | coin + fruit (gọi `player.acquireFruit`) |
| 1033-1082 | **8) class QuestNPC** | NPC giao nhiệm vụ (chấm than vàng) |
| 1084-1115 | **9) class Boat** | thuyền sang đảo (kèm cờ đầu lâu) |
| 1117-1565 | **9.5) BOSS** | 5 hàm vẽ + 5 hàm skill + bảng `BOSS_KINDS` |
| ↳ 1124-1180 | `drawMonkeyKing` | Vua Khỉ Đỏ |
| ↳ 1183-1238 | `drawGiantScorpion` | Bọ Cạp Khổng Lồ |
| ↳ 1241-1300 | `drawYeti` | Người Tuyết |
| ↳ 1303-1395 | `drawFireTiger` | Hổ Lửa |
| ↳ 1398-1465 | `drawDarkKing` | Vua Hải Tặc Đen |
| ↳ 1470-1545 | `bossSkill*` | 5 hàm skill riêng |
| ↳ 1548-1565 | `BOSS_KINDS` | bảng tra cứu kích thước/HP/dame/cooldown |
| 1568-1658 | **10) ISLAND_CONFIGS** | 5 đảo: tên, màu sắc, boss, themes, decorations, quests |
| 1660-1792 | **11) buildIsland** | sinh platforms, enemies, items, NPCs, boats |
| 1794-1826 | **12) NHIỆM VỤ** | `makeQuestState`, `updateQuests`, `allQuestsDone` |
| 1828-1964 | **13) VẼ NỀN** | `drawBackground`, `drawPlatforms`, `drawDecorations` |
| 1966-1978 | **14) CAMERA** | `updateCamera` (lerp follow) |
| 1980-2066 | **15) ĐIỀU KHIỂN** | keydown/up + mouse handlers (gồm digit 1-6, Q, E, B, L) |
| 2068-2380 | **16) GAME STATE + LEADERBOARD** | (đã tách phần leaderboard → `src/leaderboard.js`) |
| ↳ 2068-2080 | `STATE` enum | TITLE, NAME_INPUT, PLAYING, QUEST, SHOP, WIN, GAMEOVER |
| ↳ 2083-2270 | leaderboard code (cũ, đã tách) | xem `src/leaderboard.js` |
| ↳ 2273-2310 | `exportLeaderboard / importLeaderboard` | (đã tách) |
| ↳ 2313-2378 | `startGame`, `loadIsland`, `showNotice` | |
| 2378-2591 | **17) VÒNG LẶP UPDATE** | xử lý từng STATE, va chạm, attack, transitions |
| 2593-3298 | **18) HÀM VẼ** | render world, UI, panels |
| ↳ 2680-2800 | `drawHUD` | panel góc phải + power bar + boss bar |
| ↳ 2820-2925 | `drawPowerBar` | thanh sức mạnh trên cùng |
| ↳ 2937-2975 | `drawShopIcon` | icon từng loại hàng |
| ↳ 2978-3035 | `drawShop` | cửa hàng 12 thẻ |
| ↳ 3036-3060 | `drawCrosshair`, `drawShop` overlay | |
| ↳ 3037-3160 | `drawQuestPanel` | bảng nhiệm vụ |
| ↳ 3163-3210 | `drawTitleScreen` | màn hình tiêu đề |
| ↳ 3212-3260 | `drawNameInput` | nhập tên hải tặc |
| ↳ 3270-3296 | `drawGameOver` + `drawWin` | |
| 3300-3309 | **19) VÒNG LẶP GAME** | `loop()` + `requestAnimationFrame` |

---

## Module đã tách (trong `src/`)

### `src/audio.js`
Hệ thống âm thanh sinh từ Web Audio API. Export ra biến toàn cục:
- `ensureAudio()` — gọi sau user gesture để khởi tạo AudioContext
- `playTone(freq, dur, opts)` — tone đơn lẻ với envelope
- SFX: `sfxJump`, `sfxShoot`, `sfxHitEnemy`, `sfxKillEnemy`, `sfxHurt`, `sfxCoin`,
  `sfxFruit`, `sfxSplash`, `sfxBossShoot`, `sfxWin`, `sfxGameOver`
- BGM: `startBGM()`, `stopBGM()`

### `src/leaderboard.js`
Bảng xếp hạng — Firestore cloud + localStorage cache + xuất/nhập file. Export:
- `loadLeaderboard()` — đọc từ cache (sync, không chờ network)
- `saveLeaderboard(list)` — ghi cache
- `addScoreToLeaderboard(name, score, islands, won)` — thêm điểm + push cloud
- `refreshLeaderboardFromCloud()` — kéo top 10 từ Firestore
- `exportLeaderboard()` — tải file JSON
- `importLeaderboard()` — chọn file JSON khôi phục
- Biến trạng thái: `cloudStatus` (loading/online/offline)

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

- [x] `src/audio.js` — đã tách
- [x] `src/leaderboard.js` — đã tách
- [ ] `src/render.js` — `drawText`, `drawPixelSprite`, particle
- [ ] `src/player.js` — class Player (~170 dòng)
- [ ] `src/enemy.js` — class Enemy (~300 dòng)
- [ ] `src/bosses/` — 5 boss draw + skill (1 file mỗi boss)
- [ ] `src/levels.js` — ISLAND_CONFIGS + buildIsland
- [ ] `src/ui/` — drawHUD, drawShop, drawTitleScreen, ...

Sau khi tách hết, `index.html` chỉ còn ~30 dòng wrapper + main.js (~50 dòng).
