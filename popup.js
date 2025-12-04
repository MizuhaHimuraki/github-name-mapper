// GitHub Name Mapper - Popup Script

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadStatus();
  await checkForUpdates();
  setupEventListeners();
}

async function loadStatus() {
  const result = await sendMessage({ action: 'getConfig' });
  
  if (result.success) {
    const config = result.data;
    
    // 更新开关状态
    document.getElementById('enableToggle').checked = config.enabled;
    
    // 更新状态文本
    const statusText = document.getElementById('statusText');
    if (config.enabled) {
      statusText.textContent = '已启用';
      statusText.className = 'value success';
    } else {
      statusText.textContent = '已禁用';
      statusText.className = 'value disabled';
    }
    
    // 更新规则数量
    const totalRules = (config.developers?.length || 0) + (config.localRules?.length || 0);
    document.getElementById('ruleCount').textContent = `${totalRules} 条`;
    
    // 更新最后更新时间
    if (config.lastUpdate) {
      const date = new Date(config.lastUpdate);
      document.getElementById('lastUpdate').textContent = formatDate(date);
    } else {
      document.getElementById('lastUpdate').textContent = '从未';
    }
    
    // 如果没有配置 URL，禁用刷新按钮
    if (!config.jsonUrl) {
      document.getElementById('refreshBtn').disabled = true;
      showMessage('请先在控制面板中配置 JSON URL', 'error');
    }
  }
}

// 检查更新
async function checkForUpdates() {
  const result = await sendMessage({ action: 'getUpdateInfo' });
  
  if (result.success) {
    // 显示当前版本
    document.getElementById('currentVersion').textContent = `v${result.currentVersion}`;
    
    // 如果有更新且未被忽略，显示更新横幅
    if (result.hasUpdate && !result.dismissed) {
      const banner = document.getElementById('updateBanner');
      document.getElementById('latestVersion').textContent = `v${result.latestVersion}`;
      document.getElementById('updateLink').href = result.downloadUrl;
      banner.style.display = 'flex';
    }
  }
}

function setupEventListeners() {
  // 开关切换
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await sendMessage({ action: 'toggle', enabled });
    
    // 更新当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url?.includes('github.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle', enabled });
    }
    
    await loadStatus();
    showMessage(enabled ? '已启用' : '已禁用', 'success');
  });
  
  // 刷新数据
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    
    const config = await sendMessage({ action: 'getConfig' });
    if (config.success && config.data.jsonUrl) {
      const result = await sendMessage({ action: 'fetchData', url: config.data.jsonUrl });
      
      if (result.success) {
        showMessage(`成功加载 ${result.count} 条规则`, 'success');
        await loadStatus();
      } else {
        showMessage(result.error || '加载失败', 'error');
      }
    }
    
    btn.classList.remove('loading');
    btn.disabled = false;
  });
  
  // 打开控制面板
  document.getElementById('optionsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // 忽略此版本更新
  document.getElementById('dismissUpdate').addEventListener('click', async () => {
    await sendMessage({ action: 'dismissUpdate' });
    document.getElementById('updateBanner').style.display = 'none';
  });
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || { success: false });
    });
  });
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function showMessage(text, type = 'info') {
  const footer = document.getElementById('message');
  footer.textContent = text;
  footer.className = type;
  
  if (type === 'success') {
    setTimeout(() => {
      footer.textContent = '';
      footer.className = '';
    }, 3000);
  }
}

