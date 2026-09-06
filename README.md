# 👑 Royal Showdown (皇家決戰 3D)

[![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-Polyphonic%20BGM%20%26%20SFX-green?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> 一款基於 Three.js 打造的 3D 即時卡牌對戰遊戲（皇室戰爭風格），包含 1~100 級玩家成長系統、Royale Pass、7日簽到、首領討伐模式、多元卡牌構建與完整音效音樂系統。

---

## 🎮 遊戲特色

- **🎯 4 大全新原創角色**：
  - ⚡ **賽博忍者 (Cyber Ninja)**：高速切入、背刺暴擊、瞬身閃避。
  - ⚡ **雷霆女武神 (Thunder Valkyrie)**：旋風雷暴斬、群體感電與持續傷害。
  - 🛡️ **機甲魔像 (Mecha Golem)**：超高血量推進、過載重砸、死亡分裂為微型護衛。
  - 🔮 **魔導炎帝 (Phoenix Mage)**：召喚天基炎柱群傷，陣亡時觸發涅槃之火。
- **📈 1-100 級完整玩家成長體系**：
  - 6 大段位頭銜（新手訓練家 → 皇家神話領主）
  - 每級解鎖海量金幣、寶石、傳奇寶箱與限定稱號
- **🎁 豐富運營與獎勵機制**：
  - **7 天每日簽到**：傳奇卡牌、寶箱、頭像框天天領。
  - **Royale Pass (皇家通行證)**：免費軌與高級軌雙線解鎖，達成 30 階領取頂級獎勵。
  - **首領討伐 (Boss Rush)**：限時挑戰強大 Boss，贏取豐厚戰利品。
- **🎵 原創 Web Audio 合成音效與 BGM**：
  - 主介面史詩進行曲 + 戰鬥激烈戰歌 + 倒數 60 秒雙倍聖水緊張 BGM。
  - 專屬卡牌召喚、攻擊、技能爆炸與塔樓倒塌音效。
- **🛡️ 企業級安全性與容器化**：
  - 內建 Dockerfile 與 Nginx 安全標頭（CSP, X-Frame-Options, Rate Limiting 等）。

---

## 🚀 快速開始

### 本地開發

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev
```

瀏覽器打開 `http://localhost:5173` 即可遊玩！

### 生產構建

```bash
npm run build
```

構建產物將輸出至 `dist/` 目錄。

---

## 🛠️ 技術棧

- **渲染引擎**：Three.js
- **打包工具**：Vite
- **音頻處理**：原生 Web Audio API (FM/Subtractive 合成技術)
- **容器化**：Docker + Nginx
