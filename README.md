# Aliya\_Cosmos

本项目是基于《彼方的她》游戏二创，截至目前暂未完成所有功能。有 bug 和建议欢迎反馈。

反馈邮箱：<laoqi_young@qq.com>

## 启动项目

```bash
# 安装依赖
npm install

# 开发模式（同时启动 Vite dev server + Electron 窗口）
npm start

# 仅启动 Vite dev server（不启动 Electron）
npm run vite_test
```

## 打包构建

```bash
# Vite 构建 + 混淆（输出到 election/page/）
npm run vite_build

# Electron 打包为 exe（输出到 dist/）
npm run ele_pack

# electron-builder 打包为 NSIS 安装包（输出到 dist_electron/）
npm run build
```

构建时使用 npmmirror 镜像下载 Electron 和构建工具，无需科学上网。

## 架构

- **Electron 主进程**：`main.js` — 创建窗口，dev 模式加载 `localhost:3000`，prod 模式加载 `election/page/index.html`
- **Preload**：`preload.js` — 通过 `contextBridge` 暴露 `electronAPI`（日志、退出、窗口焦点检测）
- **渲染进程**：`index.html` + `js/index.js` — 游戏核心逻辑
  - 对话系统：按时间阶段推进，支持玩家选项、图片消息、开关交互
  - 资源系统：O₂（氧气）、H₂O（水）、ENG（能量）实时衰减/补充
  - 存档：localStorage 持久化，支持断点续玩
- **剧情数据**：`res/data/data.json` — 分阶段对话脚本，含时间戳、音乐、心率等参数
- **构建**：Vite + `vite-plugin-obfuscator` 混淆 → `election/page/`，再通过 electron-packager 或 electron-builder 打包

## 项目结构

```
web_aliya_cosmos/
├── main.js                      # Electron 主进程入口
├── preload.js                   # Electron preload 脚本
├── package.json                 # 项目配置与脚本
├── vite.config.js               # Vite 构建配置（publicDir: res/）
├── index.html                   # 前端入口页面
├── QDW.ico                      # 应用图标
├── css/
│   ├── index.css                # 主样式
│   └── popup.css                # 弹窗样式
├── js/
│   ├── index.js                 # 游戏核心逻辑（对话、资源、通知）
│   ├── load.js                  # 剧情数据加载与存档恢复
│   ├── settings.js              # 用户名设置弹窗
│   ├── enums/
│   │   └── action_enum.js       # 操作枚举（EOH/EH）
│   ├── operation_init.js        # 初始化连接操作
│   ├── operation_closeWindow.js # 关闭窗口操作
│   └── utils/
│       ├── clientUtils/
│       │   └── logger.js        # Node.js 端日志（主进程/preload）
│       └── webUtils/
│           └── logger.js        # Web 端日志桥接
├── res/                         # 静态资源（Vite publicDir）
│   ├── data/
│   │   └── data.json            # 剧情数据
│   ├── img/                     # 图片资源
│   ├── music/                   # 音乐与音效
│   └── animation/               # 动画（心跳、等待、计时器）
├── election/
│   └── page/                    # Vite 构建输出（gitignored）
└── logs/                        # 运行日志（gitignored）
```

## 命令参数说明（/package.json）

### `npm start`

```
set NODE_ENV=dev                                    # 设置开发环境变量
concurrently -k                                     # 并行运行，任一退出则全部终止
  "npx vite --port 3000"                            #   启动 Vite dev server，监听 3000 端口
  "npx wait-on http://localhost:3000 && electron ."  #   等待 Vite 就绪后启动 Electron
```

| 参数                              | 含义                                   |
| ------------------------------- | ------------------------------------ |
| `concurrently -k`               | 并行执行多个命令，`-k` 表示任一进程退出时杀死其余进程        |
| `vite --port 3000`              | Vite dev server 监听 localhost:3000    |
| `wait-on http://localhost:3000` | 轮询等待该 URL 可访问后再继续（避免 Electron 窗口空白）  |
| `electron .`                    | 以当前目录启动 Electron，读取 `main` 字段指向的入口文件 |

### `npm run vite_build`

```
npx vite build
```

Vite 生产构建，输出到 `election/page/`。`vite.config.js` 中配置了：

| 配置项                 | 值                 | 含义                         |
| ------------------- | ----------------- | -------------------------- |
| `base`              | `"./"`            | 资源路径使用相对路径，适配本地文件加载        |
| `build.outDir`      | `"election/page"` | 构建产物输出目录                   |
| `build.minify`      | `"terser"`        | 使用 Terser 压缩 JS            |
| `publicDir`         | `"res"`           | 将 `res/` 作为静态资源根目录，直接复制到输出 |
| `server.port`       | `3000`            | Dev server 端口              |
| `viteObfuscateFile` | —                 | 混淆插件：控制流扁平化、死代码注入、字符串数组混淆  |

### `npm run ele_pack`

```
set NODE_ENV=prod                                                                        # 生产环境
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/                              # Electron 下载镜像
npx electron-packager . QDW_demo                                                         # 从当前目录打包，应用名 QDW_demo
    --platform=win32                                                                     # Windows 平台
    --arch=x64                                                                           # 64 位架构
    --out=dist                                                                           # 输出到 dist/
    --overwrite                                                                          # 覆盖已有输出
    --icon=QDW.ico                                                                       # 应用图标
    --asar                                                                               # 将资源打包为 app.asar
    --ignore="logs" --ignore="dist_electron" --ignore="election/dist"                    # 忽略目录
```

| 参数                 | 含义                                 |
| ------------------ | ---------------------------------- |
| `--platform=win32` | 目标平台 Windows                       |
| `--arch=x64`       | 目标架构 64 位                          |
| `--out=dist`       | 打包输出目录                             |
| `--overwrite`      | 覆盖已有的输出文件                          |
| `--icon=QDW.ico`   | exe 图标                             |
| `--asar`           | 将应用文件打包成 `app.asar` 归档，减少小文件数量     |
| `--ignore`         | 排除不需要打包的目录（日志、其他构建产物等）             |
| `ELECTRON_MIRROR`  | 指定 Electron 二进制下载镜像，解决 GitHub 访问问题 |

### `npm run build`

```
set NODE_ENV=prod
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/                      # Electron 下载镜像
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/  # 构建工具镜像
electron-builder --win --x64                                                     # Windows x64 构建
```

`package.json` 中 `build` 字段的配置：

| 配置项                                       | 值                 | 含义                  |
| ----------------------------------------- | ----------------- | ------------------- |
| `asar: true`                              | —                 | 将应用文件打包为 `app.asar` |
| `appId`                                   | `"com.qdw.yae"`   | 应用唯一标识              |
| `productName`                             | `"QDW_demo"`      | 安装后显示的应用名称          |
| `win.target`                              | `"nsis"`          | 打包为目标为 NSIS 安装程序    |
| `win.icon`                                | `"./QDW.ico"`     | exe 图标路径            |
| `electronDownload.mirror`                 | npmmirror         | Electron 二进制下载镜像    |
| `directories.output`                      | `"dist_electron"` | 安装包输出目录             |
| `files`                                   | 见下方               | 指定打包进 asar 的文件，其余忽略 |
| `nsis.oneClick`                           | `false`           | 关闭一键安装（允许用户选择安装路径）  |
| `nsis.perMachine`                         | `false`           | 按用户安装（非所有用户）        |
| `nsis.allowElevation`                     | `true`            | 允许请求管理员权限           |
| `nsis.allowToChangeInstallationDirectory` | `true`            | 允许用户修改安装目录          |

**`files`** **白名单**：只打包以下文件，大幅缩小包体积：

| 文件                               | 用途              |
| -------------------------------- | --------------- |
| `main.js`                        | Electron 主进程入口  |
| `preload.js`                     | Preload 脚本      |
| `js/utils/clientUtils/logger.js` | 主进程日志模块         |
| `election/page/**/*`             | Vite 构建的前端页面和资源 |
| `QDW.ico`                        | 应用图标            |

对比之前的 `"**/*"`（全项目无条件打包，包含 `node_modules`、日志等），现在包体积显著减小、打包速度更快。

## 开发说明

- 开发时只需运行 `npm start`，会自动启动 Vite dev server 并等待就绪后打开 Electron 窗口
- 生产构建流程：先 `npm run vite_build` 构建前端，再 `npm run ele_pack`（裸 exe）或 `npm run build`（NSIS 安装包）
- 日志文件位于 `logs/` 目录，按日期分文件夹
- 按 `Shift` 键可跳过当前阶段等待时间
- 构建已配置 npmmirror 镜像，无需科学上网

@LaoQi @芽衣球
