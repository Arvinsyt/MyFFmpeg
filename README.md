# MyFFmpeg
基于 Electron + Vite + Vue 3 的桌面 GUI，封装并可视化调用 `ffmpeg`，用于媒体文件的转码、探测与进度显示。

#### 特性
- **可视化进度**：展示 FFmpeg 转换的实时进度与状态。
- **日志记录**：转换日志解析、实时查看与持久化保存。
- **文件探测**：查看输入媒体的详细信息。
- **可配置输出**：通过设置面板配置输出格式与编码器。

#### 快速开始
1. 安装依赖：
```powershell
npm install
```
2. 启动开发环境（Vite + Electron）：
```powershell
npm run dev
```

#### 项目结构
```
src/
├─ electron/
│  ├─ main/
│  │  ├─ index.cjs                # 主进程入口：窗口、生命周期、IPC
│  │  ├─ ffmpeg.cjs               # 构建/封装 ffmpeg 命令
│  │  ├─ ffmpeg-runner.cjs        # 管理 ffmpeg 子进程（队列、取消）
│  │  ├─ ffmpeg-progress-parser.cjs # 解析输出，提取进度
│  │  ├─ ffmpeg-logger.cjs        # 日志格式化与输出
│  │  └─ ffmpeg-log-writer.cjs    # 日志持久化
│  └─ preload/
│     └─ index.cjs                # contextBridge：向渲染器暴露受限 API
├─ renderer/
│  ├─ main.js                     # 渲染器入口（Vite）
│  ├─ App.vue                     # 根组件
│  ├─ components/                 # 视图组件
│  └─ shared/                     # 组合函数、常量与工具
```

#### 开发提示
- **日志查看**：运行转换后，查看 `logs/` 目录中的持久化日志文件以进行故障排查。
- **FFmpeg 路径**：确保本机已安装 `ffmpeg`，或在设置中指定自定义可执行文件路径。
- **调试**：在 Electron 开发模式下使用 DevTools 调试渲染器。

#### 学习项目声明
本仓库为个人学习与实验性项目，用于掌握 Electron + Vite + Vue 3 与 FFmpeg 集成开发技术，不代表生产就绪软件。
- **引用**：若在公开场合引用或基于本项目开发，请保留相应作者信息。
- **责任声明**：本项目按“原样”提供，不承担因使用或依赖本项目产生的任何直接或间接责任或损失。
- **第三方许可**：项目依赖 `ffmpeg` 等第三方工具，使用时请遵守其各自授权与使用条款。