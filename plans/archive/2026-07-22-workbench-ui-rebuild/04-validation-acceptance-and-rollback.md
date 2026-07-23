# 阶段 4：验证、视觉验收与回滚

- 状态：`[partial]`
- 前置条件：阶段 1–3 的功能迁移完成
- 归档说明：自动门禁与技术 smoke 已完成；用户未接受最终视觉并决定后续自行编辑，因此本阶段保持 `[partial]`

## 目标

证明前端重构没有破坏现有功能、安全边界、离线能力和桌面可用性，并由用户完成最终视觉与交互确认。

## 自动门禁

在 `anyapp/` 执行：

```bash
npm run test
npm run lint
npm run build
```

如果新增组件测试或浏览器功能测试，统一接入现有 npm scripts，不创建无法发现的临时测试入口。

后端虽不在改动范围，仍执行最小集成门禁：

```bash
cd src-tauri
cargo fmt -- --check
cargo check
timeout 60s cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

## 定向测试

至少覆盖：

- 名称、标签、描述、分类和路径搜索。
- 全部、收藏、最近、异常和分类筛选。
- 名称、最近启动和启动次数排序。
- 软件行操作菜单内容与危险项分隔。
- 路径异常时启动禁用。
- `Ctrl+K`、`/`、上下键和 Enter。
- Dialog、Sheet、Menu 的 Escape 与焦点恢复。
- 表单错误焦点和外部链接完整显示。
- reduced-motion 下无持续动画。

## Tauri 技术 smoke

1. `npm run tauri dev`。
2. 加载空配置并添加一条测试记录。
3. 搜索、筛选、打开编辑 Dialog、设置 Sheet 和更多菜单。
4. 关闭程序并确认 `.dev-data` 仍由既有 repository 管理。
5. `npm run tauri build` 生成 release exe。
6. 在隔离临时目录运行便携 exe，确认 `AnyAppData` 同级创建。

不得使用真实用户软件清单、真实用户路径或冻结来源配置进行自动 smoke。

## 视觉验收矩阵

视觉、动效和交互手感由用户人工确认，自动测试不能替代。

### 窗口尺寸

- `1200 × 800`：默认桌面。
- `840 × 600`：最小窗口。

### 数据状态

- 空软件库。
- 正常软件与多个分类。
- 收藏和最近启动。
- 路径失效、类型不支持、相对路径越界。
- 长中文名称、长路径、多标签。

### 交互状态

- 键盘选中与鼠标 hover。
- 行菜单打开。
- 新增/编辑 Dialog。
- 扫描预览。
- 设置 Sheet。
- 删除与外部链接 AlertDialog。
- 成功、warning、error toast。
- 损坏配置恢复页。

### 环境

- 100%、125%、150% DPI。
- `prefers-reduced-motion`。
- 断网冷启动。
- 中文、空格、单引号和双引号路径。

## 验收问题

用户验收时只需要回答以下核心问题：

1. 首屏是否比旧版更容易找到软件并启动？
2. 信息密度是否合适，是否仍像堆叠卡片？
3. 路径健康状态是否清晰但不喧宾夺主？
4. 菜单、弹窗和设置是否像同一套产品？
5. `840 × 600` 是否仍能完成主要任务？

任一核心问题得到否定回答，计划保持 `[in-progress]` 或 `[partial]`，不能因自动门禁通过而标记完成。

## 去敏与依赖审计

执行：

- 搜索私有组织名、私有仓库名、私有 URL、提交哈希和本机私有路径。
- 搜索旧主题品牌、角色设定、资源聚合文案和旧品牌资源。
- 搜索 `http://`、`https://`、CDN、远程字体和远程图片加载。
- 搜索残留 `@radix-ui/*` imports 与 package dependencies。
- 搜索上游品牌锁定、WebGL、Three/R3F 和未使用组件。
- 检查 release exe 与 `dist/` 不包含上述内容。

## 清理顺序

只有以下条件全部满足后才清理旧实现：

1. 新 AppShell build 和桌面 smoke 通过。
2. 所有旧弹层已迁移。
3. Radix import 为零。
4. 用户确认视觉方向。

随后才能：

- 删除旧 `App.css` 中已失效 selector。
- 删除旧 UI primitives。
- 移除 Radix dependencies。
- 删除临时组件 Gallery/fixture。
- 更新 `README.md` 的前端结构说明和人工验收项。

## 回滚策略

### 阶段内回滚

- 每阶段完成前保持旧入口可用。
- 新组件失败时只回退该功能区，不回退 Rust 或 JSON 数据。
- 禁止通过删除测试、关闭 strict 或跳过可访问性检查获得通过。

### 用户验收回滚

- 用户否定视觉方向时，保留新组件基础，先回退 AppShell 入口。
- 根据具体问题调整密度、层级和 token，不重新引入大卡片和七按钮布局。
- 如果授权组件源不适合某个 AnyApp 场景，只重写该复合组件，不更换整个技术路线。

## 文档收口

完成后：

- 更新本目录所有状态。
- 填写 [09-implementation-report.md](./09-implementation-report.md)。
- 同步 `anyapp/plans/README.md`。
- 更新 AnyApp README 中的组件基础、主题、键盘和人工验收说明。
- 不修改工作区根 README；只有项目元数据变化时才改 `manifest.txt` 并运行 `sync.sh`。

## 发布边界

本计划不授权：

- `git init`。
- commit、push、建 GitHub repo。
- 发布 release、安装包或 registry endpoint。
- 修改授权组件源仓库。
