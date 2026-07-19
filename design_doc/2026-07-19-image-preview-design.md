# 图片点击预览（Lightbox）功能设计

## 概述
在极墨编辑器中，用户点击 Markdown 渲染出的图片时，弹出 lightbox 遮罩层显示大图，支持缩放、滑动切换、全屏等交互。

## 技术方案
使用 `yet-another-react-lightbox` 库，插件启用 Zoom 和 Fullscreen。

## 组成部分

### 1. GitService 增强
- `src/services/git-service.ts` 新增 `getDefaultBranch(): Promise<string>`
- 调用 `repos.get` 获取默认分支，缓存到实例属性

### 2. 图片 URL 解析
`src/lib/resolve-image-url.ts`
- 全量 URL → 原样使用
- 相对路径 → `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{dir}/{path}`
- 绝对路径 `/...` → `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`

### 3. ImagePreview 组件
`src/components/ImagePreview.tsx`
- 封装 `yet-another-react-lightbox` 的 Lightbox
- 插件：Zoom, Fullscreen
- Props: `open`, `index`, `slides`, `onClose`, `onIndexChange`

### 4. EditorPage 集成
- 状态：`lightboxOpen`, `lightboxIndex`, `slides`
- 在 `.milkdown` 容器上用 capture phase 监听 img 点击
- 收集编辑器内所有 img，解析 URL，打开 lightbox
- 关闭：Esc / 点击遮罩 / 关闭按钮

## PC / Mobile 支持
库自动处理：
- PC：滚轮缩放、键盘导航（方向键 + Esc）
- Mobile：双指捏合缩放、滑动切换

## 边界处理
- 加载失败 → 库内置错误占位
- URL 含中文/空格 → encodeURI
- 所有图片 alt 文本传入作为 caption
