# MyFFmpeg

**简介**
- *MyFFmpeg*：一个基于 Electron + Vite + Vue 3 的桌面 GUI，封装并可视化调用 `ffmpeg`，用于媒体文件的转码、探测和进度显示。
- *主要目标*：提供可配置的转换流程、实时进度日志和友好的图形界面，适合需要本地批量/单文件转换的用户。

**主要特性**
- 可视化 FFmpeg 转换流程与进度。
- 转换日志记录与解析（可查看并保存日志）。
- 支持查看（probe）输入文件信息。
- 可配置输出格式、编码器等设置（通过设置面板）。

**快速开始（开发）**
1. 安装依赖：
```powershell
npm install
```
2. 启动开发环境（同时启动 Vite 和 Electron）：
```powershell
npm run dev
```

**项目结构（优化视图）**
```
src/
├─ electron/
│  ├─ main/
│  │  ├─ index.cjs                # Electron 主进程入口，窗口与生命周期管理、IPC
│  │  ├─ ffmpeg.cjs               # 构建与封装 FFmpeg 命令、参数
│  │  ├─ ffmpeg-runner.cjs        # 启动并管理 ffmpeg 子进程（任务队列/取消/重试）
│  │  ├─ ffmpeg-progress-parser.cjs # 解析 ffmpeg 输出，提取进度与状态
│  │  ├─ ffmpeg-logger.cjs        # 日志格式化与实时输出
│  │  └─ ffmpeg-log-writer.cjs    # 日志持久化（写入文件）
│  └─ preload/
│     └─ index.cjs                # 安全桥（contextBridge），向渲染器暴露受限 API
├─ renderer/
│  ├─ main.js                     # 渲染器入口（Vite 挂载）
│  ├─ App.vue                     # 根组件
│  ├─ components/
│  │  ├─ ConvertTab.vue           # 转码/任务管理视图
│  │  ├─ InfoTab.vue              # 媒体信息（probe）视图
│  │  ├─ SettingsDialogContent.vue# 设置面板
│  │  └─ ToolbarActions.vue       # 工具栏动作
│  └─ shared/
│     ├─ composables/
│     │  ├─ useFFmpeg.js          # 转码相关组合函数（命令、状态、控制）
│     │  └─ useProbe.js           # probe/文件信息组合函数
│     ├─ ipc/
│     │  └─ index.js              # 封装对 preload 暴露的 `electronAPI` 的调用
│     ├─ constants/
│     │  ├─ codecs.js             # 支持/推荐的编码器配置
│     │  ├─ formats.js            # 支持的输出/容器格式列表
│     │  └─ messages.js           # UI / IPC 使用的消息常量
│     └─ utils/
│        ├─ app-helpers.js        # Electron / 渲染器辅助函数
│        ├─ format.js             # 输出格式化（时间、大小等）
│        ├─ storage.js            # 本地存储封装（localStorage / json 文件）
│        ├─ theme.js              # 主题与样式相关帮助函数
│        └─ validators.js         # 输入/文件/参数校验函数
```

**学习项目声明**
本仓库为个人学习与实验性项目，目的是用于掌握 Electron + Vite + Vue 3 与 FFmpeg 集成相关的开发技术，不代表生产就绪的软件。
- 引用：若在公开场合引用或基于本项目开发，请保留相应说明与作者信息。  
- 责任声明：本项目按“原样”提供，不承担因使用或依赖本项目产生的任何直接或间接责任或损失。  
- 第三方许可：项目依赖 ffmpeg 等第三方工具，使用时需遵守其各自授权与使用条款。  