// GitHub Name Mapper - Options Page Script

document.addEventListener('DOMContentLoaded', init);

let currentConfig = null;

async function init() {
  await loadConfig();
  setupNavigation();
  setupEventListeners();
  loadLocalRules();
  loadDataTable();
}

// 加载配置
async function loadConfig() {
  const result = await sendMessage({ action: 'getConfig' });
  if (result.success) {
    currentConfig = result.data;
    updateUI();
  }
}

// 更新 UI 显示
function updateUI() {
  // 启用开关
  document.getElementById('enableToggle').checked = currentConfig.enabled;
  updateStatusBadge(currentConfig.enabled);
  
  // 功能开关
  document.getElementById('featureReplaceToggle').checked = currentConfig.featureReplace !== false;
  document.getElementById('featureHighlightToggle').checked = currentConfig.featureHighlight !== false;
  document.getElementById('featureAvatarHighlightToggle').checked = currentConfig.featureAvatarHighlight !== false;
  document.getElementById('featureMentionToggle').checked = currentConfig.featureMention !== false;
  document.getElementById('debugToggle').checked = currentConfig.debug || false;
  
  // 子开关禁用状态
  updateSubSwitches(currentConfig.enabled);
  
  // JSON URL
  document.getElementById('jsonUrl').value = currentConfig.jsonUrl || '';
  
  // 自动更新
  document.getElementById('autoUpdate').checked = currentConfig.autoUpdate;
  
  // 统计信息
  document.getElementById('remoteCount').textContent = currentConfig.developers?.length || 0;
  document.getElementById('localCount').textContent = currentConfig.localRules?.length || 0;
  document.getElementById('localRuleBadge').textContent = currentConfig.localRules?.length || 0;
  
  // 总数
  const total = (currentConfig.developers?.length || 0) + (currentConfig.localRules?.length || 0);
  document.getElementById('totalBadge').textContent = total;
  
  // 最后更新时间
  if (currentConfig.lastUpdate) {
    document.getElementById('lastUpdate').textContent = formatDate(new Date(currentConfig.lastUpdate));
  }
}

// 更新状态徽章
function updateStatusBadge(enabled) {
  const badge = document.getElementById('statusBadge');
  if (enabled) {
    badge.classList.remove('disabled');
    badge.querySelector('.text').textContent = '已启用';
  } else {
    badge.classList.add('disabled');
    badge.querySelector('.text').textContent = '已禁用';
  }
}

// 更新子开关状态
function updateSubSwitches(enabled) {
  const subSwitches = document.getElementById('subSwitches');
  if (subSwitches) {
    subSwitches.style.opacity = enabled ? '1' : '0.5';
    subSwitches.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

// 设置导航
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = item.getAttribute('data-section');
      
      // 更新导航状态
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // 切换内容区域
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(sectionId).classList.add('active');
      
      // 如果切换到数据预览，刷新数据
      if (sectionId === 'data') {
        loadDataTable();
      }
    });
  });
  
  // 处理 URL hash
  if (window.location.hash) {
    const targetNav = document.querySelector(`.nav-item[data-section="${window.location.hash.slice(1)}"]`);
    if (targetNav) {
      targetNav.click();
    }
  }
}

// 设置事件监听
function setupEventListeners() {
  // 启用开关（总开关）
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    currentConfig.enabled = e.target.checked;
    await sendMessage({ action: 'toggle', enabled: e.target.checked });
    updateStatusBadge(e.target.checked);
    updateSubSwitches(e.target.checked);
    showToast(e.target.checked ? '已启用插件' : '已禁用插件', 'success');
  });
  
  // 识别用户开关
  document.getElementById('featureReplaceToggle').addEventListener('change', async (e) => {
    currentConfig.featureReplace = e.target.checked;
    await sendMessage({ action: 'saveConfig', config: currentConfig });
    showToast(e.target.checked ? '已开启用户识别' : '已关闭用户识别', 'success');
  });
  
  // 文字高亮开关
  document.getElementById('featureHighlightToggle').addEventListener('change', async (e) => {
    currentConfig.featureHighlight = e.target.checked;
    await sendMessage({ action: 'saveConfig', config: currentConfig });
    showToast(e.target.checked ? '已开启文字高亮' : '已关闭文字高亮', 'success');
  });
  
  // 头像高亮开关
  document.getElementById('featureAvatarHighlightToggle').addEventListener('change', async (e) => {
    currentConfig.featureAvatarHighlight = e.target.checked;
    await sendMessage({ action: 'saveConfig', config: currentConfig });
    showToast(e.target.checked ? '已开启头像高亮' : '已关闭头像高亮', 'success');
  });
  
  // @@ 快速补全开关
  document.getElementById('featureMentionToggle').addEventListener('change', async (e) => {
    currentConfig.featureMention = e.target.checked;
    await sendMessage({ action: 'saveConfig', config: currentConfig });
    showToast(e.target.checked ? '已开启 @@ 快速补全' : '已关闭 @@ 快速补全', 'success');
  });
  
  // 自动更新开关
  document.getElementById('autoUpdate').addEventListener('change', async (e) => {
    currentConfig.autoUpdate = e.target.checked;
    await sendMessage({ action: 'saveConfig', config: currentConfig });
    showToast(e.target.checked ? '已开启每日自动更新' : '已关闭自动更新', 'success');
  });
  
  // 调试模式开关
  document.getElementById('debugToggle').addEventListener('change', async (e) => {
    currentConfig.debug = e.target.checked;
    await sendMessage({ action: 'saveConfig', config: currentConfig });
    showToast(e.target.checked ? '已开启调试模式，刷新 GitHub 页面后按 F12 查看' : '已关闭调试模式', 'success');
  });
  
  // 加载数据按钮
  document.getElementById('fetchBtn').addEventListener('click', async () => {
    const url = document.getElementById('jsonUrl').value.trim();
    if (!url) {
      showToast('请输入用户数据源地址', 'error');
      return;
    }
    
    // 保存 URL
    currentConfig.jsonUrl = url;
    await sendMessage({ action: 'saveConfig', config: currentConfig });
    
    // 加载数据
    const btn = document.getElementById('fetchBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    
    const result = await sendMessage({ action: 'fetchData', url });
    
    btn.classList.remove('loading');
    btn.disabled = false;
    
    if (result.success) {
      showToast(`成功加载 ${result.count} 条规则`, 'success');
      await loadConfig();
      loadDataTable();
    } else {
      showToast(result.error || '加载失败', 'error');
    }
  });
  
  // 添加本地规则表单
  document.getElementById('addRuleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rule = {
      domain: document.getElementById('ruleDomain').value.trim(),
      nick: document.getElementById('ruleNick').value.trim(),
      github_name: document.getElementById('ruleGithub').value.trim(),
      github_acc: document.getElementById('ruleEmail').value.trim()
    };
    
    if (!rule.nick || !rule.github_name) {
      showToast('请填写必填项', 'error');
      return;
    }
    
    await sendMessage({ action: 'addLocalRule', rule });
    showToast('规则添加成功', 'success');
    
    // 清空表单
    e.target.reset();
    
    // 刷新列表
    await loadConfig();
    loadLocalRules();
    loadDataTable();
  });
  
  // 搜索
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    filterDataTable(keyword);
  });
}

// 加载本地规则列表
function loadLocalRules() {
  const container = document.getElementById('localRulesList');
  const rules = currentConfig.localRules || [];
  
  if (rules.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>暂无本地规则</p>
        <span>使用上方表单添加自定义映射规则</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = rules.map((rule, index) => `
    <div class="rule-item" data-index="${index}">
      <div class="rule-info">
        <div class="rule-main">
          <span class="github">${escapeHtml(rule.github_name)}</span>
          <span class="nick">(${escapeHtml(rule.nick)})</span>
        </div>
        <div class="rule-sub">
          域账号: ${escapeHtml(rule.domain || '-')} | 邮箱: ${escapeHtml(rule.github_acc || '-')}
        </div>
      </div>
      <button class="btn btn-danger delete-rule" data-index="${index}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  // 绑定删除事件
  container.querySelectorAll('.delete-rule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.getAttribute('data-index'));
      await sendMessage({ action: 'removeLocalRule', index });
      showToast('规则已删除', 'success');
      await loadConfig();
      loadLocalRules();
      loadDataTable();
    });
  });
}

// 加载数据表格
function loadDataTable() {
  const tbody = document.getElementById('dataTableBody');
  const emptyState = document.getElementById('emptyData');
  
  const developers = currentConfig.developers || [];
  const localRules = currentConfig.localRules || [];
  const allData = [
    ...localRules.map(r => ({ ...r, isLocal: true })),
    ...developers.map(r => ({ ...r, isLocal: false }))
  ];
  
  if (allData.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'flex';
    document.querySelector('.table-container').style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  document.querySelector('.table-container').style.display = 'block';
  
  tbody.innerHTML = allData.map(dev => `
    <tr data-searchable="${(dev.domain + dev.nick + dev.github_name + dev.github_acc).toLowerCase()}">
      <td>${escapeHtml(dev.domain || '-')}</td>
      <td>${escapeHtml(dev.nick || '-')}</td>
      <td>${escapeHtml(dev.github_name || '-')}</td>
      <td>${escapeHtml(dev.github_acc || '-')}</td>
      <td>
        <span class="source-badge ${dev.isLocal ? 'local' : 'remote'}">
          ${dev.isLocal ? '本地' : '远程'}
        </span>
      </td>
    </tr>
  `).join('');
}

// 过滤数据表格
function filterDataTable(keyword) {
  const rows = document.querySelectorAll('#dataTableBody tr');
  
  rows.forEach(row => {
    const searchable = row.getAttribute('data-searchable');
    if (keyword === '' || searchable.includes(keyword)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// 发送消息
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || { success: false });
    });
  });
}

// 格式化日期
function formatDate(date) {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// HTML 转义
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 显示 Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.querySelector('.toast-message').textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

