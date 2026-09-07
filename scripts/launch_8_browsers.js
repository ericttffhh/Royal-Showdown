/**
 * 皇室對決 3D - 8 帳號桌面多開分屏實況啟動器
 * 自動為 8 個帳號啟動 8 個完全隔離、獨立 LocalStorage 的 Chrome 視窗
 * 並在 Windows 桌面上自動排成 4x2 網格分屏，讓您親眼即時看到 8 個帳號的對決！
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let browserPath = CHROME_PATHS.find(p => fs.existsSync(p));
if (!browserPath) {
  console.error('❌ 未在系統中找到 Chrome 或 Edge 瀏覽器！');
  process.exit(1);
}

const isChrome = browserPath.includes('Chrome') || browserPath.includes('chrome');
console.log(`\n========================================================================`);
console.log(`🚀 啟動器偵測到瀏覽器: ${isChrome ? 'Google Chrome' : 'Microsoft Edge'}`);
console.log(`📍 執行路徑: ${browserPath}`);
console.log(`========================================================================\n`);

const baseTemp = path.join(os.tmpdir(), 'RoyalClash8Profiles');
if (!fs.existsSync(baseTemp)) {
  fs.mkdirSync(baseTemp, { recursive: true });
}

const BASE_URL = 'http://localhost:5173';

// 8 個帳號配置：前 4 個自動進入四人大亂鬥房間 #982713 (四方割據選邊)，後 4 個進入各特色玩法
const ACCOUNTS = [
  { id: 1, name: '領主1號·藍龍', role: '四人大亂鬥 (南方席位)', col: 0, row: 0, url: `${BASE_URL}?user=test_blue&brawl=982713&side=blue` },
  { id: 2, name: '領主2號·烈焰', role: '四人大亂鬥 (北方席位)', col: 1, row: 0, url: `${BASE_URL}?user=test_red&brawl=982713&side=red` },
  { id: 3, name: '領主3號·翡翠', role: '四人大亂鬥 (西方席位)', col: 2, row: 0, url: `${BASE_URL}?user=test_green&brawl=982713&side=green` },
  { id: 4, name: '領主4號·虛空', role: '四人大亂鬥 (東方席位)', col: 3, row: 0, url: `${BASE_URL}?user=test_purple&brawl=982713&side=purple` },
  { id: 5, name: '領主5號·天梯神', role: '1v1 實時天梯快速匹配', col: 0, row: 1, url: `${BASE_URL}?user=test_ladder` },
  { id: 6, name: '領主6號·守護者', role: '雙人合作 2v2 防禦模式', col: 1, row: 1, url: `${BASE_URL}?user=test_coop` },
  { id: 7, name: '領主7號·泰坦獵人', role: '泰坦首領 (Boss Rush)', col: 2, row: 1, url: `${BASE_URL}?user=test_boss` },
  { id: 8, name: '領主8號·聖水狂人', role: '7X 無限狂暴聖水狂歡', col: 3, row: 1, url: `${BASE_URL}?user=test_7x` }
];

const winW = 460;
const winH = 470;

console.log('🖥️ 正在 Windows 桌面佈局 4x2 網格分屏 (每格尺寸: 460x470)...');

for (const acc of ACCOUNTS) {
  const profileDir = path.join(baseTemp, `profile_${acc.id}`);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const posX = acc.col * winW;
  const posY = acc.row * winH;

  const args = [
    `--user-data-dir=${profileDir}`,
    `--window-size=${winW},${winH}`,
    `--window-position=${posX},${posY}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    acc.url
  ];

  console.log(`▶ [視窗 ${acc.id}/8] 啟動 ${acc.name} ➔ 座標 (${posX}, ${posY}) | 模式: ${acc.role}`);

  const proc = spawn(browserPath, args, {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();

  // 微小間隔避免 Windows 同步啟動撞擊
  await new Promise(r => setTimeout(r, 250));
}

console.log(`\n========================================================================`);
console.log(`✨ 8 個獨立瀏覽器視窗已全部成功在您的桌面上彈出並展開！`);
console.log(`👀 您現在可以直接在螢幕上親眼看見 8 個獨立帳號即時連線並測試所有功能！`);
console.log(`========================================================================\n`);
