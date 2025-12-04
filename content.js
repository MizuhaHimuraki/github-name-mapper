// GitHub Name Mapper - Content Script

let developerMap = new Map();
let isEnabled = true;
let observer = null;

// 初始化
init();

async function init() {
  const config = await sendMessage({ action: 'getConfig' });
  if (config.success) {
    isEnabled = config.data.enabled;
    if (isEnabled) {
      await loadDevelopers();
      replaceUsernames();
      setupObserver();
    }
  }
}

// 发送消息到 background
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || { success: false });
    });
  });
}

// 加载开发者数据
async function loadDevelopers() {
  const result = await sendMessage({ action: 'getDevelopers' });
  if (result.success && result.data) {
    developerMap.clear();
    result.data.forEach(dev => {
      if (dev.github_name) {
        developerMap.set(dev.github_name.toLowerCase(), {
          nick: dev.nick || '',
          domain: dev.domain || '',
          github_acc: dev.github_acc || '',
          displayName: dev.nick ? `${dev.github_name}(${dev.nick})` : dev.github_name
        });
      }
    });
  }
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refresh') {
    refresh();
  } else if (request.action === 'toggle') {
    isEnabled = request.enabled;
    if (isEnabled) {
      refresh();
    } else {
      restoreOriginal();
    }
  }
  sendResponse({ success: true });
});

// 刷新数据
async function refresh() {
  await loadDevelopers();
  replaceUsernames();
}

// 恢复原始用户名
function restoreOriginal() {
  document.querySelectorAll('[data-gnm-original]').forEach(el => {
    el.textContent = el.getAttribute('data-gnm-original');
    el.removeAttribute('data-gnm-original');
    el.classList.remove('gnm-replaced');
  });
}

// 替换用户名的主函数
function replaceUsernames() {
  if (!isEnabled || developerMap.size === 0) return;
  
  // 选择器列表 - GitHub 上显示用户名的常见位置
  const selectors = [
    // 作者链接
    'a.author',
    'a[data-hovercard-type="user"]',
    // commit 作者
    '.commit-author',
    '.user-mention',
    // PR/Issue 作者
    '.opened-by a',
    '.author-association-owner',
    // 评论区作者
    '.timeline-comment-header-text strong a',
    '.comment-body a[href^="/"]',
    // 用户卡片
    '.user-profile-link',
    '.assignee span.css-truncate-target',
    // 审核者
    '.reviewer-username',
    '.requested-reviewer',
    // 贡献者列表
    '.contrib-person a',
    'a.text-bold',
    // 通用用户链接
    '[data-testid="author-avatar-and-name"] a',
    '.Link--primary[href^="/"]',
    // 悬停卡片
    '.hovercard-avatar-and-name a',
    // 协作者
    '.collaborator-list a'
  ];
  
  const elements = document.querySelectorAll(selectors.join(', '));
  
  elements.forEach(el => {
    processElement(el);
  });
  
  // 处理特殊情况：纯文本显示的用户名
  processTextNodes();
}

// 需要排除的区域（不应替换用户名的地方）
const EXCLUDED_SELECTORS = [
  '.AppHeader',           // 顶部导航栏
  '.AppHeader-context',   // 仓库路径面包屑
  '.reponav',             // 仓库导航
  '.pagehead',            // 页面头部（仓库名等）
  '.repohead',            // 仓库头部
  '[data-testid="breadcrumbs"]', // 面包屑导航
  '.js-repo-nav',         // 仓库导航
  '.UnderlineNav',        // 下划线导航
];

// 检查元素是否在排除区域内
function isInExcludedArea(el) {
  return EXCLUDED_SELECTORS.some(selector => el.closest(selector));
}

// 处理单个元素
function processElement(el) {
  // 跳过已处理的元素
  if (el.hasAttribute('data-gnm-original')) return;
  
  // 跳过排除区域
  if (isInExcludedArea(el)) return;
  
  const text = el.textContent.trim();
  const username = extractUsername(el, text);
  
  if (!username) return;
  
  const devInfo = developerMap.get(username.toLowerCase());
  if (devInfo) {
    // 保存原始值
    el.setAttribute('data-gnm-original', text);
    el.classList.add('gnm-replaced');
    
    // 只替换用户名部分
    if (text === username || text === `@${username}`) {
      const prefix = text.startsWith('@') ? '@' : '';
      el.textContent = prefix + devInfo.displayName;
    } else {
      // 文本中包含用户名
      el.textContent = text.replace(username, devInfo.displayName);
    }
    
    // 添加提示
    el.title = `Domain: ${devInfo.domain}\nGitHub: ${username}\nEmail: ${devInfo.github_acc}`;
  }
}

// 从元素或文本中提取用户名
function extractUsername(el, text) {
  // 检查 hovercard 类型，只处理 user 类型
  const hovercardType = el.getAttribute('data-hovercard-type');
  if (hovercardType && hovercardType !== 'user') {
    return null; // 跳过 repository、organization 等类型
  }
  
  // 尝试从 href 提取
  const href = el.getAttribute('href');
  if (href) {
    // 只匹配纯用户链接 /username，不匹配 /username/repo
    const match = href.match(/^\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/);
    if (match) {
      return match[1];
    }
  }
  
  // 从 data-hovercard-url 提取（仅当是 user 类型时）
  const hovercardUrl = el.getAttribute('data-hovercard-url');
  if (hovercardUrl && hovercardUrl.includes('/users/')) {
    const match = hovercardUrl.match(/\/users\/([^\/]+)/);
    if (match) {
      return match[1];
    }
  }
  
  // 从文本提取 (去掉 @ 前缀)，但文本不能包含 /
  const cleanText = text.replace(/^@/, '').trim();
  if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(cleanText) && !cleanText.includes('/')) {
    return cleanText;
  }
  
  return null;
}

// 处理可能包含用户名的文本节点
function processTextNodes() {
  // 特殊处理 commit 消息等位置的 @mention
  const mentionRegex = /@([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)/g;
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // 跳过脚本和样式
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        // 跳过已处理的
        if (parent.hasAttribute('data-gnm-original')) {
          return NodeFilter.FILTER_REJECT;
        }
        // 检查是否包含 @mention
        if (mentionRegex.test(node.textContent)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const nodesToReplace = [];
  let node;
  while (node = walker.nextNode()) {
    nodesToReplace.push(node);
  }
  
  nodesToReplace.forEach(textNode => {
    const text = textNode.textContent;
    let newText = text;
    let hasReplacement = false;
    
    // 重置正则表达式
    mentionRegex.lastIndex = 0;
    
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const devInfo = developerMap.get(username.toLowerCase());
      if (devInfo) {
        newText = newText.replace(`@${username}`, `@${devInfo.displayName}`);
        hasReplacement = true;
      }
    }
    
    if (hasReplacement) {
      const parent = textNode.parentElement;
      if (parent && !parent.hasAttribute('data-gnm-original')) {
        parent.setAttribute('data-gnm-original', text);
        textNode.textContent = newText;
      }
    }
  });
}

// 设置 MutationObserver 监听 DOM 变化
function setupObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    // 防抖处理
    clearTimeout(observer.timeout);
    observer.timeout = setTimeout(() => {
      if (isEnabled) {
        replaceUsernames();
      }
    }, 100);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 页面可见性变化时刷新
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isEnabled) {
    refresh();
  }
});

