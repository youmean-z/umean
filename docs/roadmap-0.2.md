# umean 0.2

目标版本：`0.2.0`  
定位：个人笔记编辑器核心能力补齐。完成一项勾一项；全部完成后发版并删除本文件。

## P0

- [x] 搜索替换：Decoration 高亮匹配项（区分当前项）；`setFindQuery` / `clearFind` / `findNext` / `findPrevious` / `replaceCurrent` / `replaceAll`
- [x] 脏状态：`docChanged` 标记 dirty；`getDirtyState()` / `markClean()`（`setContent` 后请 markClean；headingPolicy 自动修正不计脏）
- [x] 目录：`getHeadings()`（level / text / pos / 运行时 id / children）；`scrollToHeading(pos)`；id 不写入文档

## P1

- [x] 块拖拽：顶层 block 左侧手柄；仅顶层兄弟换位（不嵌入 callout/blockquote）；公式/代码/Mermaid 禁用整块原生拖

## P2

- [ ] `insertTemplate(content: JSONContent)` 插入预定义片段
- [ ] 字数统计：`getWordCount` / `getCharCount` / `getSelectedWordCount`
- [ ] 只读/预览：`setEditable(false)` + 隐藏光标/placeholder
- [ ] `getShortcutList()` 导出当前绑键表（应用层自行渲染）
