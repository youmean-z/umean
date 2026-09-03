# umean TenTap Demo

最小 Expo 示例：用 umean 的自定义 WebView HTML（`editor:build`）+ `createTenTapBridges()` 在模拟器/真机上跑通编辑器。

## 前置

- Node 20 / 22 更稳妥（Expo 57 对部分 Node 版本有 engine 要求）
- iOS：Xcode + 模拟器，或真机
- Android：Android Studio 模拟器，或真机
- 自定义 `editorHtml` 走 WebView `html` 源；**优先用 iOS / Android**（按 `i` / `a`）。浏览器 Web（按 `w`）仅作壳冒烟，已装 `react-native-web`；TenTap 真机验证仍以模拟器/真机为准。
- 若遇原生模块问题，再改用 Dev Client：`npx expo run:ios` / `run:android`

## 启动

在仓库根目录先构建 WebView 产物（gitignore，需本地生成）：

```bash
# 仓库根
npm run editor:build
```

再进 demo：

```bash
cd examples/tentap-demo
npm install
npx expo start
# 或：npm start → 按 i / a 开模拟器，或扫码真机
```

Metro 已配置 `watchFolders` 指向仓库根；`npm run demo:tentap`（根目录）会先 `editor:build` 再启动本示例。

然后按终端提示开 iOS / Android 模拟器，或扫码真机。

开发 WebView 侧时可另开：

```bash
# 仓库根
npm run editor:dev
```

并在 `App.tsx` 的 `useEditorBridge` 里临时加上 `DEV: true`（默认连 `http://localhost:3000`；模拟器访问本机请改 `DEV_SERVER_URL`）。

## 验证清单

- [ ] 编辑区出现初始标题与段落
- [ ] 进入页面时键盘不自动弹出；点正文后才弹出
- [ ] 短内容时编辑区不能无故上下滚动
- [ ] 正文左侧没有块拖拽手柄
- [ ] 点正文弹出键盘后，键盘上方出现格式栏（加粗 / 斜体 / 正或H2H3 / 拍 / 图 / + / 撤销 / 重做）
- [ ] 正文变长后仍能滚到光标，最后几行不被键盘挡住（Android Expo / iOS 都要看）
- [ ] 点拍：真机打开相机，拍完插入；图下有光标可继续打字（模拟器相机常不可用）
- [ ] 点图：打开系统相册，选图后插入正文（宽不超过编辑区）；图下有光标；把图后面的内容删光后仍能继续打字和换行 
- [ ] 点 + → 链接：栏内输入 URL，点「定」给**当前选区**加链接（不会在后面新插一条 URL）；无选区才插入链接文字；「关」退回主栏；加完继续打字不再带链；已有链接主栏出现「链」，可点「清」
- [ ] 点标题处「正」：可切正 / H2 / H3（不用大 A 图标）；笔记标题显示「题」且不可改级别
- [ ] 点 + → 列表 / 待办 / 引用
- [ ] 点 + → 示：插入提示块，栏上可选信/示/警/危；「解」取消包裹；光标在块内可继续打字
- [ ] 点 + → 行：栏内填 LaTeX，点「定」插入行内公式
- [ ] 点 + → 块：栏内多行填 LaTeX，点「定」插入块级公式（居中、更好点）；点公式可改，「清」删除
- [ ] 点 + → 流：插入流程图并显示图表；栏上「图 / 码」切换预览与源码
- [ ] 点 + → 线：插入分割线，线下有光标可继续打字；点线附近即可选中再删；把线后面的内容删光后仍能继续打字和换行
- [ ] 点 + → 代码：进入代码块后栏上可选 JS / TS / HTML / CSS / MD / 纯
- [ ] 点 + → 表：单元格有边框；光标在表内时栏上出现左/中/右、加行/加列、删行/删列/删表（默认左对齐）
- [ ] iOS 模拟器请关掉硬件键盘（I/O → Keyboard → Connect Hardware Keyboard），否则栏不会出现

## 说明

- Metro 通过 `watchFolders` 引用仓库根的 `src/tentap` 与 `tentap/editor-web/build`
- 宿主侧只挂 Bridge；Slash / 查找等 Web 能力尚未全接到 TenTap
