# 阶段 1：组件基础与 AnyApp 主题

- 状态：`[done]`
- 前置条件：执行者已阅读 [00-overview.md](./00-overview.md)

## 目标

在不建立运行时耦合的前提下，将已授权 source-first 组件源中实际需要的源码安装到 AnyApp，并让语义主题成为颜色、圆角、阴影、字体和状态的唯一事实源。

## 私有来源与公开仓库边界

- 执行时可以从本机已授权组件源或已认证 GitHub 会话读取源码。
- 不在 AnyApp 文件中记录私有组织名、仓库 URL、提交哈希、认证 endpoint 或本机私有路径。
- 如果需要记录导入基线，只保存在本轮执行日志或本地临时清单中，不进入公开项目。
- 导入完成后，AnyApp 内部使用本地路径和本地命名，不保留私有 registry namespace。

## 安装方式

1. 在授权组件源中运行其正式 registry build 和校验命令，确认生成物与源码一致。
2. 通过本地 registry URL 或等效的源码安装流程导入白名单 item。
3. 导入内容进入 AnyApp 自己的 `src/components/ui/`、`src/components/workbench/`、`src/hooks/` 和 `src/styles/`。
4. 不复制 Gallery、测试基线、计划、品牌素材、README、发布配置或完整 registry catalog。
5. 不建立自动同步脚本；后续升级必须通过新计划比较上游差异。

## 第一批白名单

### 基础与主题

- `theme` / 全局语义样式。
- `utils` / `cn()`。
- Theme provider 所需的最小逻辑；本轮固定暗色默认，不展示主题切换入口。

### UI primitives

- Button、IconButton。
- Badge、StatusDot。
- Card、Separator、ScrollArea。
- Input、Textarea、Field、Label、Select、Checkbox、Switch。
- SearchInput、SegmentedControl。
- Tooltip、DropdownMenu。
- Dialog、AlertDialog、Sheet。
- Empty、Spinner、Skeleton。
- Toast/Sonner 所需组件。

### 复合组件

- AppShell。
- Panel。
- EmptyState。
- SettingsBlock。
- DialogPanel。

## 明确排除

- 上游品牌锁定和品牌资产。
- Dither/WebGL 背景及 Three/R3F 依赖。
- Markdown 工作区、资源树、命令编辑器、日历和日期时间选择器。
- Gallery 展示组件、fixtures、视觉基线和 demo copy。
- 上游字体包；AnyApp 继续使用 Windows 本地字体栈。

## 依赖迁移

1. 添加白名单组件实际需要的 `@base-ui/react`、`sonner` 等依赖。
2. 保留已有 `class-variance-authority`、`clsx`、`tailwind-merge` 和 `lucide-react`。
3. 迁移 Dialog、Switch、Tooltip 和 Slot 使用点。
4. 所有迁移点完成后才移除：
   - `@radix-ui/react-dialog`
   - `@radix-ui/react-switch`
   - `@radix-ui/react-tooltip`
   - `@radix-ui/react-slot`
5. 依赖移除前运行全仓 import 搜索，不能通过删除 package 来暴露运行时错误。

## 主题落地

### 单一入口

建议建立：

```text
src/styles/anyapp.css
```

它负责：

- Tailwind CSS v4 import 与 source 声明。
- AnyApp semantic token。
- Base layer、scrollbar、focus 和 reduced-motion。
- 暗色默认主题。

`src/index.css` 只保留入口 import 或被该文件替代；`App.css` 不再承担主题定义。

### Token 规则

- 使用 `background`、`foreground`、`card`、`popover`、`primary`、`muted`、`border`、`ring`、`success`、`warning`、`destructive` 等语义名称。
- 产品特有语义增加 `health-healthy`、`health-missing`、`health-unsafe`，但不得再建立另一套平行基础色系统。
- 组件不得写 `bg-slate-*`、`text-slate-*` 或任意业务无关的十六进制颜色。
- 路径健康、警告和删除状态使用统一 tone，不由各组件自行选择颜色。

### 字体

- `--font-heading`：Bahnschrift 优先。
- `--font-sans`：Segoe UI Variable Text 优先。
- `--font-mono`：Cascadia Mono 优先。
- 不下载字体，不使用 Google Fonts 或 CDN。

## 基础组件验收

建立一个临时开发路由或测试 fixture，至少覆盖：

- Button 全部状态：默认、hover、active、focus、disabled、loading、danger。
- Input、Select、Switch、Checkbox 的键盘和 disabled 状态。
- Badge 和 StatusDot 的 healthy/missing/unsafe tone。
- Dialog、AlertDialog、Sheet 的 Escape、焦点锁定和焦点恢复。
- Tooltip、DropdownMenu 的键盘导航。
- `prefers-reduced-motion`。

临时 fixture 只能直接消费正式组件源码，不能复制第二份实现；阶段完成后决定保留为测试页或删除。

## 成功标准

- AnyApp 能独立 build，不依赖授权组件源在线或位于固定路径。
- 基础组件和主题均来自本地源码，文件中无私有侧标识。
- 语义 token 能表达 AnyApp 全部基础状态。
- Base UI 组件在 Tauri WebView 中可正常工作。
- 没有引入品牌资产、WebGL、远程字体或 CDN。

## 回滚点

- 本阶段只新增组件基础，不切换主界面。
- 如组件基础无法独立 build，删除新目录和新增依赖即可回到当前前端。
- 未完成主界面切换前不得修改 Rust commands 或 JSON 数据。
