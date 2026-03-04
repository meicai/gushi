# 🏯 墨韵诗林 — 少儿古诗背诵助手

一款专为小朋友设计的古诗词学习应用，水墨国风 + 宣纸护眼配色，让古诗学习变成一件开心的事。

## ✨ 功能亮点

| 功能         | 说明                           |
| ------------ | ------------------------------ |
| 📖 64 首古诗 | 学前 ~ 五年级，小学必背篇目    |
| 📌 拼音注音  | 每个汉字上方标注拼音，可开关   |
| 📝 白话译文  | 通俗易懂的现代文翻译           |
| 📋 背诵模式  | 诗句变横线填空，逐行点击揭示   |
| 🔍 搜索      | 按诗名、作者、诗句内容实时搜索 |
| ❤️ 收藏      | 标记喜欢的诗词，持久化保存     |
| 🔊 语音朗读  | TTS 逐句/整首朗读              |
| 🎵 磨耳朵    | 黑胶唱片播放器，顺序/单曲/随机 |
| 🎨 水墨背景  | 12 主题水墨画，与诗意精准匹配  |
| 📊 进度追踪  | 未学 / 一半 / 再练 / 已记      |

## 🖼️ 预览

| 首页                     | 详情页                     | 背诵模式            |
| ------------------------ | -------------------------- | ------------------- |
| 搜索栏 + 收藏 + 水墨卡片 | 拼音 + 译文 + 拼/译/背按钮 | 横线遮盖 + 逐行揭示 |

## 🛠️ 技术栈

- **框架**：Vanilla JS + HTML + CSS（零依赖）
- **构建**：[Vite](https://vite.dev/)
- **字体**：[霞鹜文楷](https://github.com/lxgw/LxgwWenKai) + [马善政](https://fonts.google.com/specimen/Ma+Shan+Zheng)
- **语音**：Web Speech API
- **存储**：LocalStorage
- **部署**：GitHub Pages + GitHub Actions

## 🚀 本地运行

```bash
# 克隆项目
git clone https://github.com/meicai/gushi.git
cd gushi

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173/`

## 📦 构建部署

```bash
# 构建生产包
npx vite build

# 输出目录: dist/
```

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

## 📁 项目结构

```
gushi/
├── index.html              # 入口页面
├── main.js                 # 主程序
├── style.css               # 设计系统
├── poems.js                # 64 首古诗数据
├── vite.config.js          # Vite 配置
├── utils/
│   ├── poem-annotations.js # 拼音 + 译文
│   ├── poem-bg.js          # 背景图映射
│   ├── storage.js          # LocalStorage
│   ├── tts.js              # TTS 语音
│   └── audio-manager.js    # 音频管理器
├── public/bg/              # 12 张水墨画背景
└── .github/workflows/      # CI/CD
```

## 📄 开源协议

MIT License
