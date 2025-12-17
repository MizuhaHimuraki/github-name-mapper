# GitHub Pages Data Source (Optional)

This directory contains an example `data.json` for hosting your mapping data via **GitHub Pages**.

If you publish `data.json` on GitHub Pages, you can use it as the extension’s **JSON URL** (and optionally enable daily auto-update).

Live example (already deployed):

- <https://mizuhahimuraki.github.io/github-name-mapper/gh-pages/data.json>

## Quick Start (recommended)

1. Create a new repository (e.g. `name-mapper-data`).
2. Copy `docs/gh-pages/data.json` from this repo into your new repo (put it in the repo root, or any folder that will be published by GitHub Pages).
3. In your repo settings, enable GitHub Pages:
   - Settings → Pages
   - Build and deployment → Source: `main` + `/` (or `/docs` if you put the file there)
4. After it’s deployed, you’ll get a URL like:
   - `https://<your-user>.github.io/<repo>/data.json`
5. Open the extension Control Panel → “Basic Config” → paste the URL into **JSON URL** → click **Load**.
6. (Optional) Enable **Auto Update** to refresh daily.

## Notes

- GitHub Pages is a static hosting solution. Updating `data.json` in your Pages repo is enough to update the data source.
- You can also host the same `data.json` on any other static hosting provider.

---

# 使用 GitHub Pages 托管数据源（可选）

本目录提供了一份示例数据 `data.json`，用于通过 **GitHub Pages** 托管你的映射数据。

当你把 `data.json` 发布到 GitHub Pages 后，就可以把它作为插件的 **JSON URL**（并可选择开启“每日自动更新”）。

已部署示例（可直接使用）：

- <https://mizuhahimuraki.github.io/github-name-mapper/gh-pages/data.json>

## 快速上手（推荐）

1. 新建一个仓库（例如 `name-mapper-data`）。
2. 将本仓库的 `docs/gh-pages/data.json` 拷贝到新仓库中（放在仓库根目录，或任何会被 GitHub Pages 发布的目录里）。
3. 在仓库设置中启用 GitHub Pages：
   - Settings → Pages
   - Build and deployment → Source 选择 `main` 分支 + `/`（如果文件放在 `/docs`，则选择 `/docs`）
4. 部署完成后，你会得到类似以下的 URL：
   - `https://<你的用户名>.github.io/<仓库名>/data.json`
5. 打开插件控制面板 →「基础配置」→ 将该 URL 粘贴到 **JSON URL** → 点击「**加载**」。
6. （可选）开启「**每日自动更新**」实现每日刷新。

## 备注

- GitHub Pages 属于静态托管：你只要在 Pages 仓库里更新 `data.json`，数据源就会随之更新。
- 同一份 `data.json` 也可以托管在任意其他静态托管平台上。


