# 更新日志

## Unreleased

### 变更

- TenTap 补充扩展默认不挂块拖拽手柄（触屏不可用）；需手柄时传 `blockDragHandle: {}`
- TenTap `TableBridge` 关闭列宽拖拽（`resizable: false`）
- `tentap-demo`：点编辑区再弹键盘；顶栏改为笔记壳；Android `softwareKeyboardLayoutMode: resize`
- `tentap-demo`：键盘上方格式栏；标题与插入在栏内切换（不弹系统面板，避免抢焦点收键盘）；主栏含撤销/重做
- `tentap-demo`：主栏标题用「正 / H2 / H3」（笔记标题为「题」）；拍/图在主栏，链接与列表放进 +
- TenTap WebView：`.ProseMirror` 使用 `box-sizing: border-box`，避免空笔记也能上下滚
- TenTap 表格补单元格边框；光标在表内时工具栏提供加行/列、删行/列、删表，以及当前格左/中/右对齐（默认左）

### 修复

- `tentap-demo`：iOS / Android Expo 键盘弹出时把编辑区收到键盘上方（边到边时窗口不会缩小），长笔记不再被挡住；格式栏改为占位而不是叠在 WebView 上
- TenTap 插图后补空段落，光标不再停在图片上
- TenTap 链接：输入 URL 不再弄丢选区（避免在正文里新插一条链）；确定后光标在链后，后续输入不再带链；「关」可退出链接栏
- 图后内容删光仍能继续写：文末补段落；图后空段 / 选中图片时接管换行（含手机回车）；插图不再叠出多余空行

### 新增

- `tentap-demo`：主栏「拍 / 图」打开系统相机或相册，经 `ImageBridge.setImage` 写入（data URI）；插图后补空段落，光标在图下
- TenTap：链接在格式栏内填 URL（先记下选区再填，确定给选区加链；空选区插入链接文字）；代码块内栏上选语言（JS/TS/HTML/CSS/MD/纯）
- TenTap：插入栏「线」插入分割线，光标在线下空段；线仍是 1px，点击区域加高，上下间距与原先 1.5rem 对齐
- TenTap：插入栏「示」插入提示块，栏内切换信/示/警/危，「解」取消包裹
- TenTap：插入栏「行 / 块」在格式栏内填 LaTeX（块级用多行输入）；点已有公式可改；「流」插入 Mermaid 并显示图表预览，栏上「图 / 码」切换预览与源码

## 0.2.0

个人笔记向编辑器核心能力补齐：Slash / Callout / i18n、查找替换、脏状态、目录、块拖拽，以及宿主常用 API（模板、字数、只读、快捷键表）。

### 新增

- **Slash 命令**菜单与默认项；图片/文件上传钩子（`upload` / `onImageUpload`）
- **Callout** 提示块（`info` / `tip` / `warning` / `danger`），可通过 Slash 插入
- **i18n**（`locale`：`zh-CN` | `en` | 部分覆盖）；动作文案 `getActionLabel` / 快捷键项 `label`
- **查找替换**：`setFindQuery` / `clearFind` / `findNext` / `findPrevious` / `replaceCurrent` / `replaceAll`（Decoration 高亮）
- **脏状态**：`isDirty()` / `markClean()`（`setJSON` / `setHTML` / `setMarkdown` 自动 markClean）
- **目录**：`getHeadings()` / `scrollToHeading(pos)`（运行时 id，不写入文档）
- **块拖拽手柄**：仅顶层兄弟换位；公式/代码/Mermaid 禁整块原生拖；自定义落点指示条
- **`insertTemplate(content)`**：在选区插入 JSON 片段（或 `doc.content`）
- **字数统计**：`getWordCount` / `getCharCount` / `getSelectedWordCount`（另有 `getSelectedCharCount`）
- **只读**：`setEditable(false)` / `isEditable()`；隐藏光标、placeholder、拖拽手柄（不挤动布局）
- **`getShortcutList()`**：导出绑键表（含 i18n 显示名），供应用层渲染
- **标题策略**：`document` / `chunk` / `free`；document/chunk 下隐藏并拦截 H1
- 代码块语言配置；代码 / Mermaid / 块公式统一工具栏
- Demo 页：模板插入、只读、快捷键表、字数展示

### 变更

- Slash 菜单跨平台细滚动条
- 拖拽手柄：宿主左右 padding 对称，手柄负 margin 伸进左侧 padding

### 修复

- 块拖拽不再嵌入引用 / 提示块内部
- 只读切换不再导致正文左右跳动（手柄用 `visibility: hidden` 而非 `display: none`）

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
