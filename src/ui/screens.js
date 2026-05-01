"use strict";
// =============================================================================
// Tải ảnh nền cho title screen (đã chứa sẵn title + character + "Bấm Enter")
// =============================================================================
const introBg = new Image();
introBg.src = "assets/intro_screen.png";

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

  // (Bảng xếp hạng đã chuyển sang chỉ hiện ở gameover/win - giữ intro thuần ảnh)

  // Hint phím xuất / nhập file - nhỏ ở góc dưới phải để không che ảnh
  drawText("B : Xuất bảng   |   L : Nhập bảng",
           W - 24, H - 28, 12, "rgba(255,255,255,0.7)", "#000", "right");

  // Tín dụng tác giả góc dưới-trái (nhỏ, có shadow)
  drawText("Thiết kế bởi: Lâm, 10 tuổi",
           24, H - 28, 14, "#fff", "#000");
}

// =============================================================================
// Màn hình nhập tên hải tặc
// =============================================================================
function drawNameInput() {
  drawSpaceBackground();

  drawText("NHẬP TÊN HẢI TẶC", W/2, 130, 56, "#ffd24a", "#000", "center");
  drawText("Hãy đặt một cái tên thật ngầu!", W/2, 210, 22, "#fff", "#000", "center");

  // ô nhập - phẳng, gạch chân vàng đậm thay cho viền
  const bx = W/2 - 320, by = 280, bw = 640, bh = 90;
  ctx.fillStyle = "rgba(14, 22, 48, 0.78)";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(bx, by + bh - 4, bw, 4);   // gạch chân = focus indicator
  // nội dung + con trỏ nhấp nháy
  const cursor = (Math.floor(Date.now() / 400) % 2 === 0) ? "▌" : " ";
  const display = typedName + cursor;
  drawText(display, W/2, by + 28, 38, "#fff", "#000", "center");

  drawText("Gõ chữ để nhập tên (tối đa 14 ký tự, có thể dùng tiếng Việt)",
           W/2, by + bh + 24, 18, "#aef", "#000", "center");
  drawText("Backspace để xoá ký tự",
           W/2, by + bh + 50, 18, "#aef", "#000", "center");

  if (typedName.trim().length > 0) {
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    drawText("► Bấm ENTER để bắt đầu ◄", W/2, H - 130, 30,
             blink ? "#7afc6e" : "#fff", "#000", "center");
  } else {
    drawText("(Cần nhập tên trước khi bắt đầu)",
             W/2, H - 130, 22, "#ff8a8a", "#000", "center");
  }
  drawText("ESC : Quay lại màn hình tiêu đề",
           W/2, H - 80, 18, "#aef", "#000", "center");

  // thông báo lỗi nếu có
  if (noticeTimer > 0 && questNotice) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(W/2 - 360, H - 200, 720, 40);
    drawText(questNotice, W/2, H - 192, 20, "#ff8a8a", "#000", "center");
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
