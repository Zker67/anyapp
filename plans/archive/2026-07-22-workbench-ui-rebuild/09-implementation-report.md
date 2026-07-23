# 实施报告：AnyApp 工作台前端重构

- 状态：`[partial]`（已归档）
- 计划日期：2026-07-22
- 实施日期：2026-07-22
- 最后更新：2026-07-23
- 自动门禁：完成
- Tauri 技术 smoke：完成
- 人工视觉验收：未通过；用户决定后续自行编辑视觉

## 实际导入范围

采用按需、source-first 方式建立 AnyApp 自己的本地组件层，没有整仓复制或运行时依赖：

- Base UI primitives：Button、Input、Textarea、Dialog、AlertDialog、Sheet、Switch、Tooltip、DropdownMenu、Select。
- AnyApp 本地组件：Badge、Field、Separator、Spinner、StatusDot、Sonner。
- 工作台组件：AnyAppShell、LibraryToolbar、FilterRail、LibraryControls、AppList、AppRow、SettingsBlock。
- 新增依赖：`@base-ui/react`、`sonner`。
- 移除依赖：`@radix-ui/react-dialog`、`@radix-ui/react-switch`、`@radix-ui/react-tooltip`。
- 明确未导入：上游品牌资产、字体、Gallery、WebGL、Three/R3F、远程图片和无关业务组件。

计划白名单中的 Card、Checkbox、ScrollArea、Skeleton 等没有为满足清单而无条件导入；当前界面没有证明需要它们，因此保持最小依赖闭包。

## 实际结构改动

- `src/styles/anyapp.css` 成为颜色、字体、边框、焦点、滚动条和 reduced-motion 的主题事实源。
- `App.tsx` 保留查询状态、命令编排和顶层弹层状态；工作台壳层、筛选轨、工具栏、列表和软件行拆入 `src/components/workbench/`。
- 主窗口改为顶部全局搜索、紧凑左侧筛选轨、内容控制栏和高密度软件行。
- 每个软件行只常驻启动、收藏和“更多”三个入口；更多菜单依次提供资源管理器定位、网站、桌面快捷方式、编辑、分隔线和删除记录。
- 新增/编辑、扫描和分类使用 Dialog；数据与行为使用右侧 Sheet；删除和外部链接使用 AlertDialog；反馈统一使用 Sonner。
- 全部原生分类、排序和设置选择器改为 Base UI Select。
- 保留冷灰、钴蓝、本地 Windows 字体和左侧路径健康轨；未引入旧主题原型视觉、持续环境动画或远程资源。

## 下拉菜单根因修复

首次真实打开软件行菜单时，Base UI 报错：

```text
Base UI: MenuGroupContext is missing.
Menu group parts must be used within <Menu.Group> or <Menu.RadioGroup>.
```

根因是视觉标题 `DropdownMenuLabel` 使用了 `MenuPrimitive.GroupLabel`，但软件行菜单没有语义分组。修复为普通视觉标题节点，不伪造 Group 结构，并新增服务端渲染回归测试，保证标题不再依赖菜单分组上下文。

修复后在 debug 和 release Tauri WebView 中均实际打开菜单，确认 5 个菜单项、危险项分隔、键盘 Space 打开、ArrowDown 导航、Escape 关闭和焦点恢复。

## 使用说明收口

- 顶部工具栏新增“使用说明”问号按钮，不改变既有主题、布局和视觉路线。
- 新增应用内可滚动说明弹窗，覆盖添加与扫描、筛选与搜索、启动与更多菜单、路径修复、设置、JSON 导入导出、三份轮换备份、便携数据目录、安全边界和快捷键。
- 项目 README 新增面向普通用户的完整操作章节，避免只保留开发和实现说明。
- 首轮最小窗口 smoke 发现说明正文被裁切且不能滚动；根因是弹窗中间网格行未限制为可收缩区域。仅在说明弹窗增加 `minmax(0, 1fr)` 行约束后，正文可独立滚动。
- 实际验证 Escape 关闭弹窗并把焦点返回“使用说明”按钮；`1200 × 800` 与 `840 × 600` 均无横向溢出，最小窗口可滚动到最后的键盘章节。

## 功能验证

| 验证项 | 命令或方法 | 结果 | 备注 |
|---|---|---|---|
| 前端测试 | `npm run test` | 通过，3 个文件 / 8 个测试 | 含搜索筛选排序、视图映射和菜单标题回归 |
| 前端 lint | `npm run lint` | 通过 | `oxlint .` 无输出 |
| 前端 build | `npm run build` | 通过 | 2173 modules；主 JS 542.58 kB，保留非阻断 chunk warning |
| Rust fmt | `cargo fmt -- --check` | 通过 | |
| Rust check | `cargo check` | 通过 | 仅 NTFS incremental hard-link 降级 warning |
| Rust test | `timeout 60s cargo test` | 通过，13/13 | 总构建检查 15.02s，用例 1.46s |
| Rust clippy | `cargo clippy --all-targets --all-features -- -D warnings` | 通过 | 代码 warning 为零；仅缓存硬链接环境 warning |
| Tauri dev smoke | 隔离测试配置 + WebView2 CDP | 通过 | 未启动测试软件，未写项目 `.dev-data` |
| Windows release build | `npm run tauri build` | 通过 | 产物 `src-tauri/target/release/AnyApp.exe`，9,876,480 bytes |
| release 菜单 smoke | release WebView2 CDP | 通过 | `tauri.localhost` 中实际打开菜单并核对全部菜单项 |

## 视觉与交互技术验收

| 场景 | 结果 | 备注 |
|---|---|---|
| `1200 × 800` 默认窗口 | 技术通过 | `scrollWidth === innerWidth === 1200`；菜单截图人工检查无裁切 |
| `840 × 600` 最小窗口 | 技术通过 | `scrollWidth === innerWidth === 840`；搜索、分类、启动和设置入口均在可视区 |
| Ctrl+K 与 `/` | 通过 | 均聚焦搜索；输入后 Escape 清空查询 |
| reduced-motion | 通过 | 模拟 `prefers-reduced-motion: reduce` 后动画和过渡降为 `0.01ms` |
| 设置 Sheet | 通过 | 打开、Escape 关闭、焦点返回设置按钮 |
| 添加/编辑 Dialog | 通过 | 均可打开并由 Escape 关闭 |
| 扫描 Dialog | 通过 | 初始焦点进入“选择目录并扫描”，Escape 后返回扫描按钮 |
| 分类 Dialog 与 Select | 通过 | Dialog、listbox 和 Escape 行为正常 |
| 软件行 DropdownMenu | 通过 | 鼠标和键盘均实际打开；ArrowDown、Escape、焦点恢复正常 |
| 删除 AlertDialog | 通过 | 危险确认可打开并由 Escape 关闭，未删除测试记录 |
| 外部链接 AlertDialog | 通过 | 完整显示 `https://example.com`，默认焦点为取消，未打开浏览器 |
| 使用说明 Dialog | 通过 | 内容完整；Escape 关闭并恢复焦点；最小窗口正文可滚动且无横向溢出 |

以上是技术 smoke，不替代用户对视觉密度、颜色、字重和操作手感的最终确认。

## 安全与去敏审计

- `package.json`、锁文件和 `src/` 中没有 `@radix-ui/*` 依赖或 import；基础行为统一为 Base UI。
- 产品源码、`dist/` 和 release exe 未发现旧主题品牌、角色设定文案、私有组件源名称、私有 URL、提交哈希或工作区绝对路径。
- `src/` 与 `dist/` 未发现 WebGL、Three/R3F、Google Fonts 或 CDN 依赖。
- production `dist/index.html` 只引用本地 `/assets/` 文件；Tauri CSP 不允许任意远程连接。
- `https://example.com` 只作为 URL 表单示例和隔离 smoke 数据，不是运行时请求。
- release 中仍包含 `crackUrl` 字符串，仅用于旧配置迁移识别、移除 warning 和测试，未进入 schema 或新配置输出。
- 本轮没有修改冻结来源的功能源码，也没有建立软链接、junction、子模块、共享源码或同步关系。

## 计划偏差

- 没有保留临时组件 Gallery/fixture；组件状态直接在真实 Tauri WebView 的隔离数据中验证，避免增加生产无关路由。
- `AppOverflowMenu` 没有单独拆文件；当前菜单只服务单个 `AppRow` 且逻辑短，继续放在行组件内更聚焦。
- 计划中的阶段内旧入口回滚文件未长期保留；新壳层通过 build 和桌面 smoke 后，已删除不再引用的旧 `AppCard.tsx`，避免双实现漂移。
- 自动技术验收已覆盖 `840 × 600`，但不同 DPI 和最终视觉手感仍保留为人工验收。

## 遗留项

- 用户明确认为当前视觉效果仍不理想，并决定后续自行编辑，因此总计划保持 `[partial]` 并归档，不标记 `[done]`。
- 未人工覆盖空软件库、路径异常、长中文名称、多分类和多标签的完整视觉矩阵。
- 未人工覆盖 100% / 125% / 150% DPI、断网冷启动和长时间使用手感。
- 未真实执行 Explorer 定位、真实 `.lnk`、桌面快捷方式、第三方软件启动和启动后窗口行为。
- 安装版、自动更新和 GitHub Release 未执行。

## 归档结论

- 工作台功能、Base UI 交互、下拉菜单、数据工具和使用说明达到可构建、可运行、可技术验证的状态。
- 视觉结果未达到用户期望，不计为视觉验收通过；这项事实不影响已完成的功能与安全门禁记录。
- 2026-07-23 按用户要求归档本计划。后续视觉编辑不再回写本计划状态，应以新计划或新的实现记录承接。

## 2026-07-23 归档复验

| 验证项 | 结果 |
|---|---|
| `npm run test` | 通过，3 个文件 / 8 个测试 |
| `npm run lint` | 通过 |
| `npm run build` | 通过，2173 modules；保留非阻断 chunk warning |
| `cargo fmt -- --check` | 通过 |
| `cargo check` | 通过 |
| `timeout 60s cargo test` | 通过，13/13；13.03s 完成构建检查，用例 1.75s |
| `cargo clippy --all-targets --all-features -- -D warnings` | 通过，代码 warning 为零 |
| 仓库 Markdown 相对链接 | 全部可解析 |
| 发布候选扫描 | 未发现密钥、真实用户清单、工作区绝对路径、旧品牌名称或未忽略的构建/用户数据目录 |

Cargo 仍提示当前磁盘无法为 incremental cache 建立硬链接并自动退化为复制；这是环境性能 warning，不影响检查和测试结果。
