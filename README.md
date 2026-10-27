# Side Bar for Arc Users — Arc Style

[![Version](https://img.shields.io/github/package-json/v/lizeyan/SideBarforArcUsers?filename=package.json&label=version&color=4f46e5)](package.json)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](public/manifest.json)
[![Build](https://github.com/lizeyan/SideBarforArcUsers/actions/workflows/build-release.yml/badge.svg?branch=main)](https://github.com/lizeyan/SideBarforArcUsers/actions/workflows/build-release.yml)
[![Latest Release](https://img.shields.io/github/v/release/lizeyan/SideBarforArcUsers?display_name=tag&sort=semver)](https://github.com/lizeyan/SideBarforArcUsers/releases/latest)
[![Release Downloads](https://img.shields.io/github/downloads/lizeyan/SideBarforArcUsers/total)](https://github.com/lizeyan/SideBarforArcUsers/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827)](https://react.dev/)
[![License](https://img.shields.io/badge/license-Apache--2.0-22c55e.svg)](LICENSE)

An independently maintained Chrome extension with one primary goal: make tab management in Chrome feel as close to Arc as the Chrome extension platform allows.

这是一个独立维护的 Chrome 扩展，核心目标只有一个：在 Chrome 扩展平台允许的范围内，让标签页管理体验尽可能接近 Arc。

Arc is the product and interaction reference for this fork. The extension-owned Side Panel is evaluated against Arc for visual density, Favorites, pinned pages, Spaces, active-tab treatment, menus, persistence, and interaction behavior. Chrome still owns the browser frame, address bar, horizontal tab strip, and Side Panel host header, so those surfaces cannot be replaced or restyled by an extension.

Arc 是这个分支的产品与交互参考。扩展自己绘制的 Side Panel 会从视觉密度、Favorites、固定页面、Spaces、活跃标签样式、菜单、持久化和交互行为等方面与 Arc 对照。Chrome 顶栏、地址栏、原生横向标签栏和 Side Panel 宿主标题栏由 Chrome 绘制，扩展无法替换或修改这些区域。

## Highlights / 核心功能

- **Arc-style unified sidebar / Arc 风格统一侧栏** — Favorites, pinned pages, folders, and ordinary tabs in one vertical panel. / 在一个垂直侧栏中统一管理 Favorites、固定页面、文件夹和普通标签页。
- **Focused Spaces / 专注的 Spaces** — Show one real Space at a time, without an aggregate `All` view. / 一次只展示一个真实 Space，不保留聚合的 `All` 视图。
- **Persistent pages / 持久固定页面** — Bookmark-backed pinned pages keep their location after the live tab closes. / 固定页面由书签承载，关闭真实 Tab 后仍保留位置并可重新打开。
- **Independent Tab-to-Space state / 独立的 Tab-Space 归属** — Space membership survives extension reloads and browser restoration without creating duplicate Saved Tab Groups. / Space 归属由扩展独立持久化，支持扩展重载和浏览器恢复，同时不再制造重复的 Saved Tab Groups。
- **Arc-like folder and active states / Arc 风格文件夹与活跃状态** — Collapsed folders can expose only their active descendant; active rows, icons, spacing, and menus follow Arc where Chrome APIs allow. / 折叠文件夹可只透出活跃子项，活跃行、图标、间距和菜单在 Chrome API 允许范围内与 Arc 对齐。
- **Native Chrome groups remain user-owned / 原生标签组保持独立** — Chrome tab groups still work normally, but no longer determine Space membership. / Chrome 原生标签组仍可正常使用，但不再决定标签页属于哪个 Space。
- **History, search, drag and drop / 历史、搜索与拖拽** — Navigate recently used tabs, filter content, and reorganize pins, bookmarks, tabs, and native groups. / 支持最近使用标签历史、内容筛选，以及 Pins、书签、Tab 和原生标签组的拖拽整理。
- **Optional AI naming / 可选 AI 命名** — Rename Favorites and pinned pages through a user-configured OpenAI-compatible endpoint. / 可通过用户自行配置的 OpenAI 兼容接口为 Favorites 和固定页面生成名称。

## Background / 背景

I've been using Arc Browser for a while. When Arc paused development, I started looking at Chrome and other Chromium-based browsers. The one thing I really missed was Arc's sidebar—how it puts favorite sites, pinned pages, and tabs all in one vertical list.

This fork continues that idea as a separate extension, with Arc parity as an explicit product direction rather than an occasional styling goal.

在使用 Arc 一段时间后，我切换回 Chrome/Chromium 浏览器时最不习惯的就是失去 Arc 的侧栏：常用网站、固定页面和临时 Tab 无法在同一个垂直结构中管理。这个独立分支延续了这种体验，并把“尽可能与 Arc 保持一致”作为明确的产品方向，而不只是偶尔模仿外观。

## Core Goal / 核心目标：尽可能接近 Arc

When a behavior can be implemented safely with Chrome APIs, this fork prefers Arc's behavior and terminology:

当某项行为能够通过 Chrome API 安全、稳定地实现时，本分支优先采用 Arc 的行为和术语：

- Favorites remain available across Spaces. / Favorites 可跨 Space 使用。
- Pinned pages use bookmarks so their position survives closing the live tab. / 固定页面由书签承载，关闭真实 Tab 后位置仍然保留。
- Ordinary tabs use persistent internal Space assignments across reloads and restoration. / 普通 Tab 的 Space 归属由扩展持久化，可跨扩展重载和浏览器恢复。
- Only one Space is visible at a time; the upstream aggregate `All` view is intentionally removed. / 一次只显示一个 Space，明确移除上游的聚合 `All` 视图。
- Collapsed folders can expose the currently active pinned page as a location cue. / 折叠文件夹仍可透出当前活跃的固定页面，保留 Arc 的位置提示。
- Active rows, spacing, translucency, typography, icons, bottom Space navigation, and context menus are tuned against Arc screenshots. / 活跃行、间距、半透明背景、字体、图标、底部 Space 导航和右键菜单均以 Arc 截图为对照调整。

Platform limitations are documented rather than hidden. Features that require control over Chrome's native window chrome—such as replacing the horizontal tab strip, deleting historical closed Saved Tab Group shortcuts, or styling the Side Panel host header—are outside an extension's control.

平台限制会被明确说明而不是隐藏。替换 Chrome 横向标签栏、删除已经关闭的历史 Saved Tab Group 快捷项、修改 Side Panel 宿主标题栏等能力不在扩展可控制范围内。

## Differences from Upstream / 与上游的差异

This repository is a standalone fork of [monemone-org/ChromeSideBar](https://github.com/monemone-org/ChromeSideBar). It is maintained independently and is not intended to be merged back upstream.

本仓库是 [monemone-org/ChromeSideBar](https://github.com/monemone-org/ChromeSideBar) 的独立分支，单独维护，不计划合并回上游。

The following differences describe this fork relative to the upstream version it was based on:

| Area / 领域 | This fork / 本分支 |
| --- | --- |
| Product direction / 产品方向 | Arc fidelity is the primary goal for interaction, terminology, layout, and visuals.<br>以 Arc 的交互、术语、布局和视觉一致性为主要目标。 |
| Extension identity / 扩展身份 | Packaged and released independently as `Side Bar for Arc Users — Arc Style`.<br>以独立扩展 `Side Bar for Arc Users — Arc Style` 打包和发布。 |
| Spaces | Removes the visible `All` Space and keeps navigation on one real Space.<br>移除可见的 `All` Space，导航始终停留在一个真实 Space。 |
| Space tab ownership / Space 归属 | Stored independently from Chrome native groups; native groups remain user-owned.<br>Space 归属独立存储，Chrome 原生标签组保持为用户自己的分组。 |
| Pinned-page persistence / 固定页面持久化 | Recovers bookmark/Favorite tab identity after Side Panel reopen and suspended-tab replacement.<br>Side Panel 重开或外部休眠扩展替换 Tab 后仍可恢复固定页面身份。 |
| Arc-style tree behavior / Arc 风格树结构 | Folder-row toggling, active-descendant peek, keyboard navigation, and Arc-like folder icons.<br>支持整行折叠、活跃子项透出、键盘导航和 Arc 风格文件夹图标。 |
| Context menus / 右键菜单 | Adds supported Arc actions such as `New Folder with N Items`; omits unavailable Split View and Customize Page.<br>补充 `New Folder with N Items` 等可实现动作，明确不实现 Chrome 无法承载的 Split View 与 Customize Page。 |
| Visual system / 视觉系统 | Arc-oriented colors, translucency, row geometry, Favorites grid, active cards, spacing, and bottom navigation.<br>采用 Arc 风格颜色、半透明、行尺寸、Favorites 网格、活跃卡片、间距和底部导航。 |
| Startup performance / 启动性能 | Shared subscriptions, concurrent recovery, lazy dialogs, and Performance Timeline diagnostics.<br>共享订阅、并发恢复、对话框懒加载和 Performance Timeline 冷启动诊断。 |
| AI naming / AI 命名 | Optional manual or automatic naming through a configurable OpenAI-compatible API.<br>支持通过可配置的 OpenAI 兼容接口手动或自动生成名称。 |

The upstream remote is retained for reference and attribution, but releases from this repository are made from this fork's own `main` branch.

## Features

### Tab History Navigation

Navigate back and forward through your recently used tabs—like undo/redo for tab switching.

- `Cmd+Shift+<` (Mac) / `Ctrl+Shift+<` (Windows/Linux): Go back to previous tab
- `Cmd+Shift+>` (Mac) / `Ctrl+Shift+>` (Windows/Linux): Go forward
- Each window maintains its own history stack
- Closed tabs are automatically removed from history

### Pinned Sites

- Quick-access icon bar at top of panel
- Pin bookmarks or tabs for one-click navigation
- Drag-and-drop to reorder
- Custom icons and colors
- Configurable icon size (12-48px)
- Right-click menu: Edit (title, URL, icon, color), Duplicate, Reset favicon, Unpin, Move to New Window (when loaded)
- Click: Open as Arc-style tab
- Cmd/Ctrl+Click: Open in new background tab, Shift+Click: Open in new window
- Open indicator: Circular dot for opened state, triangle for playing audio

### Bookmarks

- Display bookmarks and folders in a tree structure
- Context menu (...):
  - New Folder
  - Sort by Name/Date
  - Edit
  - Duplicate
  - Delete
  - Pin to pinned bar
  - Move to New Window (when loaded)
  - Expand All (folders only, recursively expands all subfolders)
- Drag-and-drop to organize bookmarks
- Drag tabs from Tabs section to create bookmarks
- Click: Open as Arc-style tab
- Cmd/Ctrl+Click: Open in new background tab, Shift+Click: Open in new window
- Audio indicator (speaker icon) for playing audio
- Close tab via X button on hover

### Active Tabs

- Display unpinned tabs that belong to the current Space
- Audio indicator (speaker icon) for tabs playing audio
- Follow Chrome's active tab and switch Spaces according to the configured follow mode
- Reorder tabs via drag-and-drop
- Click to switch to tab
- Close tab via X button on hover
- "New Tab" row at the bottom for quick tab creation
- Tab context menu (right-click):
  - Pin to Sidebar
  - Add to Group
  - Add to Bookmark (or "Move to Bookmark" in Arc style mode)
  - Move to New Window
  - Duplicate
  - Close
  - Close Tabs Before / After / Other Tabs
- Sort options (via header menu):
  - Sort by domain then title (A-Z or Z-A)
  - Close all tabs
- Tab Group support:
  - Display Chrome tab groups with their color and title
  - Collapse/expand groups by clicking the group header
  - Group context menu:
    - New Tab (in group)
    - Sort by Domain (A-Z or Z-A)
    - Save to Bookmarks (creates a bookmark folder with all tabs)
    - Rename Group
    - Change Color
    - Close All Tabs in Group
  - Drag-and-drop support:
    - Reorder tabs within a group
    - Move tabs between groups
    - Move tabs in/out of groups
    - Reorder tab groups
    - Drag tab groups to Bookmarks section to save as folder

### Spaces

Organize your browsing by context with Arc-style Spaces—isolated workspaces that filter the sidebar to show only relevant bookmarks and tabs.

- **What is a Space?** A Space links a bookmark folder with a persistent set of real Chrome tabs, plus a name, icon, and color
- **One Space at a time**: There is no aggregate `All` Space; the sidebar always shows one real Space
- **Legacy migration**: Older `all` or deleted Space state automatically resolves to the first available real Space
- **SpaceBar**: Horizontal row of space icons at the bottom of the panel
  - Click to switch spaces
  - Active Space uses Arc-style visual treatment
  - Swipe left/right to switch spaces
- **Creating Spaces**:
  - Click "+" in the SpaceBar
  - Pick a name, icon, color, and bookmark folder
  - Folder auto-creates if it doesn't exist
- **Filtering**:
  - Active Space shows only its bookmark folder and internally assigned tabs
  - New tabs (Cmd+T) automatically belong to the active Space without being placed in a native group
  - Legacy tabs are migrated from prior extension state and existing Space-named groups once
  - Tab operations (Close All, Sort) only affect the current space's tabs
- **Chrome Tab Group Independence**:
  - Native Chrome groups remain available as ordinary user-created groups inside each Space
  - Moving, renaming, or deleting a native group does not change Space membership
  - Upgrading from the older group-backed model ungroups only groups explicitly recorded as extension-owned; no tabs are closed
  - Historical closed Saved Tab Group shortcuts must be removed once through Chrome because Chrome exposes no extension API for deleting them
- **Context menu** (right-click space icon):
  - Edit (name, icon, color, bookmark folder)
  - Delete (with confirmation)
- **Last Space protection**: The final remaining Space cannot be deleted; use `+` to create additional Spaces
- **Multi-window**: Each real Tab keeps its own Space assignment when moved between windows
- **One folder, one Space**: a bookmark folder is assumed to belong to at most one Space. Picking the same folder for two Spaces is not blocked, but is unsupported - the extension resolves a bookmark to its Space by folder, so a shared folder resolves to whichever Space is found first.

### Import & Export

- Full backup and restore capability via JSON files
- Export options:
  - Select specific data to export: Pinned sites, Bookmarks, and/or Tabs & Groups
- Import options:
  - **Pinned Sites**: Replace existing or append to list
  - **Bookmarks**: Replace all or import as a subfolder
  - **Tabs & Groups**: Replace current session or append to current window

### Filter & Search

Toolbar at the top with filter options:

- **Text search bar**: Search by title or URL across pinned sites, bookmarks, and tabs
  - Dropdown shows saved and recent filters (last 5 used)
  - Save button to persist current filter
- **Search bar toggle**: Show/hide the text search bar (hidden by default)
- **Live tabs filter**: Show only bookmarks/pins that have an open tab
- **Audible filter**: Show only items playing audio/video
- **Reset button**: Clears all active filters

### Settings

Gear icon in the bottom-left corner:

- **Font size**: 6-36px (default: 14px)
- **Pinned icon size**: 12-48px (default: 22px)
- **Open bookmark**: Choose how bookmarks open
  - Arc style: Bookmarks act as persistent tabs (hidden from Tabs section)
    - Associations are stored in session state and recovered from a local backup when matching real tabs still exist.
  - In new tab: Opens bookmark in a new background tab
  - In active tab: Replaces the current tab with the bookmark
- **Follow active tab**: Switch Space, switch and scroll, or keep the sidebar fixed
- **Space color**: Optionally tint the sidebar with the active Space color
- **AI naming**: Configure an OpenAI-compatible endpoint, model, protocol, prompt, and automatic naming behavior

### General

- Dark/light mode (follows your system preference)
- Keyboard shortcuts:
  - `Cmd+Shift+E` (Mac) / `Ctrl+Shift+E` (Windows/Linux): Open the sidebar
  - `Cmd+Shift+<` / `Cmd+Shift+>`: Navigate tab history
  - `Alt+Shift+F`: Toggle saved filters dropdown
  - Customize shortcuts via `chrome://extensions/shortcuts`

### Permissions

- `sidePanel`, `bookmarks`, `tabs`, `tabGroups`: Core features
- `storage`: Save your settings locally
- `favicon`: Show website icons
- `scripting`: Read page content only when requested for AI-assisted naming
- Optional `http://*/*` and `https://*/*` host access: Requested explicitly for page reading or the configured AI endpoint

## Full Changelog

[docs/changelog.md](docs/changelog.md)

## Tech Stack

Built with the usual modern web stack:

- [React](https://react.dev/) (v18) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for builds
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
- [@dnd-kit/core](https://dndkit.com/) for drag & drop
- Chrome Manifest V3 APIs (`sidePanel`, `bookmarks`, `tabs`, `tabGroups`, `storage`, `favicon`)

## Project Structure

```
/
├── docs/           # Feature documentation
├── public/         # Chrome extension manifest, service worker, icons
├── src/
│   ├── components/ # React UI components (tabs, bookmarks, pinned bar, dialogs)
│   ├── hooks/      # Custom hooks wrapping Chrome APIs and shared state
│   ├── contexts/   # React contexts for global state (font size, bookmark-tab associations)
│   └── utils/      # Helper functions (drag-drop)
```

## Documentation

- [`docs/github-releases.md`](docs/github-releases.md) - GitHub Release, versioning, and installation details / GitHub Release、版本与安装说明
- [`PRIVACY.md`](PRIVACY.md) - Privacy policy / 隐私政策
- `docs/features/` - Feature specs
- `docs/state-reference.md` - Extension state reference

## Install from GitHub Releases / 从 GitHub Release 安装

This fork is distributed as a ZIP attached to GitHub Releases. It is an unpacked Chrome extension, so Chrome will not install or update it automatically.

这个独立分支通过 GitHub Release 附带的 ZIP 分发。它属于 Chrome 的“已解压扩展程序”，因此 Chrome 不会自动安装或自动更新。

1. Open the [Releases page](https://github.com/lizeyan/SideBarforArcUsers/releases) and download `sidebar-for-arc-users-{version}.zip` from the latest release.<br>
   打开 [Releases 页面](https://github.com/lizeyan/SideBarforArcUsers/releases)，下载最新版本的 `sidebar-for-arc-users-{version}.zip`。
2. Extract the ZIP to a stable local folder; do not select the ZIP itself.<br>
   将 ZIP 解压到一个固定目录；不要直接选择 ZIP 文件。
3. Open `chrome://extensions/` and enable **Developer mode**.<br>
   打开 `chrome://extensions/`，开启右上角的**开发者模式**。
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.<br>
   点击**加载已解压的扩展程序**，选择包含 `manifest.json` 的解压目录。
5. Click the extension icon or press `Cmd+Shift+E` / `Ctrl+Shift+E` to open the sidebar.<br>
   点击扩展图标，或按 `Cmd+Shift+E` / `Ctrl+Shift+E` 打开侧栏。

### Updating / 更新

Download and extract the newer release. If you replace the previous folder in place, open `chrome://extensions/` and click **Reload** on the extension card. If the extracted path changes, remove the old unpacked extension and load the new folder.

下载并解压新版本。如果直接覆盖原目录，请打开 `chrome://extensions/` 并点击扩展卡片上的**重新加载**；如果解压目录发生变化，请移除旧的已解压扩展，再加载新目录。

See [GitHub Release distribution](docs/github-releases.md) for the release workflow, Semantic Version policy, artifact behavior, and security notes.

完整的自动发布流程、Semantic Version 规则、分支 Artifact 行为和安全说明见 [GitHub Release 发布文档](docs/github-releases.md)。

Every branch and pull request also produces a temporary ZIP under its GitHub Actions run. Only `main` publishes permanent Release assets.

每个分支和 PR 都会在对应的 GitHub Actions Run 中生成临时 ZIP Artifact；只有 `main` 会发布永久的 GitHub Release 资产。

## Setup & Build / 安装与构建

### Prerequisites / 环境要求
- Node.js (v22+ for the TypeScript test runner)
- npm

### Installation / 安装依赖
```bash
npm install
```

### Build / 构建
```bash
npm run build
npm run build:debug
```
Outputs the production build to `dist/`. / 正式构建输出到 `dist/`。

## Load in Chrome / 在 Chrome 中本地加载

1. Go to `chrome://extensions/`. / 打开 `chrome://extensions/`。
2. Turn on **Developer mode**. / 开启右上角的**开发者模式**。
3. Click **Load unpacked** and select `dist/`. / 点击**加载已解压的扩展程序**并选择 `dist/`。
4. Click the extension icon or press `Cmd+Shift+E`. / 点击扩展图标或按 `Cmd+Shift+E` 打开侧栏。

## Upstream and Attribution / 上游与致谢

This fork is based on [monemone-org/ChromeSideBar](https://github.com/monemone-org/ChromeSideBar). Thanks to the upstream project for the original extension architecture and feature foundation.

Install this fork from a release produced by this repository, or build it locally using the instructions above. The upstream Chrome Web Store listing installs the upstream extension, not this Arc-focused fork.

请安装本仓库自行发布的版本，或按上述步骤本地构建。上游的 Chrome Web Store 条目安装的是上游扩展，并非这个以 Arc 一致性为目标的独立分支。
