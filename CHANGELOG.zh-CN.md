# 更新日志

## 0.1.0

### 新增
- 集成 KaTeX 数学公式（`@tiptap/extension-mathematics`，默认启用，可通过 `math` 选项配置）
- 集成 Mermaid 流程图（`MermaidCodeBlock` NodeView，支持编辑/预览切换）
- Demo 页新增公式与 Mermaid 示例内容（`test/main.ts`）
- 新增 CNB CI 流水线（`.cnb.yml`）
- `headingPolicyUtils` 和 `tableUtils` 工具函数从 `core/index.ts` 导出
- `EditorPlaceholderOptions` 类型从 `core/index.ts` 导出
- `createEditorPlaceholder` 和 `createTenTapSupplementalExtensions` 从 `web/index.ts` 补导出
- `EditorCoreOptions` 新增 `onDestroy` 生命周期回调
- `@tiptap/react` 补入 `peerDependencies`
- 新增 `typecheck` 脚本（`tsc --noEmit`）
- 引入 vitest 测试框架，覆盖单元测试和集成测试
- 补 MIT LICENSE 文件

### 破坏性变更
- `EditorCore` 的 `mount()` / `unmount()` 现在直接抛出错误（TipTap v3 已移除此 API，请通过构造函数 `element` 选项挂载）

### 变更
- （无）

### 修复
- `./tentap/editor-html` 导出路径现在 `npm publish` 前必定存在（`prepublishOnly` 中加入 `editor:build`）
- 清理 bridge 文件中所有 `as any` 类型断言

## 0.0.1

- 初始发布：基于 TipTap v3 的跨平台编辑器核心，支持 Web、Electron 及 TenTap
