# 🏴‍☠️ BẢN THIẾT KẾ GAME — ISLAND PIRATES

**Thể loại:** Game đi cảnh (Platformer) 2D
**Nền tảng:** Trình duyệt web (HTML + Canvas + JavaScript thuần)
**Công nghệ phụ trợ:** Firebase Firestore (bảng xếp hạng chung)
**Đối tượng:** Học sinh tiểu học
**Ngôn ngữ giao diện:** Tiếng Việt

---

## 1. 🎮 Tên Game
**Island Pirates — Hải Tặc Đảo**

---

## 2. 🧑‍✈️ Nhân Vật Chính
Một **hải tặc nhỏ tuổi** đội mũ đỏ, mặc áo xanh, có siêu năng lực **"Khống Chế Từ Xa"** — bắn ra quả cầu phép thuật hướng theo con trỏ chuột mà không cần chạm tay vào kẻ thù.

- Người chơi tự đặt **tên hải tặc** ở màn hình bắt đầu (tối đa 14 ký tự, có hỗ trợ tiếng Việt có dấu).
- Có **3 mạng** ban đầu, máu tối đa **100**.
- Khi bị đánh hết máu sẽ mất 1 mạng và hồi sinh tại điểm bắt đầu đảo.
- Khi rơi xuống biển sẽ **mất ngay 1 mạng**, hồi sinh đầy máu (nếu còn mạng).
- Hết mạng → màn hình thua, điểm số được lưu vào bảng xếp hạng.

---

## 3. 👹 Kẻ Thù

### 3.1 Lính canh
- Mỗi đảo có **5 lính canh** mặc đồng phục đen-đỏ.
- Tuần tra trong khu vực. Khi thấy người chơi sẽ đuổi theo và đánh.
- Tự quay đầu khi đi tới mép platform (không tự rơi).
- Càng đảo về sau càng máu dày và sát thương cao (HP 70 → 190, dame 14 → 34).

### 3.2 Thú rừng
- Mỗi đảo có **5 thú rừng** với chủng loại khác nhau theo chủ đề đảo (rắn, hổ, sói, gấu, khỉ, bọ cạp, yeti…).
- Tốc độ nhanh hơn lính canh, nhảy nhiều hơn.
- Sát thương trung bình, phù hợp với độ khó tăng dần.

### 3.3 Boss — mỗi đảo 1 boss riêng biệt

| Đảo | Boss | Hình dạng | Kỹ năng đặc biệt |
|---|---|---|---|
| 1 | **Vua Khỉ Đỏ** | Khỉ nâu mặc áo choàng đỏ, đội vương miện vàng đính ngọc đỏ, cầm chuối | Ném **3 quả chuối parabol** có trọng lực, bay vòng cung |
| 2 | **Bọ Cạp Khổng Lồ** | Bọ cạp tím sẫm, 2 càng pince, đuôi cong có gai độc, 4 mắt đỏ | Bắn **5 đạn độc xanh hình quạt** rất nhanh |
| 3 | **Người Tuyết Khổng Lồ** | Yeti trắng to lớn, sừng băng, răng nanh sắc | **Tỏa 8 đạn băng ra mọi hướng** (radial - khó né) |
| 4 | **Hổ Lửa** | Hổ cam có sọc đen, hào quang lửa rực, mắt vàng | Phun **5 quả lửa hẹp** kèm **lao tới (dash)** |
| 5 | **Vua Hải Tặc Đen** | Người mặc áo choàng đen viền vàng, mũ ba góc đầu lâu, mắt đỏ phát sáng, cầm kiếm bạc | **6 đạn tím tỏa tròn + 2 đạn trắng nhanh** đuổi theo |

Boss có máu rất dày (450 → 1.250 HP) và sát thương cao. Đảo cuối có **Vua Hải Tặc Đen** mạnh nhất (HP × 1.5, sát thương × 1.2).

---

## 4. 🍎 Vật Phẩm Thu Thập

### 4.1 Tiền vàng 💰
- Hình tròn vàng có chữ `$`, lơ lửng và bồng bềnh nhẹ.
- Mỗi đồng = **+10 vàng + 20 điểm**.
- Mỗi đảo có **15-20 đồng** rải khắp các bục cao thấp.
- Vàng dùng để **mua hàng trong cửa hàng** (xem mục 6).

### 4.2 Trái Ác Quỷ 🍎
- Quả cầu màu rực rỡ có cuống xanh, nhặt được sẽ cho **sức mạnh mới**.
- Mỗi đảo có **1-3 trái** giấu ở vị trí khó.
- Người chơi **giữ tất cả các trái đã có**, không bị mất trái cũ khi nhặt trái mới.
- Có thể **đổi qua lại** giữa các trái bằng phím **1-6** hoặc **Q**.

| Trái | Sát thương | Số đạn | Ghi chú |
|---|---|---|---|
| Phép Cơ Bản (mặc định) | 25 | 1 | Có sẵn từ đầu |
| **Trái Rồng** 🐉 | 60 | 1 | Đạn to, sát thương cao, cooldown lâu |
| **Trái Lửa** 🔥 | 32 | 1 | Bắn nhanh, vừa |
| **Trái Băng** ❄️ | 22 | **2** | Bắn 2 viên cùng lúc |
| **Trái Sét** ⚡ | 85 | 1 | Sát thương cực mạnh, cooldown rất lâu |
| **Trái Gió** 🌪 | 16 | **3** | Bắn 3 viên hình quạt, cực nhanh |

---

## 5. ⚔️ Hệ Thống Kiếm

Người chơi có thể mua kiếm từ cửa hàng để **nhân sát thương** của mọi loại đạn.

| Cấp | Tên | Hệ số sát thương |
|---|---|---|
| 0 | (chưa có) | × 1.0 |
| 1 | **Kiếm Đồng** | × 1.2 |
| 2 | **Kiếm Bạc** | × 1.5 |
| 3 | **Kiếm Vàng** | × 2.0 |

Kiếm chỉ nâng cấp tăng dần, không thể mua kiếm cấp thấp hơn cấp đang có.

Ví dụ: Trái Sét (85 dame) + Kiếm Vàng (×2.0) = **170 sát thương / đạn**.

---

## 6. 🏪 Cửa Hàng Hải Tặc

Bấm phím **E** để mở/đóng cửa hàng (có thể mở mọi lúc khi đang chơi).

12 mặt hàng chia 4 nhóm:

### Hồi máu / mạng
- **Bình Máu Nhỏ** — 20 vàng, hồi 30 máu
- **Bình Máu Lớn** — 50 vàng, hồi đầy máu
- **Tăng Máu Tối Đa** — 120 vàng, +20 HP tối đa
- **Mạng Sống Thêm** — 300 vàng, +1 mạng

### Trái Ác Quỷ
- **Trái Lửa** — 80 vàng
- **Trái Băng** — 120 vàng
- **Trái Gió** — 150 vàng
- **Trái Rồng** — 220 vàng
- **Trái Sét** — 320 vàng

→ Nếu đã sở hữu, bấm vào thẻ để **đổi qua dùng miễn phí**.

### Kiếm
- **Kiếm Đồng** — 150 vàng
- **Kiếm Bạc** — 380 vàng
- **Kiếm Vàng** — 800 vàng

---

## 7. 📜 Nhiệm Vụ

Mỗi đảo có **2-3 nhiệm vụ** do **NPC** (người dân áo xanh có dấu chấm than vàng) ở đầu đảo giao. Bấm **Enter** khi đứng gần NPC để xem bảng nhiệm vụ.

Các loại nhiệm vụ:
- **Đánh bại N lính canh** trên đảo
- **Đánh bại N thú rừng**
- **Thu thập N tiền vàng**
- **Tìm trái ma thuật bí mật**
- **Đánh bại Boss đảo**

Khi hoàn thành **TẤT CẢ** nhiệm vụ, người chơi có thể đến **chiếc thuyền** ở cuối đảo để sang đảo tiếp theo. Nếu chưa xong sẽ có thông báo nhắc.

---

## 8. 🌊 Bối Cảnh — 5 Hòn Đảo

Mỗi đảo dài khoảng 4.200 pixel, có nền đất + nhiều bục lơ lửng để nhảy. Camera tự động đuổi theo nhân vật.

| Đảo | Tên | Chủ đề | Trang trí | Boss |
|---|---|---|---|---|
| 1 | **Đảo Cỏ Xanh** | Đảo nhiệt đới xanh | Cây dừa | Vua Khỉ Đỏ |
| 2 | **Đảo Sa Mạc Vàng** | Sa mạc cát nóng | Xương rồng | Bọ Cạp Khổng Lồ |
| 3 | **Đảo Tuyết Trắng** | Núi tuyết lạnh | Cây thông phủ tuyết | Người Tuyết Khổng Lồ |
| 4 | **Đảo Núi Lửa** | Đá đỏ + dung nham | Tảng đá nham thạch | Hổ Lửa |
| 5 | **Đảo Trời Mây** | Trời hồng tím cuối game | Mây bồng bềnh | Vua Hải Tặc Đen |

Mỗi đảo có **chủ đề màu sắc riêng** (bầu trời, đất, biển), **núi xa parallax**, **mây trôi**, sóng biển nhấp nhô.

Sau khi đánh bại Vua Hải Tặc Đen ở đảo 5 → **Chiến Thắng**!

---

## 9. 🏆 Cách Thắng / Tính Điểm

- Đánh quái và lính → tăng điểm + nhận vàng
- Hoàn thành nhiệm vụ → đi sang đảo mới (+1.000 điểm thưởng)
- Đánh bại 5 boss của 5 đảo → **THẮNG GAME**
- Chết → mất mạng. Hết mạng → **GAME OVER**

Điểm cuối cùng được lưu vào **bảng xếp hạng**, lần thắng có dấu **⭐**.

---

## 10. 📊 Bảng Xếp Hạng (Cloud)

Lưu trữ bằng **Firebase Firestore** → tất cả người chơi trên `aki.tuantitan.com` cùng dùng chung một bảng top 10.

- Mỗi mục lưu: tên, điểm, số đảo qua được, có thắng game không, ngày chơi
- Sắp theo điểm giảm dần
- **Đồng bộ tự động**: kéo bản mới mỗi 30 giây ở màn hình tiêu đề
- **Cache cục bộ** (localStorage) làm backup khi mất Internet
- Chỉ báo trạng thái: `● Đã kết nối Internet` / `○ Đang đồng bộ` / `× Mất kết nối`

### Backup file
Ở màn hình tiêu đề:
- **B** → tải bảng xếp hạng về file `island_pirates_leaderboard.json`
- **L** → chọn file JSON đã backup → khôi phục bảng

---

## 11. 🎮 Điều Khiển

### Khi đang chơi
| Phím | Tác dụng |
|---|---|
| ← → | Đi trái / phải |
| ↑ hoặc Space | Nhảy |
| Chuột trái | Bắn phép (Khống Chế Từ Xa) |
| **1, 2, 3, 4, 5, 6** | Chọn trực tiếp trái ác quỷ tương ứng (nếu đã sở hữu) |
| **Q** | Xoay vòng qua các trái đang có |
| **E** | Mở / đóng Cửa Hàng |
| **Enter** | Mở bảng nhiệm vụ (khi đứng gần NPC) |

### Khi đang ở các màn hình khác
| Phím | Tác dụng |
|---|---|
| Enter | Xác nhận / bắt đầu / về màn hình tiêu đề |
| ESC | Đóng cửa hàng / bảng nhiệm vụ / quay lại |
| **B** (chỉ ở Title) | Xuất bảng xếp hạng ra file |
| **L** (chỉ ở Title) | Nhập bảng xếp hạng từ file |
| Backspace (khi nhập tên) | Xoá ký tự |

---

## 12. 🖥️ Giao Diện (UI/UX)

### Khi đang chơi
- **Góc trên trái**: tên hải tặc của người chơi
- **Trên cùng giữa**: thanh sức mạnh 6 ô (Phép Cơ Bản + 5 trái), ô đang dùng tô vàng
- **Trên cùng giữa (khi gặp boss)**: thanh máu boss có tên
- **Góc trên phải**: bảng thông tin với tên đảo, máu, mạng (trái tim), điểm, vàng, sức mạnh, kiếm, tiến độ nhiệm vụ
- **Giữa màn hình**: thông báo nổi (khi nhặt vật phẩm, đổi sức mạnh, mua hàng…)
- **Góc dưới trái**: hướng dẫn phím tắt cơ bản

### Các màn hình
- **Tiêu đề**: tên game, hướng dẫn chơi (trái), bảng xếp hạng top 10 (phải)
- **Nhập tên**: ô nhập có con trỏ nhấp nháy
- **Cửa Hàng**: 3 cột × 4 hàng thẻ hàng có icon, mô tả, giá
- **Bảng Nhiệm Vụ**: hộp thoại với danh sách nhiệm vụ + tiến độ + mẹo
- **Game Over / Chiến Thắng**: điểm, bảng xếp hạng (dòng vừa lập tô vàng nổi bật)

---

## 13. 🎨 Đồ Hoạ

- **Phong cách pixel art hiện đại**, màu sắc tươi sáng, gợi nhớ game Blox Fruit
- Nhân vật và quái được vẽ bằng **ma trận chữ + bảng màu** (mỗi ký tự = 1 màu)
- 5 boss được vẽ bằng các hình primitives (rect, arc) để mỗi con có hình dạng độc nhất
- **Animation 2 khung hình** mượt cho idle, run, jump
- **Hiệu ứng hạt (particle)** cho:
  - Bụi khi nhảy
  - Sao khi nhặt vàng / trái cây
  - Vụ nổ khi đánh trúng / giết quái
  - Nước văng khi rơi xuống biển
  - Pháo hoa khi thắng game
  - Hào quang quanh boss
- **Camera follow** mượt (lerp 0.12) với clamp ở rìa đảo

---

## 14. 🎵 Âm Thanh

Sinh hoàn toàn từ **Web Audio API** (oscillator), không dùng file âm thanh ngoài.

### Nhạc nền (BGM)
- Melody 16 nốt giai điệu La thứ + bass, lặp vô tận
- Bật khi vào game, tắt khi gameover/win

### Hiệu ứng âm thanh (SFX)
- Nhảy, bắn đạn, trúng địch, giết địch
- Bị thương, rơi xuống biển (splash)
- Nhặt vàng (2 nốt cao), nhặt trái cây (cung 4 nốt đi lên)
- Boss bắn (rung trầm)
- Thắng đảo (cung 5 nốt thăng), Game Over (cung 4 nốt giảm)

---

## 15. 🛠️ Công Nghệ & Kiến Trúc

- **Frontend**: HTML + CSS + JavaScript thuần (không thư viện game)
- **Đồ hoạ**: HTML Canvas 2D API
- **Âm thanh**: Web Audio API (oscillator + envelope, không dùng file mp3/wav)
- **Lưu trữ cục bộ**: `localStorage` (cache bảng xếp hạng cho lúc offline)
- **Backend**: **Firebase Firestore** — collection `leaderboard`
  - SDK: compat (CDN từ `gstatic.com`)
  - Region: `asia-southeast1`
  - Security Rules: đọc công khai, ghi có validate (tên 1-20 ký tự, điểm 0-1.000.000, đảo 0-5, có đủ trường), cấm sửa/xoá
- **Hosting**: triển khai tĩnh tại `aki.tuantitan.com`
- **Quản lý mã nguồn**: Git + GitHub (`https://github.com/TuanTITAN85/Aki`)

### Kiến trúc file (sau refactor)

Code tách thành **13 module** trong thư mục `src/`, load qua `<script src>`
thông thường (không phải ES module — để giữ cú pháp `class`/`function` tự
nhiên, không cần build tool):

| Tầng | Module | Dòng | Vai trò |
|---|---|---|---|
| **Foundation** | `render.js` | 220 | drawText, particle, drawPixelSprite, sprite Hải tặc |
| | `audio.js` | 107 | Web Audio + 11 SFX + BGM |
| | `leaderboard.js` | 207 | Firestore + cache + xuất/nhập JSON |
| | `orb.js` | 57 | class MagicOrb |
| **Game entities** | `bosses.js` | 475 | 5 boss (vẽ + skill) + BOSS_KINDS |
| | `player.js` | 183 | class Player |
| | `enemy.js` | 318 | class Enemy + sprite GUARD/BEAST |
| | `items.js` | 184 | Item, QuestNPC, Boat |
| **Level + world** | `levels.js` | 270 | ISLAND_CONFIGS + buildIsland + quests |
| | `world.js` | 163 | drawBackground/Platforms/Decorations + camera |
| **UI** | `ui/hud.js` | 209 | drawHUD, drawPowerBar, drawCrosshair |
| | `ui/shop.js` | 240 | SHOP_ITEMS + buyShopItem + drawShop |
| | `ui/screens.js` | 269 | title/nameInput/quest/gameover/win |
| **Glue** | `index.html` | 664 | state, input, update/draw chính, main loop |

Tổng: ~3.566 dòng. `index.html` đã giảm từ 3.300 (bản v1 monolithic) xuống còn
664 dòng (-80%) sau refactor — lợi cho bảo trì và tiết kiệm token khi nhờ AI
sửa code.

> ⚠️ **Lưu ý chạy local**: vì có nhiều file `src/*.js`, double-click
> `index.html` sẽ không chạy được (Chrome chặn `file://` load same-directory
> script). Phải dùng HTTP server: `python3 -m http.server 8000` rồi mở
> `http://localhost:8000`. Trên hosting `aki.tuantitan.com` đã là HTTPS nên
> không vấn đề.

Xem `CLAUDE.md` ở thư mục gốc để biết chi tiết từng module + bản đồ dòng cho
`index.html`.

---

## 16. 🔥 Lộ Trình Phát Triển (đã hoàn thành)

### Tính năng game
- ✅ Bản v1: 5 đảo, lính, thú, boss, vật phẩm, nhiệm vụ, thuyền, camera, particle
- ✅ Âm thanh BGM + 11 SFX
- ✅ Trái ác quỷ — 5 loại sức mạnh
- ✅ Mất mạng khi rơi biển
- ✅ Tăng độ khó boss + lính + thú (HP/dame/tốc độ)
- ✅ Cửa hàng 12 mặt hàng, kiếm 3 cấp (×1.0/×1.2/×1.5/×2.0)
- ✅ Bảng xếp hạng + nhập tên hải tặc
- ✅ **Kho trái ác quỷ** (giữ tất cả, đổi qua lại bằng 1-6/Q)
- ✅ **5 boss đa dạng** (hình dạng + skill khác nhau hoàn toàn)
- ✅ **Bảng xếp hạng cloud** (Firebase Firestore — chia sẻ cho bạn bè)
- ✅ **Backup file** JSON (xuất/nhập bằng phím B/L)

### Kỹ thuật
- ✅ Sửa overflow chữ trong UI
- ✅ Thiết kế **flat, hiện đại** (bỏ viền 4 cạnh, dùng vạch nhấn 3-4px)
- ✅ **Refactor 13 module** — `index.html` từ 3.300 → 664 dòng (-80%)
- ✅ `CLAUDE.md` — bản đồ điều hướng cho dev / AI
- ✅ Deploy lên `aki.tuantitan.com` + Firestore Security Rules

---

*Bản thiết kế gốc bởi: **Lâm, 10 tuổi*** 🌟
*Phát triển + bổ sung trong nhiều phiên làm việc*
