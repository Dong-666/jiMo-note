# 极墨 (JiMo) — 移动端 Markdown 编辑器设计文档

## 1. 概述

极墨是一款面向移动端的 Markdown 编辑器 Web App (PWA)，以 GitHub 仓库为存储后端，提供类似 Typora 的 WYSIWYG 写作体验。

### 核心场景

> Typora 在电脑上编辑仓库，极墨在手机上快速补位。打开即写，写完即走，两边同一个 GitHub 仓库无缝衔接。

### 用户工作流

```
电脑 (Typora) ──→ 本地 Git 仓库 ──→ GitHub ──→ 极墨 (手机)
                                                      │
                                            ┌─────────┴─────────┐
                                            │ 打开最近文件       │
                                            │ 或浏览文件树       │
                                            │ WYSIWYG 编辑      │
                                            │ 一键保存 → commit │
                                            └───────────────────┘
```

### 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 框架 | React 18 + TypeScript | 生态成熟，Milkdown React 绑定支持 |
| 构建工具 | Vite + PWA 插件 | 快速 HMR，PWA 开箱支持 |
| 编辑器引擎 | Milkdown v7 (MIT) | Markdown 原生 WYSIWYG，插件体系灵活 |
| 状态管理 | Zustand | 轻量，适合移动端 |
| 离线缓存 | IndexedDB (via `idb`) | 结构化缓存 |
| GitHub API | Octokit | 官方 SDK |
| 路由 | React Router v6 | 标准方案 |
| 样式 | Tailwind CSS | 移动端响应式首选 |
| 图标 | Lucide React | 轻量级图标集 |
| 浮动定位 | @floating-ui/react | Milkdown 已依赖 |
| 弹窗/Sheet | 自建 (headless) | 控制体积，无额外依赖 |

---

## 2. 架构

### 分层架构

```
┌─────────────────────────────────────────────────┐
│                    UI Layer                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Login    │ │ File     │ │  Milkdown        │ │
│  │ Screen   │ │ Tree     │ │  Markdown Editor │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────┤
│                  Service Layer                    │
│  ┌──────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ Auth Service │ │ GitService │ │ Sync       │ │
│  │ (PAT 管理)   │ │(GitHub API)│ │ Engine     │ │
│  └──────────────┘ └────────────┘ └────────────┘ │
├─────────────────────────────────────────────────┤
│                   Storage Layer                   │
│  ┌────────────────────┐ ┌──────────────────────┐ │
│  │   IndexedDB        │ │   GitHub (远程源)     │ │
│  │   (离线缓存)        │ │   (唯一事实来源)      │ │
│  └────────────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Repository Pattern (多仓库预留)

```typescript
interface GitHostingService {
  getTree(path: string, recursive?: boolean): Promise<FileNode[]>
  getFile(path: string): Promise<{ content: string; sha: string }>
  saveFile(path: string, content: string, message: string): Promise<void>
  deleteFile(path: string, message: string): Promise<void>
  getRepoMeta(): Promise<RepoMeta>
  getReadme(): Promise<string>
}

class GitHubPATService implements GitHostingService {
  constructor(
    private token: string,
    private owner: string,
    private repo: string,
    private octokit: Octokit,
  ) {}
}
```

---

## 3. 认证

### 流程

```
用户进入 /login →
  输入 Fine-grained PAT →
  点击验证 →
    → GitHub API GET /user → 验证 token 有效性
    → 输入 owner/repo → 验证仓库存在
    → Token 加密存入 localStorage
    → 跳转 /repo/:owner/:name
```

- Token 使用 Web Crypto API AES-GCM 加密后存储
- 提供 Settings 页面查看/更换/清除 Token
- 不引入 OAuth 流程，PAT 更简单直接

### 状态管理 (Zustand)

```typescript
interface AuthState {
  token: string | null
  owner: string
  repo: string
  isVerified: boolean
  login: (token: string) => Promise<void>
  configureRepo: (owner: string, repo: string) => Promise<void>
  logout: () => void
}
```

---

## 4. 路由 & 页面

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Redirect | 已登录→`/repo/:owner/:name`，未登录→`/login` |
| `/login` | `LoginPage` | PAT 输入 + 仓库配置 |
| `/repo/:owner/:name/*` | `FileTreePage` | 文件树浏览（支持子路径） |
| `/edit/:owner/:name/*` | `EditorPage` | Markdown 编辑器 |
| `/settings` | `SettingsPage` | Token 管理、主题、关于 |

---

## 5. 文件树

### 布局

文件树页面顶部展示「最近编辑」区（最近保存过的 5 个文件），下方是目录浏览。

### 交互

| 操作 | 行为 |
|------|------|
| 最近编辑文件 | 点击直接进入编辑器 |
| 点击目录 | 进入子目录 |
| 点击 `.md` 文件 | 进入编辑器 |
| 点击非 `.md` 文件 | 提示不支持编辑 |
| 下拉 | 刷新文件列表（重新请求 GitHub API） |
| 浮动按钮 (+) | 新建 `.md` 文件 |

> 文件管理（重命名/删除）在电脑上用 Typora 或 Git 客户端处理，手机端保持极简。

### 数据流

```
进入目录 → 检查 IndexedDB 缓存 → 有缓存 → 先显示缓存
                                  → 同时后台请求 GitHub API → 更新缓存 + UI
                                  → 无缓存 → 请求 GitHub API → 缓存 + 显示

下拉刷新 → 强制请求 GitHub API → 更新缓存 + UI
```

---

## 6. 编辑器 (核心)

### 插件清单

```typescript
import { Editor, rootCtx } from '@milkdown/core'
import { ReactEditor, useEditor } from '@milkdown/react'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { trailing } from '@milkdown/plugin-trailing'
import { clipboard } from '@milkdown/plugin-clipboard'
import { upload } from '@milkdown/plugin-upload'
```

### 移动端 UI 组件

自建 UI 替代 Milkdown 的桌面版组件，全部针对触屏优化：

| 组件 | 位置 | 功能 |
|------|------|------|
| `FormatToolbar` | 选中文字上方浮动 | 加粗 / 斜体 / 删除线 / 行内代码 / 链接 |
| `KeyboardToolbar` | 虚拟键盘上方 | 快捷插入 `#` `*` `-` `` ` `` `>` 等符号 |
| `EditorTopBar` | 页面顶部 | 返回 + 文件名 + 保存按钮（编辑时自动隐藏） |
| `SaveStatusBar` | 编辑器底部 | 保存状态提示（idle/saving/success/error） |

### 保存流程

```
用户点击保存按钮
  → 获取 Milkdown markdown 输出
  → SHA 计算内容 hash → 对比上次保存 hash
  → 无变化 → Toast "内容无变化"
  → 有变化：
    → GitHub API PUT /repos/{owner}/{repo}/contents/{path}
      body: { message: "Update via 极墨", content: base64, sha: currentSha }
    → 更新 IndexedDB 缓存
    → 更新本地 sha 记录
    → Toast "已保存 ✓"
  → 失败 → Toast 错误信息 + 按钮恢复可重试
```

### 保存按钮状态

```
idle ──点击──▶ saving ──成功──▶ success (1.5s) ──▶ idle
                   └──失败──▶ error ──点击──▶ saving
```

### 沉浸模式

- 编辑时 EditorTopBar 自动隐藏
- 点击屏幕顶部区域唤出
- 全屏编辑，最大化可视面积

---

## 7. 同步 & 离线

### 原则

> GitHub 是唯一事实来源。极墨不做本地优先，只做在线编辑 + 浏览缓存。

| 场景 | 行为 |
|------|------|
| 打开文件 | 请求 GitHub API → 存入缓存 → 显示 |
| 离线打开文件 | 读取 IndexedDB 缓存 → 显示（浏览只读） |
| 保存文件 | 直接提交 GitHub API → 更新缓存 |

### 冲突处理

当同一个文件在电脑 (Typora) 和手机 (极墨) 同时编辑时，先提交到 GitHub 的一方成功，后提交的一方遇到 **409 Conflict**（SHA 不匹配）。

```
极墨保存 → GitHub 409 → 底部弹出 Sheet：

┌────────────────────────────┐
│  文件已被其他人修改        │
│                            │
│  ┌──────────────────────┐  │
│  │ 覆盖并保存           │  │
│  │ 放弃修改，重新加载    │  │
│  │ 取消                 │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

| 选项 | 行为 |
|------|------|
| 覆盖并保存 | 拉取最新 SHA → 用当前内容重新提交，覆盖远程 |
| 放弃修改，重新加载 | 拉取最新内容 → 替换编辑器内容 |
| 取消 | 关闭 sheet，保留编辑器当前内容等待用户后续操作 |

---

## 8. 组件树

```
<App>
  <ThemeProvider>
    <Router>
      <Layout>
        <Routes>
          /login
            <LoginPage>
              <PATInput />
              <RepoConfig />

          /repo/:owner/:name/*
            <FileTreePage>
              <RecentFiles />       ← 最近 5 个文件，点击直接编辑
              <DirBreadcrumb />
              <FileList>
                <FileRow />      ← .md 文件，点击进编辑器
                <DirRow />       ← 目录，点击进入
              </FileList>
              <PullToRefresh />
              <FloatingActionButton />  ← 新建 .md

          /edit/:owner/:name/*
            <EditorPage>
              <EditorTopBar />      ← 返回 + filename + 保存按钮
              <MilkdownEditor>
                <FormatToolbar />   ← 选中文字浮动
                <EditorArea />      ← ProseMirror 实例
              </MilkdownEditor>
              <KeyboardToolbar />   ← 键盘附件栏
              <SaveStatusBar />     ← 保存状态
              <UnsavedSheet />      ← 未保存返回确认

          /settings
            <SettingsPage>
              <TokenManager />
              <ThemeToggle />
              <AboutSection />
        </Routes>
        <Toast />
        <ConfirmSheet />
      </Layout>
    </Router>
  </ThemeProvider>
</App>
```

---

## 9. 目录结构

```
jimo/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── public/
│   ├── manifest.json          ← PWA manifest
│   └── icons/                 ← PWA icons
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── routes/                ← 路由页面
│   │   ├── LoginPage.tsx
│   │   ├── FileTreePage.tsx
│   │   ├── EditorPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── components/            ← 通用 UI 组件
│   │   ├── Layout.tsx
│   │   ├── TopBar.tsx
│   │   ├── Toast.tsx
│   │   ├── ConfirmSheet.tsx
│   │   ├── PullToRefresh.tsx
│   │   └── Loading.tsx
│   │
│   ├── editor/                ← 编辑器相关
│   │   ├── MilkdownEditor.tsx  ← React 封装
│   │   ├── FormatToolbar.tsx
│   │   ├── KeyboardToolbar.tsx
│   │   ├── SaveStatusBar.tsx
│   │   └── editor-config.ts   ← Milkdown 插件配置
│   │
│   ├── file-tree/             ← 文件树相关
│   │   ├── FileList.tsx
│   │   ├── FileRow.tsx
│   │   ├── DirRow.tsx
│   │   ├── DirBreadcrumb.tsx
│   │   ├── RecentFiles.tsx
│   │   └── NewFileDialog.tsx
│   │
│   ├── services/              ← 业务逻辑层
│   │   ├── git-service.ts     ← GitHub PAT 实现
│   │   ├── auth-service.ts    ← Token 加密/存储
│   │   └── sync-engine.ts     ← 离线队列 + 冲突处理
│   │
│   ├── stores/                ← Zustand 状态管理
│   │   ├── auth-store.ts
│   │   ├── file-tree-store.ts
│   │   └── editor-store.ts
│   │
│   ├── lib/                   ← 工具函数
│   │   ├── crypto.ts          ← Web Crypto AES-GCM
│   │   ├── cache.ts           ← IndexedDB 封装
│   │   └── config.ts          ← 常量配置
│   │
│   └── styles/
│       └── globals.css        ← Tailwind 基础样式 + 编辑器主题
```

---

## 10. 非功能性需求

| 需求 | 目标 |
|------|------|
| 首屏加载 | < 2s (Fast 3G) |
| 包体积 | 生产构建 < 300KB gzip |
| 离线可用 | 缓存文件浏览 + 编辑（仅保存时需联网） |
| 兼容性 | iOS Safari 15+ / Chrome 90+ / 微信内置浏览器 |
| PWA | 可安装到主屏幕，Service Worker 缓存静态资源 |
| 安全性 | Token AES-GCM 加密存储，不写日志 |

---

## 11. 未来扩展（预留）

- 多仓库配置（扩展 `GitHostingService` 接口，Settings 页面选择仓库）
- GitLab / Gitee 兼容（新增实现类）
- 全文搜索
- 导出 PDF / HTML
- AI 辅助写作（Milkdown v7.21 已集成 AI 插件，可后期加入）
