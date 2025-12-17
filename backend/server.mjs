import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    // 方便浏览器/脚本调试；插件本身不依赖 CORS
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(payload);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(text);
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(html);
}

function redirect(res, location) {
  res.writeHead(302, {
    location,
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(`Redirecting to ${location}`);
}

async function readBodyJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

async function readBodyForm(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

async function readRawList() {
  const text = await fs.readFile(DATA_FILE, 'utf-8');
  const json = JSON.parse(text);
  if (!Array.isArray(json)) {
    throw new Error('DATA_FILE 必须是数组 JSON（例如 backend/data.json）');
  }
  return json;
}

async function writeRawList(list) {
  if (!Array.isArray(list)) {
    throw new Error('Body 必须是数组');
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2) + '\n', 'utf-8');
}

function toExtensionRecommendedFormat(list) {
  return {
    code: 200,
    success: true,
    data: {
      total: list.length,
      list
    }
  };
}

function normalizeNewRecord(input) {
  const domain = String(input?.domain ?? '').trim();
  const nickname = String(input?.nickname ?? input?.nick ?? '').trim();
  const account = String(input?.account ?? input?.github_name ?? input?.githubName ?? '').trim();
  const email = String(input?.email ?? input?.github_acc ?? input?.githubAcc ?? '').trim();

  if (!account) throw new Error('account (GitHub 用户名) 必填');
  if (!nickname) throw new Error('nickname (花名/昵称) 必填');

  return {
    domain,
    nickname,
    account,
    email
  };
}

function recordKey(r) {
  return String(r?.account ?? '').trim().toLowerCase();
}

function buildUiHtml({ host, port }) {
  const base = `http://${host}:${port}`;
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>GitHub Name Mapper - 登记界面</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial; margin: 0; background: #0b1220; color: #e7eefc; }
      a { color: #8ab4ff; text-decoration: none; }
      .wrap { max-width: 980px; margin: 0 auto; padding: 24px; }
      .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 18px; }
      h1 { margin: 0 0 6px; font-size: 18px; }
      .sub { opacity: 0.8; font-size: 13px; margin-bottom: 14px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      label { display: block; font-size: 12px; opacity: 0.85; margin-bottom: 6px; }
      input { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.25); color: #e7eefc; outline: none; }
      input:focus { border-color: rgba(138,180,255,0.8); box-shadow: 0 0 0 3px rgba(138,180,255,0.18); }
      .row { margin-top: 12px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      button { cursor: pointer; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); background: rgba(138,180,255,0.18); color: #e7eefc; }
      button:hover { background: rgba(138,180,255,0.26); }
      .msg { font-size: 13px; opacity: 0.95; }
      .msg.err { color: #ffb4b4; }
      .msg.ok { color: #b7f7c9; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
      th, td { border-bottom: 1px solid rgba(255,255,255,0.12); padding: 10px 8px; text-align: left; vertical-align: top; }
      th { opacity: 0.85; font-weight: 600; }
      .pill { display: inline-block; padding: 2px 8px; border: 1px solid rgba(255,255,255,0.18); border-radius: 999px; font-size: 12px; opacity: 0.9; }
      .actions { display:flex; gap:10px; flex-wrap: wrap; opacity: 0.85; font-size: 12px; }
      code { background: rgba(255,255,255,0.10); padding: 1px 6px; border-radius: 8px; }
      .topbar { display:flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
      .hint { font-size: 12px; opacity: 0.75; }
      details { border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 12px; background: rgba(255,255,255,0.03); }
      summary { cursor: pointer; user-select: none; font-weight: 600; }
      summary::-webkit-details-marker { display:none; }
      .details-body { margin-top: 10px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="topbar">
        <div>
          <h1>GitHub Name Mapper - 登记界面 <span class="pill">Backend</span></h1>
          <div class="sub">新增记录会立刻写入 <code>backend/data.json</code>，并通过 <code>/data.json</code> 动态返回给插件。</div>
        </div>
        <div class="actions">
          <a href="${escapeHtml(base)}/data.json" target="_blank">/data.json</a>
          <a href="${escapeHtml(base)}/raw" target="_blank">/raw</a>
          <a href="${escapeHtml(base)}/health" target="_blank">/health</a>
        </div>
      </div>

      <div class="card">
        <details>
          <summary>使用说明 / Help</summary>
          <div class="sub details-body">
          <div><span class="pill">GET</span> <code>/health</code>：健康检查 / health check</div>
          <div><span class="pill">GET</span> <code>/ui</code>：登记界面（添加记录并写入 <code>backend/data.json</code>）/ register UI</div>
          <div><span class="pill">GET</span> <code>/data.json</code>：插件推荐格式（<code>{data:{list:[]}}</code>）/ recommended format</div>
          <div><span class="pill">GET</span> <code>/raw</code>：直接数组 / plain array</div>
          <div><span class="pill">POST</span> <code>/raw</code>：Body 为数组，覆盖并写入 <code>backend/data.json</code> / overwrite</div>
          <div><span class="pill">POST</span> <code>/api/add</code>：添加/更新单条记录并写入 <code>backend/data.json</code> / add or update one record</div>
          <div style="margin-top:8px;">DATA_FILE: <code>${escapeHtml(DATA_FILE)}</code></div>
          <div style="margin-top:8px;">
            插件 JSON URL 建议填：<code>${escapeHtml(base)}/data.json</code>
            <span style="opacity:.75;">(Extension JSON URL: <code>${escapeHtml(base)}/data.json</code>)</span>
          </div>
          </div>
        </details>
      </div>

      <div class="card" style="margin-top:14px;">
        <form id="addForm">
          <div class="grid">
            <div>
              <label>GitHub 用户名（account）*</label>
              <input name="account" placeholder="e.g. zhangsan-dev" required />
            </div>
            <div>
              <label>花名/昵称（nickname）*</label>
              <input name="nickname" placeholder="e.g. 张三" required />
            </div>
            <div>
              <label>域账号/工号（domain）</label>
              <input name="domain" placeholder="e.g. zhangsan" />
            </div>
            <div>
              <label>邮箱（email）</label>
              <input name="email" placeholder="e.g. zhangsan@example.com" />
            </div>
          </div>
          <div class="row">
            <button type="submit" id="submitBtn">添加</button>
            <span id="msg" class="msg"></span>
            <span class="hint">提示：account 重复时会更新该账号的字段（覆盖）。</span>
          </div>
        </form>
      </div>

      <div class="card" style="margin-top:14px;">
        <div style="display:flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap;">
          <div>
            <strong>当前记录</strong>
            <span id="count" class="pill" style="margin-left:8px;">0</span>
          </div>
          <button id="refreshBtn" type="button">刷新</button>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">account</th>
              <th style="width: 18%;">nickname</th>
              <th style="width: 18%;">domain</th>
              <th>email</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </div>

    <script>
      const msgEl = document.getElementById('msg');
      const tbody = document.getElementById('tbody');
      const countEl = document.getElementById('count');
      const refreshBtn = document.getElementById('refreshBtn');
      const submitBtn = document.getElementById('submitBtn');

      function setMsg(text, type) {
        msgEl.textContent = text || '';
        msgEl.className = 'msg ' + (type || '');
      }

      function esc(s) {
        return String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      async function loadList() {
        const res = await fetch('/raw', { cache: 'no-store' });
        const list = await res.json();
        countEl.textContent = String(Array.isArray(list) ? list.length : 0);

        if (!Array.isArray(list) || list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="opacity:.75; padding:14px 8px;">暂无数据</td></tr>';
          return;
        }

        tbody.innerHTML = list.map(r => {
          return '<tr>'
            + '<td><code>' + esc(r.account || '') + '</code></td>'
            + '<td>' + esc(r.nickname || '') + '</td>'
            + '<td>' + esc(r.domain || '') + '</td>'
            + '<td>' + esc(r.email || '') + '</td>'
            + '</tr>';
        }).join('');
      }

      document.getElementById('addForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        setMsg('', '');
        submitBtn.disabled = true;

        try {
          const fd = new FormData(e.target);
          const body = {
            account: fd.get('account'),
            nickname: fd.get('nickname'),
            domain: fd.get('domain'),
            email: fd.get('email')
          };

          const res = await fetch('/api/add', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body)
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.error || '添加失败');
          }
          setMsg('添加成功（已写入 data.json）', 'ok');
          e.target.reset();
          await loadList();
        } catch (err) {
          setMsg(err && err.message ? err.message : String(err), 'err');
        } finally {
          submitBtn.disabled = false;
        }
      });

      refreshBtn.addEventListener('click', () => loadList().catch(() => {}));

      loadList().catch(() => {});
    </script>
  </body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  try {
    // 预检
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type'
      });
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { success: true, status: 'ok' });
      return;
    }

    // 默认入口：跳转到登记界面（兼容浏览器 GET 与 curl -I 的 HEAD）
    if ((req.method === 'GET' || req.method === 'HEAD') && (url.pathname === '/' || url.pathname === '/help')) {
      redirect(res, '/ui');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/ui') {
      sendHtml(res, 200, buildUiHtml({ host: HOST, port: PORT }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/raw') {
      const list = await readRawList();
      sendJson(res, 200, list);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/data.json') {
      const list = await readRawList();
      sendJson(res, 200, toExtensionRecommendedFormat(list));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/raw') {
      const body = await readBodyJson(req);
      await writeRawList(body || []);
      const list = await readRawList();
      sendJson(res, 200, { success: true, total: list.length });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/add') {
      // 既支持 JSON，也支持 form（方便后续扩展）
      const contentType = String(req.headers['content-type'] || '');
      const body = contentType.includes('application/x-www-form-urlencoded')
        ? await readBodyForm(req)
        : await readBodyJson(req);

      const newRecord = normalizeNewRecord(body || {});

      const list = await readRawList();
      const key = recordKey(newRecord);
      const idx = list.findIndex(r => recordKey(r) === key);

      if (idx >= 0) {
        list[idx] = { ...list[idx], ...newRecord };
      } else {
        list.push(newRecord);
      }

      await writeRawList(list);
      sendJson(res, 200, { success: true, total: list.length, record: newRecord });
      return;
    }

    sendJson(res, 404, { success: false, error: 'Not Found' });
  } catch (err) {
    sendJson(res, 500, { success: false, error: err?.message || String(err) });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`backend listening on http://${HOST}:${PORT}`);
});


