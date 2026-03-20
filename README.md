# HKDSE 中文科閱讀工作紙生成器

針對HKDSE中文科指定篇章，AI生成高品質閱讀工作紙（學生版＋教師版）。

## 功能

- **六頁面工作紙**：知人論世、篇章語譯、課文結構、寫作手法、鞏固練習
- **雙版本下載**：PDF/HTML 學生版 & 教師版（紅色答案）
- **智能變式題庫**：跨段比較、情境遷移、評價反思三類變式
- **多平台AI支援**：Gemini、OpenAI、Anthropic、自定義端點

## 快速開始

### 前端（GitHub Pages）

```bash
npm install
npm run dev          # 本地開發
npm run build        # 打包部署
```

### 後端（Render）

```bash
cd backend
npm install
cp .env.example .env   # 填入環境變數
npm start
```

## 部署

### GitHub Pages
1. `npm run build` 生成 `dist/` 資料夾
2. 推送至 GitHub，啟用 Pages（選 `dist/` 分支）

### Render
1. 連接 GitHub 倉庫 `backend/` 目錄
2. 設定環境變數（見 `.env.example`）
3. 啟動命令：`node server.js`

## 技術棧

**前端**：React 18 + Vite + React Router + Tailwind CSS + Dexie.js + jsPDF  
**後端**：Node.js + Express + Multer + pdf-parse  
**字體**：Noto Serif TC / Noto Sans TC

## API 配置

在頁面一設定：
- **平台**：Gemini（預設）/ OpenAI / Anthropic
- **模型**：如 `gemini-2.5-flash`、`gpt-4o`
- **API Key**：僅儲存於瀏覽器 LocalStorage，不上傳伺服器
