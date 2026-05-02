"use strict";
// =============================================================================
// Tải ảnh nền cho các màn hình ngoài gameplay
// Đăng ký vào AssetLoader để loading screen biết khi nào tải xong.
// =============================================================================
AssetLoader.expect();
const introBg = new Image();
introBg.onload  = () => AssetLoader.done(true);
introBg.onerror = () => {
  console.warn("Không tải được intro_screen.png - title sẽ dùng nền sao");
  AssetLoader.done(false);
};
introBg.src = "assets/intro_screen.png";

AssetLoader.expect();
const nameInputBg = new Image();
nameInputBg.onload  = () => AssetLoader.done(true);
nameInputBg.onerror = () => {
  console.warn("Không tải được name_input_screen.png - dùng nền sao");
  AssetLoader.done(false);
};
nameInputBg.src = "assets/name_input_screen.png";

// =============================================================================
// SCREENS - các màn hình full-screen ngoài gameplay:
//   - drawSpaceBackground (nền dùng chung cho title / nameInput)
//   - drawLeaderboardPanel (top 10, dùng ở title + gameover + win)
//   - drawTitleScreen (2 cột: hướng dẫn + bảng xếp hạng)
//   - drawNameInput (ô nhập tên hải tặc)
//   - drawQuestPanel (overlay khi mở bảng nhiệm vụ)
//   - drawGameOver, drawWin
//
// Phụ thuộc:
//   ctx, W, H, player, level, quests, typedName, lastSavedEntry,
//   noticeTimer, questNotice (index.html)
//   render.js: drawText, rand, choice, spawnParticles, updateParticles, drawParticles
//   leaderboard.js: loadLeaderboard, cloudStatus
// =============================================================================

// Vẽ nền sao + sóng dùng chung cho title / nhập tên / kết thúc
function drawSpaceBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1c2a8a");
  g.addColorStop(1, "#0a4a7a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {
    const x = (i * 137) % W;
    const y = (i * 59) % (H/2);
    ctx.fillStyle = "rgba(255,255,255," + (0.5 + 0.5 * Math.sin(Date.now()/400 + i)) + ")";
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.fillStyle = "#0a4a7a";
  ctx.fillRect(0, H - 200, W, 200);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  for (let i = 0; i < 30; i++) {
    ctx.fillRect((i * 50 + Math.floor(Date.now()/30) % 50), H - 180 + (i % 3) * 14, 26, 4);
  }
}

// =============================================================================
// Vẽ bảng xếp hạng (top 10). Nếu highlight = entry vừa ghi -> tô vàng
// =============================================================================
function drawLeaderboardPanel(x, y, w, h, highlight) {
  ctx.fillStyle = "rgba(14, 22, 48, 0.82)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(x, y, w, 3);    // vạch nhấn đỉnh, không viền 4 cạnh

  drawText("BẢNG XẾP HẠNG",
    x + w/2, y + 14, 24, "#ffd24a", "#000", "center");
  // chỉ báo trạng thái đồng bộ cloud
  const statusText  = cloudStatus === "online"  ? "● Đã kết nối Internet"
                    : cloudStatus === "loading" ? "○ Đang đồng bộ..."
                    : "× Mất kết nối (xem cache)";
  const statusColor = cloudStatus === "online"  ? "#7afc6e"
                    : cloudStatus === "loading" ? "#aef"
                    : "#ff8a8a";
  drawText(statusText, x + w/2, y + 38, 12, statusColor, "#000", "center");

  const list = loadLeaderboard();
  if (list.length === 0) {
    drawText("Chưa có ai chơi.",
      x + w/2, y + h/2 - 16, 22, "#ccc", "#000", "center");
    drawText("Hãy là hải tặc đầu tiên!",
      x + w/2, y + h/2 + 12, 18, "#aef", "#000", "center");
    return;
  }
  // hàng tiêu đề cột
  let ry = y + 56;
  drawText("#",     x + 24,        ry, 14, "#aef", "#000");
  drawText("Tên",   x + 60,        ry, 14, "#aef", "#000");
  drawText("Điểm",  x + w - 200,   ry, 14, "#aef", "#000");
  drawText("Đảo",   x + w - 110,   ry, 14, "#aef", "#000");
  drawText("Ngày",  x + w - 60,    ry, 14, "#aef", "#000");
  ry += 24;
  // các dòng
  const maxRows = Math.min(10, list.length);
  for (let i = 0; i < maxRows; i++) {
    const e = list[i];
    const isMe = highlight &&
                 highlight.name === e.name &&
                 highlight.score === e.score &&
                 highlight.date === e.date;
    if (isMe) {
      ctx.fillStyle = "rgba(255, 210, 74, 0.22)";
      ctx.fillRect(x + 8, ry - 3, w - 16, 24);
    }
    const col = isMe ? "#ffd24a" : (e.won ? "#7afc6e" : "#fff");
    drawText(`${i + 1}.`,        x + 24,      ry, 16, col, "#000");
    drawText(e.name,             x + 60,      ry, 16, col, "#000");
    drawText("" + e.score,       x + w - 200, ry, 16, col, "#000");
    drawText(e.won ? `${e.islands}⭐` : `${e.islands}`,
                                 x + w - 110, ry, 14, col, "#000");
    drawText(e.date,             x + w - 60,  ry, 12, col, "#000");
    ry += 22;
  }
}

// =============================================================================
// Bảng nhiệm vụ chi tiết (bấm Enter gần NPC để mở)
// =============================================================================
function drawQuestPanel() {
  ctx.fillStyle = "rgba(8, 14, 30, 0.82)";
  ctx.fillRect(0, 0, W, H);

  const px = W/2 - 360, py = 100, pw = 720, ph = 480;
  ctx.fillStyle = "#141d3a";
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(px, py, pw, 4);    // vạch nhấn đỉnh

  drawText("BẢNG NHIỆM VỤ  ·  " + level.name,
           px + pw/2, py + 24, 26, "#ffd24a", "#000", "center");

  drawText("Người dân: \"Chào hải tặc nhỏ! Hòn đảo của chúng tôi đang bị tấn công.",
           px + 30, py + 70, 16, "#fff");
  drawText("Bạn có thể giúp chúng tôi hoàn thành các nhiệm vụ sau không?\"",
           px + 30, py + 92, 16, "#fff");

  let qy = py + 140;
  for (let i = 0; i < quests.length; i++) {
    const q = quests[i];
    const col = q.done ? "#7afc6e" : "#fff";
    const sym = q.done ? "[ĐÃ XONG ✓]" : `[${q.progress}/${q.target}]`;
    drawText(`${i + 1}. ${q.text}`, px + 40, qy, 20, col, "#000");
    drawText(sym, px + pw - 40, qy, 20, col, "#000", "right");
    qy += 40;
  }

  drawText("Mẹo:", px + 30, qy + 20, 18, "#aef", "#000");
  drawText("• Dùng Chuột Trái để bắn đạn ma thuật từ xa.", px + 30, qy + 46, 16, "#fff");
  drawText("• Nhảy lên bục cao để tránh kẻ thù và tìm vàng.", px + 30, qy + 68, 16, "#fff");
  drawText("• Hoàn thành tất cả nhiệm vụ rồi lên thuyền sang đảo mới!", px + 30, qy + 90, 16, "#fff");

  drawText("Bấm Enter hoặc ESC để tiếp tục",
           px + pw/2, py + ph - 40, 18, "#ffd24a", "#000", "center");
}

// =============================================================================
// Overlay COUNTDOWN - đếm ngược 10s khi vào game / đảo mới
// Vẽ đè lên world bình thường (game vẫn render player + map). Quái không đánh,
// player không bắn (xử lý ở update() loop và Player/Enemy update).
// =============================================================================
function drawCountdownOverlay() {
  if (typeof countdownTimer === "undefined" || countdownTimer <= 0) return;
  const seconds = Math.ceil(countdownTimer / 60);
  // Số to giữa màn hình + animation pulse
  const pulse = 1 + 0.15 * Math.sin(countdownTimer * 0.3);
  const fontSize = 180 * pulse;
  // Background dim nhẹ
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(0, 0, W, H);
  // Số đếm
  drawText(seconds.toString(),
           W/2, H/2 - 100, fontSize, "#ffd24a", "#3a1a06", "center");
  // Text "Sẵn sàng!" phía trên
  drawText("SẴN SÀNG!",
           W/2, H/2 - 180, 36, "#fff", "#000", "center");
  // Hint: làm quen điều khiển
  drawText("Di chuyển + làm quen với địa hình",
           W/2, H/2 + 100, 22, "#aef", "#000", "center");
  drawText("(Chuột trái + 1-6 sẽ kích hoạt khi đếm về 0)",
           W/2, H/2 + 130, 16, "rgba(255,255,255,0.6)", "#000", "center");
}

// =============================================================================
// Màn hình TẠM DỪNG - khi user chuyển tab / mất focus cửa sổ
// Hiển thị overlay tối + thông báo + hint Enter để tiếp tục.
// =============================================================================
function drawPauseScreen() {
  // Nền tối phẳng
  ctx.fillStyle = "#0e1530";
  ctx.fillRect(0, 0, W, H);

  // Tiêu đề lớn với icon pause
  drawText("⏸ TẠM DỪNG", W/2, H/2 - 90, 72, "#ffd24a", "#3a1a06", "center");

  // Mô tả
  drawText("Game đã tự dừng vì bạn rời khỏi tab",
           W/2, H/2 + 10, 22, "#aef", "#000", "center");

  // Hint Enter nhấp nháy
  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  drawText("► Bấm ENTER để tiếp tục chơi ◄",
           W/2, H/2 + 70, 28,
           blink ? "#7afc6e" : "#fff", "#000", "center");

  // Hint nhỏ phía dưới
  drawText("Tiến độ đảo + máu + vật phẩm vẫn được giữ nguyên",
           W/2, H - 60, 14, "rgba(255,255,255,0.5)", "#000", "center");
}

// =============================================================================
// Màn hình LOADING - hiển thị tiến độ tải tài nguyên trước khi vào title
// Tự động chuyển sang STATE.TITLE khi AssetLoader.isReady() (xem update loop).
// =============================================================================
function drawLoadingScreen() {
  // Nền gradient xanh đậm
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0e1530");
  g.addColorStop(1, "#1a2348");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Tiêu đề game (text - vì ảnh chưa chắc đã tải xong)
  drawText("ISLAND PIRATES", W/2, H/2 - 110, 64, "#ffd24a", "#3a1a06", "center");
  drawText("HẢI TẶC ĐẢO",    W/2, H/2 - 50,  28, "#fff",    "#3a1a06", "center");

  // Thông báo trạng thái
  drawText("Đang tải tài nguyên...", W/2, H/2 + 30, 22, "#aef", "#000", "center");

  // Progress bar - phẳng, vạch nhấn vàng đầy dần
  const barW = 480, barH = 22;
  const barX = (W - barW) / 2, barY = H/2 + 80;
  const p = AssetLoader.progress();
  ctx.fillStyle = "rgba(14, 22, 48, 0.9)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(barX, barY, barW * p, barH);
  drawText(`${Math.floor(p * 100)}%`,
           W/2, barY + 3, 14, "#fff", "#000", "center");

  // Đếm số tài nguyên + trạng thái
  const okPart   = `${AssetLoader.loaded} đã tải`;
  const failPart = AssetLoader.failed > 0 ? `, ${AssetLoader.failed} lỗi` : "";
  drawText(`${okPart}${failPart} / ${AssetLoader.total} tổng cộng`,
           W/2, barY + barH + 16, 14, "#aef", "#000", "center");

  // Hint nhỏ ở chân màn hình
  drawText("Game sẽ tự bắt đầu khi tải xong",
           W/2, H - 60, 16, "rgba(255,255,255,0.5)", "#000", "center");
}

// =============================================================================
// Màn hình tiêu đề - dùng ảnh nền có sẵn (đã có title + character + "Nhấn Enter")
// + leaderboard mini overlay góc phải để bạn bè vẫn xem được top điểm
// =============================================================================
function drawTitleScreen() {
  // Vẽ ảnh nền full canvas (giữ aspect bằng cách stretch nhẹ - canvas 16:9, ảnh 16:8.7)
  if (introBg.complete && introBg.naturalWidth > 0) {
    ctx.drawImage(introBg, 0, 0, W, H);
  } else {
    drawSpaceBackground();   // fallback khi ảnh chưa tải xong
  }

  // === SKIN SELECTOR - 2 thẻ ở giữa dưới (Hải Tặc Nam / Hải Tặc Nữ) ===
  drawSkinSelector();

  // (Bảng xếp hạng đã chuyển sang chỉ hiện ở gameover/win - giữ intro thuần ảnh)

  // Hint phím xuất / nhập file - nhỏ ở góc dưới phải để không che ảnh
  drawText("B : Xuất bảng   |   L : Nhập bảng",
           W - 24, H - 28, 12, "rgba(255,255,255,0.7)", "#000", "right");

  // Tín dụng tác giả góc dưới-trái (nhỏ, có shadow)
  drawText("Thiết kế bởi: Lâm, 10 tuổi",
           24, H - 28, 14, "#fff", "#000");

  // Notice ngắn (vd: "skin chưa có") hiển thị giữa-trên skin selector
  if (typeof noticeTimer !== "undefined" && noticeTimer > 0 && questNotice) {
    ctx.globalAlpha = Math.min(1, noticeTimer / 30);
    const padX = 24, padY = 12, fs = 18;
    ctx.font = `bold ${fs}px sans-serif`;
    const tw = ctx.measureText(questNotice).width;
    const boxW = tw + padX * 2, boxH = fs + padY * 2;
    const noticeY = SKIN_SELECTOR_LAYOUT.y - 80;
    ctx.fillStyle = "rgba(14, 22, 48, 0.92)";
    ctx.fillRect(W/2 - boxW/2, noticeY, boxW, boxH);
    ctx.fillStyle = "#ffd24a";
    ctx.fillRect(W/2 - boxW/2, noticeY + boxH - 3, boxW, 3);
    drawText(questNotice, W/2, noticeY + padY, fs, "#fff", "#000", "center");
    ctx.globalAlpha = 1;
  }
}

// Layout của skin selector: 2 thẻ vuông cạnh nhau ở giữa-dưới title screen
const SKIN_SELECTOR_LAYOUT = {
  cardW: 160, cardH: 100, gap: 24,
  y: 540   // canvas y - dưới chữ "Nhấn Enter" của ảnh title
};

function skinCardRect(idx) {
  const L = SKIN_SELECTOR_LAYOUT;
  const totalW = L.cardW * 2 + L.gap;
  const startX = (W - totalW) / 2;
  return { x: startX + idx * (L.cardW + L.gap), y: L.y, w: L.cardW, h: L.cardH };
}

// Trả về "male"/"female" nếu click trúng card, null nếu không
function skinAt(x, y) {
  const skins = ["male", "female"];
  for (let i = 0; i < skins.length; i++) {
    const r = skinCardRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return skins[i];
  }
  return null;
}

function drawSkinSelector() {
  drawText("Chọn nhân vật:",
           W/2, SKIN_SELECTOR_LAYOUT.y - 32, 18, "#ffd24a", "#000", "center");
  const skins = [
    { id: "male",   label: "Hải Tặc Nam",  ready: PIRATE_SHEETS.male.ready },
    { id: "female", label: "Hải Tặc Nữ",   ready: PIRATE_SHEETS.female.ready }
  ];
  for (let i = 0; i < skins.length; i++) {
    const s = skins[i];
    const r = skinCardRect(i);
    const active = (selectedSkin === s.id);
    const hover  = (input.mouseX >= r.x && input.mouseX <= r.x + r.w &&
                    input.mouseY >= r.y && input.mouseY <= r.y + r.h);
    // Nền card phẳng + vạch nhấn dưới đáy nếu active
    ctx.fillStyle = active ? "rgba(255, 210, 74, 0.28)"
                  : hover  ? "rgba(255, 255, 255, 0.18)"
                           : "rgba(14, 22, 48, 0.78)";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (active) {
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
    }
    // Vẽ preview sprite (frame idle 0) ở giữa card
    const sheet = PIRATE_SHEETS[s.id];
    const previewH = 72, previewW = 48;
    const px = r.x + r.w/2 - previewW/2;
    const py = r.y + 8;
    if (sheet && sheet.ready) {
      ctx.drawImage(sheet.image, 0, 0, sheet.frameW, sheet.frameH,
                    px, py, previewW, previewH);
    } else {
      // Asset chưa có (vd female chưa generate) - vẽ silhouette ?
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(px, py, previewW, previewH);
      drawText("?", r.x + r.w/2, py + previewH/2 - 16, 36, "#888", "#000", "center");
    }
    // Nhãn dưới
    const labelCol = active ? "#ffd24a" : (hover ? "#fff" : "#cbd6e6");
    drawText(s.label, r.x + r.w/2, r.y + r.h - 24, 14, labelCol, "#000", "center");
    if (!sheet.ready) {
      drawText("(sắp có)", r.x + r.w/2, r.y + r.h - 10, 10, "#888", "#000", "center");
    }
  }
}

// =============================================================================
// Màn hình nhập tên chú Cún - hiện sau khi bấm mua Cún trong shop
// =============================================================================
function drawDogNamePanel() {
  // Nền tối overlay
  ctx.fillStyle = "rgba(8, 14, 30, 0.88)";
  ctx.fillRect(0, 0, W, H);

  // Panel trung tâm
  const px = W/2 - 360, py = H/2 - 260, pw = 720, ph = 520;
  ctx.fillStyle = "#141d3a";
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(px, py, pw, 4);    // vạch nhấn đỉnh

  // Branch theo loại companion đang đặt tên
  const isDuck = (typeof pendingCompanionKind !== "undefined" && pendingCompanionKind === "duck");

  // Tiêu đề + subtitle
  if (isDuck) {
    drawText("ĐẶT TÊN CHO VỊT VÀNG", W/2, py + 44, 34, "#ffd24a", "#000", "center");
    drawText("Vịt Vàng tank trâu sẽ chắn đòn cho bạn!",
             W/2, py + 80, 18, "#aef", "#000", "center");
  } else {
    drawText("ĐẶT TÊN CHO CHÚ CÚN", W/2, py + 44, 34, "#ffd24a", "#000", "center");
    drawText("Chú Cún sẽ đồng hành cùng bạn suốt hành trình!",
             W/2, py + 80, 18, "#aef", "#000", "center");
  }

  // Vẽ minh hoạ companion (Cún hoặc Vịt) ở giữa panel
  const cx = W/2, cy = py + 200;
  if (isDuck) drawDuckPreview(cx, cy);
  else        drawDogPreview(cx, cy);

  // Thẻ nhập tên
  const boxX = W/2 - 240, boxY = py + 330, boxW = 480, boxH = 60;
  ctx.fillStyle = "#0e1530";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(boxX, boxY, boxW, 3);
  ctx.fillRect(boxX, boxY + boxH - 3, boxW, 3);
  ctx.fillRect(boxX, boxY, 3, boxH);
  ctx.fillRect(boxX + boxW - 3, boxY, 3, boxH);

  // Tên đang gõ + con trỏ nhấp nháy
  const display = dogNameInput + ((Math.floor(Date.now() / 400) % 2 === 0) ? "▌" : " ");
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = isDuck ? "#ffd24a" : "#d4a050";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(display, W/2, boxY + boxH/2);

  // Giới hạn ký tự
  drawText(`${dogNameInput.length}/14`, W/2 + 210, boxY + boxH/2, 16, "#666", "#000", "center");

  // Hint
  drawText("Enter để xác nhận", W/2 - 100, py + ph - 55, 20, "#7afc6e", "#000", "center");
  drawText("ESC để hủy",        W/2 + 100, py + ph - 55, 20, "#ff6a6a", "#000", "center");
}

// Vẽ minh hoạ Cún Golden Retriever đơn giản
function drawDogPreview(cx, cy) {
  ctx.fillStyle = "#d4a050";
  ctx.beginPath(); ctx.ellipse(cx, cy, 80, 48, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#a07030";
  ctx.beginPath(); ctx.ellipse(cx - 10, cy, 55, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d4a050";
  ctx.beginPath(); ctx.ellipse(cx + 80, cy - 10, 38, 32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#a07030";
  ctx.beginPath(); ctx.ellipse(cx + 65, cy - 38, 14, 20, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 95, cy - 36, 14, 20, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffd6a8";
  ctx.beginPath(); ctx.ellipse(cx + 112, cy - 2, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.ellipse(cx + 126, cy - 4, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 92, cy - 14, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx + 93, cy - 15, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d4a050";
  ctx.beginPath();
  ctx.moveTo(cx - 75, cy - 20);
  ctx.quadraticCurveTo(cx - 110, cy - 60, cx - 90, cy - 80);
  ctx.quadraticCurveTo(cx - 70, cy - 60, cx - 75, cy - 20);
  ctx.fill();
  ctx.fillStyle = "#d4a050";
  ctx.fillRect(cx - 45, cy + 25, 20, 36);
  ctx.fillRect(cx - 10, cy + 25, 20, 36);
  ctx.fillRect(cx + 30, cy + 25, 20, 36);
  ctx.fillRect(cx + 55, cy + 25, 20, 36);
  ctx.fillStyle = "#a07030";
  ctx.fillRect(cx - 48, cy + 55, 26, 10);
  ctx.fillRect(cx - 13, cy + 55, 26, 10);
  ctx.fillRect(cx + 27, cy + 55, 26, 10);
  ctx.fillRect(cx + 52, cy + 55, 26, 10);
  ctx.strokeStyle = "#a07030";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx + 116, cy + 4, 8, 0, Math.PI * 0.5);
  ctx.stroke();
}

// Vẽ minh hoạ Vịt Vàng đơn giản (thân tròn vàng + mỏ cam)
function drawDuckPreview(cx, cy) {
  // Thân
  ctx.fillStyle = "#ffd24a";
  ctx.beginPath(); ctx.ellipse(cx, cy + 10, 78, 56, 0, 0, Math.PI * 2); ctx.fill();
  // Bụng nhạt
  ctx.fillStyle = "#fff5a0";
  ctx.beginPath(); ctx.ellipse(cx - 10, cy + 24, 50, 36, 0, 0, Math.PI * 2); ctx.fill();
  // Đầu
  ctx.fillStyle = "#ffd24a";
  ctx.beginPath(); ctx.ellipse(cx + 60, cy - 32, 44, 38, 0, 0, Math.PI * 2); ctx.fill();
  // Mỏ trên
  ctx.fillStyle = "#ff8a3c";
  ctx.beginPath();
  ctx.moveTo(cx + 88, cy - 30);
  ctx.lineTo(cx + 130, cy - 22);
  ctx.lineTo(cx + 90, cy - 14);
  ctx.closePath();
  ctx.fill();
  // Mỏ dưới
  ctx.fillStyle = "#d96a1a";
  ctx.beginPath();
  ctx.moveTo(cx + 90, cy - 14);
  ctx.lineTo(cx + 122, cy - 12);
  ctx.lineTo(cx + 90, cy - 4);
  ctx.closePath();
  ctx.fill();
  // Mắt
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx + 70, cy - 44, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.arc(cx + 72, cy - 42, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx + 74, cy - 44, 2, 0, Math.PI * 2); ctx.fill();
  // Má hồng
  ctx.fillStyle = "rgba(255, 120, 140, 0.55)";
  ctx.beginPath(); ctx.arc(cx + 50, cy - 24, 8, 0, Math.PI * 2); ctx.fill();
  // Cánh
  ctx.fillStyle = "#e6b62a";
  ctx.beginPath(); ctx.ellipse(cx - 18, cy + 8, 32, 22, -0.2, 0, Math.PI * 2); ctx.fill();
  // Chân
  ctx.fillStyle = "#ff8a3c";
  ctx.fillRect(cx - 18, cy + 60, 14, 16);
  ctx.fillRect(cx + 12, cy + 60, 14, 16);
  // Bàn chân (chân vịt)
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy + 76); ctx.lineTo(cx + 0, cy + 76); ctx.lineTo(cx - 12, cy + 84);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 76); ctx.lineTo(cx + 30, cy + 76); ctx.lineTo(cx + 18, cy + 84);
  ctx.closePath(); ctx.fill();
}

// =============================================================================
// Màn hình nhập tên hải tặc
// Dùng ảnh nền có sẵn title "NHẬP TÊN HẢI TẶC" + subtitle + parchment scroll
// + hint "Tối đa 14 ký tự — Bấm ENTER để bắt đầu"
// Code chỉ overlay: tên đang gõ vào giữa parchment + ESC hint + error.
// =============================================================================
function drawNameInput() {
  // Vẽ ảnh nền full canvas (đã có toàn bộ trang trí + chữ)
  if (nameInputBg.complete && nameInputBg.naturalWidth > 0) {
    ctx.drawImage(nameInputBg, 0, 0, W, H);
  } else {
    drawSpaceBackground();   // fallback
  }

  // Overlay tên đang gõ - căn giữa parchment scroll trong ảnh
  // Toạ độ tinh chỉnh theo ảnh 1024x547 stretch lên 1280x720 (parchment ~y=290 trong ảnh)
  const inputY = H * 0.50;     // ~360 - giữa parchment scroll
  const cursor = (Math.floor(Date.now() / 400) % 2 === 0) ? "▌" : " ";
  const display = typedName + cursor;
  drawText(display, W/2, inputY, 42, "#3a1a06", "#ffd24a", "center");

  // Báo lỗi nếu chưa nhập tên (text đỏ, hiện nhẹ phía dưới hint trong ảnh)
  if (typedName.trim().length === 0 && noticeTimer === 0) {
    drawText("(Cần nhập tên trước khi bắt đầu)",
             W/2, H * 0.78, 20, "#ff5a5a", "#000", "center");
  }

  // Hint ESC ở chân màn hình (ảnh không có)
  drawText("ESC : Quay lại màn hình tiêu đề",
           W/2, H - 24, 14, "rgba(255,255,255,0.85)", "#000", "center");

  // Thông báo lỗi từ showNotice (vd: "Vui lòng nhập tên hải tặc của bạn!")
  if (noticeTimer > 0 && questNotice) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(W/2 - 360, H * 0.78 - 8, 720, 40);
    drawText(questNotice, W/2, H * 0.78 - 2, 20, "#ff8a8a", "#000", "center");
  }
}

// =============================================================================
// Màn hình thua - kèm bảng xếp hạng (highlight dòng vừa ghi)
// =============================================================================
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, W, H);
  drawText("BẠN ĐÃ HẾT MẠNG!", W/2, 60,  60, "#ff4a4a", "#000", "center");
  drawText("Đừng buồn, hải tặc vĩ đại nào cũng từng thất bại!",
           W/2, 130, 22, "#fff", "#000", "center");
  drawText(`${player.name} - Điểm: ${player.score}`,
           W/2, 168, 26, "#ffd24a", "#000", "center");

  drawLeaderboardPanel(W/2 - 320, 210, 640, 420, lastSavedEntry);

  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  drawText("Bấm ENTER để về Màn hình tiêu đề", W/2, H - 50, 24,
           blink ? "#7afc6e" : "#fff", "#000", "center");
}

// =============================================================================
// Màn hình thắng - kèm pháo hoa + bảng xếp hạng
// =============================================================================
function drawWin() {
  if (Math.random() < 0.3) {
    spawnParticles(rand(100, W - 100), rand(100, H/2), {
      count: 20, color: choice(["#ff4a4a","#ffd24a","#4af0ff","#7afc6e","#ff8af0"]),
      speed: 5, size: 4, life: 50, gravity: 0.06
    });
  }
  ctx.fillStyle = "rgba(0, 30, 80, 0.88)";
  ctx.fillRect(0, 0, W, H);
  drawParticles(0, 0);
  updateParticles();

  drawText("CHIẾN THẮNG!", W/2, 50, 76, "#ffd24a", "#000", "center");
  drawText("Bạn đã chinh phục cả 5 hòn đảo!", W/2, 140, 26, "#fff", "#000", "center");
  drawText(`${player.name}  -  Điểm: ${player.score}  -  Vàng: ${player.gold}`,
           W/2, 178, 22, "#fff5a0", "#000", "center");

  drawLeaderboardPanel(W/2 - 320, 220, 640, 420, lastSavedEntry);

  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  drawText("Bấm ENTER để về Màn hình tiêu đề", W/2, H - 50, 24,
           blink ? "#7afc6e" : "#fff", "#000", "center");
}
