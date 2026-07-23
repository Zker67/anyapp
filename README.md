# AnyApp

AnyApp 是一个面向 Windows 的离线优先软件启动与整理工具。它支持本地 `.exe` 和结构有效的 `.lnk`，用带 schema 版本的 JSON 保存软件清单、分类、设置与启动统计，不依赖数据库或本地 HTTP 服务。

## 当前定位

- 便携版优先：首个里程碑生成独立 `AnyApp.exe`，安装版延后。
- 本地优先：界面、字体、图标组件和核心功能不依赖 CDN 或远程服务。
- 数据可理解：`config.json` 是唯一持久化事实来源，可导入、导出并从轮换备份恢复。
- 扫描零执行：扫描只枚举候选、读取文件描述并提取关联图标，不启动发现的软件。
- 明确边界：首版支持 `.exe` / `.lnk`，不支持 `.bat` / `.cmd`。

## 使用说明

### 添加第一个软件

1. 点击顶部的“添加软件”，填写名称并选择本地 `.exe` 或 `.lnk` 文件。
2. 如果需要一次整理多个软件，点击“扫描”并选择目录。扫描结果只是候选预览，可以取消、取消勾选或修改名称；只有确认后才会写入正式配置。
3. AnyApp 不支持 `.bat` / `.cmd`。目录扫描只读取候选信息和图标，不会执行发现的软件。

### 查找、启动与管理

- 左侧导航可切换全部、收藏、最近、路径异常、未分类和自定义分类。
- 搜索框支持软件名称、标签、描述、分类和路径；排序菜单可调整清单顺序。
- 点击软件行的“启动”运行程序，星标按钮用于加入或移出收藏。
- “更多”菜单包含资源管理器定位、打开网站、创建桌面快捷方式、编辑和删除记录。删除记录不会删除磁盘上的软件；打开网站前会显示完整目标地址。
- 如果软件路径失效，可先打开“路径异常”筛选，再到“数据与行为设置”中按原根目录和新根目录批量重新定位。

### 设置与本地数据

- “数据与行为设置”可以选择启动软件后保持、最小化或退出 AnyApp，并可开启紧凑清单。
- JSON 导入会先展示来源格式、软件与分类数量以及迁移提示，确认前不会覆盖当前配置。
- 配置可以导出为 JSON；普通保存会轮换保留最近 3 份备份，可在设置中选择有效备份恢复。
- 便携版数据默认位于 `AnyApp.exe` 同级的 `AnyAppData/`。移动便携版时，应同时移动可执行文件和该目录。

### 键盘操作

| 按键 | 操作 |
|---|---|
| `Ctrl+K` | 聚焦并选中搜索框内容 |
| `/` | 未在输入框或弹窗中时聚焦搜索框 |
| `↑` / `↓` | 在当前搜索和筛选结果中移动选择 |
| `Enter` | 启动当前选中的健康软件 |
| `Escape` | 关闭弹层；没有弹层时清空搜索 |

应用顶部的问号按钮可以随时打开内置“使用说明”。

## 工作台界面

- 前端使用 React、Tailwind CSS 4 和本地 Base UI source-first 组件层；Dialog、Sheet、Select、Switch、Tooltip 和 DropdownMenu 使用同一套行为原语。
- `src/styles/anyapp.css` 是颜色、字体、焦点、路径健康和 reduced-motion 的主题事实源。
- 主窗口采用顶部搜索、左侧筛选轨和高密度软件行；每行只常驻启动、收藏和更多菜单。
- 更多菜单集中提供资源管理器定位、网站、桌面快捷方式、编辑和删除，删除始终位于末尾并单独分隔。
- `Ctrl+K` 或 `/` 聚焦搜索，方向键移动当前软件，Enter 启动健康软件，Escape 关闭弹层或清空搜索。
- `840 × 600` 已通过无横向溢出的技术 smoke；最终视觉密度、DPI 和交互手感仍以人工验收为准。

## 开发

环境要求：Node.js、npm、Rust stable、Tauri 2 的 Windows 构建依赖和 WebView2。

```bash
npm install
npm run test
npm run lint
npm run build
npm run tauri dev
```

Rust 门禁在 `src-tauri/` 目录执行：

```bash
cargo fmt -- --check
cargo check
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

## 便携数据目录

release 模式默认把数据放在可执行文件同级的 `AnyAppData/`：

```text
Portable/
├── AnyApp.exe
└── AnyAppData/
    ├── config.json
    ├── config.backup.1.json
    ├── config.backup.2.json
    ├── config.backup.3.json
    └── icons/
```

移动便携版时，应同时移动 `AnyApp.exe` 和 `AnyAppData/`。debug 模式使用项目根目录 `.dev-data/`，避免把测试数据写入 release 目录。

可以用环境变量覆盖数据目录，但必须提供绝对路径：

```powershell
$env:ANYAPP_DATA_DIR = 'D:\PortableData\AnyApp'
npm run tauri dev
```

相对值会在启动时被拒绝。

## JSON、保存与恢复

- 当前 schema 为 `schemaVersion: 1`。
- 前端只通过 typed Tauri client 调用 Rust；React 组件不直接读写文件。
- 保存流程为同目录临时文件写入、flush、磁盘同步、重新解析校验、轮换最近 3 份备份，再原子替换正式配置。
- 普通保存检测到损坏配置时会失败关闭，不会用默认值覆盖原文件。
- 恢复界面可选择有效备份，或先归档为 `config.corrupt.*.json` 后重置为空配置。
- JSON 导入先显示格式、数量和迁移 warning，确认后才替换当前配置。

## 扫描与路径健康

- 一次最多扫描 8 个根目录，深度最多 6 层，候选最多 1000 项。
- 不跟随符号链接或 junction，不执行候选文件。
- `.lnk` 必须先通过 Shell Link 文件头校验；目标只读取，不执行。
- 常见卸载器、更新器、安装器和崩溃报告器会被过滤。
- 应用列表显示路径健康和便携性；失效绝对路径可按原根目录与新根目录批量重新定位。
- 相对路径不能用 `..` 越过 `AnyApp.exe` 所在目录。

## 安全边界

- 外部链接只允许 `http` 和 `https`，打开前界面会显示完整目标。
- 用户文本只通过 React JSX 渲染，不使用 `innerHTML` 或 `dangerouslySetInnerHTML`。
- PowerShell 脚本为固定源码；候选路径、快捷方式目标和名称通过环境变量或临时 JSON 传递，不拼接进脚本。
- 图标只能按 UUID 缓存键读取，单文件上限 2 MiB。
- Tauri capability 仅包含核心默认权限，以及用户主动触发的文件打开/保存对话框权限。
- CSP 禁止远程脚本、对象、frame 和任意网络连接。

## 构建便携 exe

`src-tauri/tauri.conf.json` 当前设置 `bundle.active: false`，因此：

```bash
npm run tauri build
```

目标是生成 Windows release 可执行文件，不生成 MSI/NSIS 安装包。安装版、自动更新和跨平台发布不在当前里程碑范围内。

## 仍需人工验收

自动门禁不能替代以下真实 Windows 场景：

- Explorer 定位、真实 `.lnk`、桌面快捷方式和图标质量。
- 中文、空格、单引号、双引号路径，以及 OneDrive 桌面。
- 断网冷启动、不同 DPI、较小窗口、键盘完整流程和视觉交互。
- 实际启动第三方软件后的保持、最小化与退出行为。

## 计划

后续计划统一从 [`plans/README.md`](./plans/README.md) 进入。
