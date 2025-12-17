# Minimal Backend (Optional)

This Chrome extension already supports loading mapping data from **any JSON URL** (and can auto-update daily).  
If you want a stable URL in your LAN / local environment, you can use this minimal backend.

## Run

Requirement: Node.js 18+ (uses built-in `fetch` / zero dependencies)

```bash
node backend/server.mjs
```

Default address: `http://127.0.0.1:8787`

## Run with Docker

Build (from repo root):

```bash
docker build -t github-name-mapper-backend ./backend
```

Run (port mapping + persist data):

```bash
docker run --rm -p 8787:8787 \
  -v "$PWD/backend/data.json:/data/data.json" \
  github-name-mapper-backend
```

Notes:

- The container listens on `0.0.0.0:8787` by default, so you can access it from your host via `http://127.0.0.1:8787`.
- Data is stored at `/data/data.json` inside the container (configurable via `DATA_FILE`).

## Endpoints

- `GET /health`: health check
- `GET /ui`: minimal register UI (add records and persist to `backend/data.json`)
- `GET /data.json`: mapping data in the recommended format (for the extension)
- `GET /raw`: plain array (also supported by the extension)
- `POST /raw`: overwrite data with an array and persist to `backend/data.json`
- `POST /api/add`: add/update a single record and persist to `backend/data.json`

## Extension Config

Open the extension “Control Panel” → “Basic Config” → set JSON URL to:

`http://127.0.0.1:8787/data.json`

## Notes

- `backend/data.json` may change after running the server, so it is added to `.gitignore` by default.

---

# 极简 Backend（可选）

这个项目的 Chrome 插件本身已经支持从任意 URL 拉取远程 JSON 数据源（并可每日自动更新）。  
如果你希望在内网/本地提供一个稳定的 JSON 地址，可以使用本目录的极简后端。

## 启动

要求：Node.js 18+（使用内置 `fetch`、零依赖）

```bash
node backend/server.mjs
```

默认监听：`http://127.0.0.1:8787`

## 使用 Docker 启动

构建（在仓库根目录执行）：

```bash
docker build -t github-name-mapper-backend ./backend
```

运行（端口映射 + 数据持久化）：

```bash
docker run --rm -p 8787:8787 \
  -v "$PWD/backend/data.json:/data/data.json" \
  github-name-mapper-backend
```

说明：

- 容器内默认监听 `0.0.0.0:8787`，所以宿主机可通过 `http://127.0.0.1:8787` 访问。
- 容器内数据文件默认在 `/data/data.json`（可通过环境变量 `DATA_FILE` 自定义）。

## 接口

- `GET /health`：健康检查
- `GET /ui`：简易登记界面（添加记录并写入 `backend/data.json`）
- `GET /data.json`：返回映射数据（插件推荐格式）
- `GET /raw`：直接返回数组（插件也支持）
- `POST /raw`：用数组整体覆盖数据并落盘到 `backend/data.json`
- `POST /api/add`：添加/更新单条记录并写入 `backend/data.json`

## 插件配置

打开插件「控制面板」→ 「基础配置」→ JSON URL 填：

`http://127.0.0.1:8787/data.json`

## 备注

- 运行服务后 `backend/data.json` 可能发生变化，所以默认已加入 `.gitignore`。

