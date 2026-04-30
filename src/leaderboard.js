"use strict";
// =============================================================================
// BẢNG XẾP HẠNG - Firestore (cloud) + localStorage (cache offline)
// + Xuất/Nhập file JSON để backup
//
// Tất cả người chơi cùng đọc/ghi vào collection "leaderboard" trên Firebase.
// Cache cục bộ giúp game vẫn hiển thị được khi mất Internet.
//
// Phụ thuộc:
//   - Biến toàn cục `firebase` (từ firebase-app-compat + firebase-firestore-compat)
//   - Hàm toàn cục `showNotice` (khai báo ở index.html)
//   - Biến `gameState`, `STATE` (khai báo ở index.html, dùng trong setInterval)
//
// API toàn cục export ra:
//   loadLeaderboard()                                - đọc từ cache (sync)
//   saveLeaderboard(list)                            - ghi cache + localStorage
//   refreshLeaderboardFromCloud()                    - kéo top 10 từ Firestore
//   addScoreToLeaderboard(name, score, islands, won) - thêm điểm + push cloud
//   exportLeaderboard()                              - tải file JSON
//   importLeaderboard()                              - chọn file JSON khôi phục
// Trạng thái:
//   cloudStatus: "loading" | "online" | "offline"
//   leaderboardCache: array | null
//   typedName, scoreSavedThisRound, lastSavedEntry
// =============================================================================

const LB_KEY = "islandPirates_leaderboard_v1";

// Cấu hình Firebase. API key public là bình thường - Firebase thiết kế vậy;
// bảo mật thực sự nằm ở Firestore Security Rules.
const firebaseConfig = {
  apiKey:            "AIzaSyC8luyPB0ukZ1vbVClG9TWoSmFt5kwWvvc",
  authDomain:        "island-pirates.firebaseapp.com",
  projectId:         "island-pirates",
  storageBucket:     "island-pirates.firebasestorage.app",
  messagingSenderId: "432929212029",
  appId:             "1:432929212029:web:b8eda3990335bd77c61314",
  measurementId:     "G-BTHTDVZ4N0"
};

// Khởi tạo Firebase. Nếu lỗi (ví dụ offline) thì tiếp tục dùng cache cục bộ.
let fbDb = null;
let cloudStatus = "loading";    // "loading" | "online" | "offline"
try {
  if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    fbDb = firebase.firestore();
  }
} catch (e) {
  console.warn("Firebase init lỗi:", e);
}

// Cache trong RAM - vẽ bảng dùng cache này (đồng bộ, không chờ network)
let leaderboardCache = null;

function loadLeaderboard() {
  if (leaderboardCache) return leaderboardCache;
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        leaderboardCache = arr;
        return arr;
      }
    }
  } catch (e) {}
  leaderboardCache = [];
  return leaderboardCache;
}
function saveLeaderboard(list) {
  leaderboardCache = list;
  try { localStorage.setItem(LB_KEY, JSON.stringify(list)); } catch (e) {}
}

// Lấy top 10 từ Firestore và cập nhật cache
async function refreshLeaderboardFromCloud() {
  if (!fbDb) { cloudStatus = "offline"; return; }
  try {
    const snap = await fbDb.collection("leaderboard")
      .orderBy("score", "desc")
      .limit(10)
      .get();
    const list = snap.docs.map(d => {
      const x = d.data();
      return {
        name:    String(x.name || "Hải Tặc").slice(0, 14),
        score:   Number(x.score) | 0,
        islands: Number(x.islands) | 0,
        won:     !!x.won,
        date:    String(x.date || "")
      };
    });
    saveLeaderboard(list);
    cloudStatus = "online";
  } catch (e) {
    console.warn("Tải bảng xếp hạng lỗi:", e);
    cloudStatus = "offline";
  }
}

// Đẩy 1 điểm mới lên Firestore (không chờ kết quả - tối ưu UX)
async function pushScoreToCloud(entry) {
  if (!fbDb) return false;
  try {
    await fbDb.collection("leaderboard").add({
      name:    entry.name,
      score:   entry.score,
      islands: entry.islands,
      won:     entry.won,
      date:    entry.date,
      ts:      firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn("Ghi điểm lên cloud lỗi:", e);
    return false;
  }
}

// Thêm điểm vào bảng - cập nhật cache trước (game không chờ), sau đó push cloud
function addScoreToLeaderboard(name, score, islandsCleared, won) {
  const entry = {
    name: (name || "Hải Tặc").toString().slice(0, 14),
    score: Math.max(0, Math.floor(score)),
    islands: islandsCleared | 0,
    won: !!won,
    date: new Date().toISOString().slice(0, 10)
  };
  // Cập nhật ngay vào cache để bảng kết thúc game thấy điểm mình
  const list = (leaderboardCache || loadLeaderboard()).slice();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  saveLeaderboard(list.slice(0, 10));

  // Đẩy lên cloud song song (không chờ); sau đó kéo lại bản chính thức
  pushScoreToCloud(entry).then(ok => {
    if (ok) refreshLeaderboardFromCloud();
  });

  return { top: leaderboardCache, entry };
}

// Khởi đầu: kéo bảng từ cloud về cache ngay khi script tải xong
refreshLeaderboardFromCloud();
// Cập nhật mỗi 30 giây khi đang ở màn hình tiêu đề (để thấy bạn vừa chơi)
setInterval(() => {
  if (typeof gameState !== "undefined" && typeof STATE !== "undefined" &&
      gameState === STATE.TITLE) {
    refreshLeaderboardFromCloud();
  }
}, 30000);

// Trạng thái dùng chung với phần input tên (game khai báo dùng tiếp)
let typedName = "";
let scoreSavedThisRound = false;
let lastSavedEntry = null;     // dòng vừa lưu (để tô sáng trên bảng)

// =============================================================================
// XUẤT / NHẬP BẢNG XẾP HẠNG ra/vào file JSON (backup)
// Hữu dụng khi muốn giữ bảng qua các lần xoá trình duyệt hoặc đổi máy
// =============================================================================
function exportLeaderboard() {
  const data = loadLeaderboard();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "island_pirates_leaderboard.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (typeof showNotice === "function") {
    showNotice("Đã xuất bảng xếp hạng ra file!", 120);
  }
}
function importLeaderboard() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("Không phải mảng");
        const cleaned = data.filter(x => x && typeof x.name === "string" &&
                                          typeof x.score === "number");
        cleaned.sort((a, b) => b.score - a.score);
        saveLeaderboard(cleaned.slice(0, 10));
        if (typeof showNotice === "function") {
          showNotice("Đã nhập bảng xếp hạng từ file!", 120);
        }
      } catch (err) {
        if (typeof showNotice === "function") {
          showNotice("File không hợp lệ. Vui lòng chọn file JSON đúng định dạng.", 150);
        }
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
