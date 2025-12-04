// GitHub Name Mapper - Content Script

let developerMap = new Map();
let developerList = []; // 用于搜索的数组格式
let isEnabled = true;
let isDebug = false;
let observer = null;

// 功能开关
let featureReplace = true;
let featureHighlight = true;
let featureAvatarHighlight = true;
let featureMention = true;

// Mention 自动补全相关
let mentionPopup = null;
let currentInput = null;
let mentionStartPos = -1;
let selectedIndex = 0;
let filteredUsers = [];

// 调试日志
function log(...args) {
  if (isDebug) {
    console.log('[GNM]', ...args);
  }
}

// 初始化
init();

async function init() {
  const config = await sendMessage({ action: 'getConfig' });
  if (config.success) {
    isEnabled = config.data.enabled;
    isDebug = config.data.debug || false;
    featureReplace = config.data.featureReplace !== false;
    featureHighlight = config.data.featureHighlight !== false;
    featureAvatarHighlight = config.data.featureAvatarHighlight !== false;
    featureMention = config.data.featureMention !== false;
    
    log('初始化', { 
      enabled: isEnabled, 
      featureReplace, 
      featureHighlight,
      featureAvatarHighlight,
      featureMention,
      debug: isDebug 
    });
    
    if (isEnabled) {
      await loadDevelopers();
      if (featureReplace) {
        replaceUsernames();
        setupObserver();
      }
      if (featureAvatarHighlight) {
        highlightAvatars();
      }
      if (featureMention) {
        setupMentionAutocomplete();
        log('Mention 自动补全已启用，触发方式: @@ 或 Cmd/Ctrl+Shift+M');
      }
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
    developerList = [];
    result.data.forEach(dev => {
      if (dev.github_name) {
        const devInfo = {
          github_name: dev.github_name,
          nick: dev.nick || '',
          domain: dev.domain || '',
          github_acc: dev.github_acc || '',
          displayName: dev.nick ? `${dev.github_name}(${dev.nick})` : dev.github_name,
          // 用于搜索的文本（小写）
          searchText: `${dev.github_name} ${dev.nick || ''} ${dev.domain || ''}`.toLowerCase()
        };
        developerMap.set(dev.github_name.toLowerCase(), devInfo);
        developerList.push(devInfo);
      }
    });
    log('开发者数据已加载', { count: developerList.length });
  } else {
    log('加载开发者数据失败', result);
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
  if (featureReplace) {
    replaceUsernames();
  }
  if (featureAvatarHighlight) {
    highlightAvatars();
  }
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
  if (!isEnabled || !featureReplace || developerMap.size === 0) return;
  
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

// ==================== 头像高亮功能 ====================

// 高亮已识别用户的头像
function highlightAvatars() {
  if (!isEnabled || !featureAvatarHighlight || developerMap.size === 0) return;
  
  // GitHub 头像选择器
  const avatarSelectors = [
    'img.avatar',
    'img.avatar-user',
    'img[data-hovercard-type="user"]',
    'img[data-hovercard-url*="/users/"]',  // 新增：通过 hovercard-url 匹配
    'img[data-component="Avatar"]',         // 新增：React 组件头像
    'img[data-testid*="avatar"]',           // 新增：testid 包含 avatar
    '.avatar-user',
    '.TimelineItem-avatar img',
    '.AvatarStack-body img',
    'a[data-hovercard-type="user"] img',
  ];
  
  const avatars = document.querySelectorAll(avatarSelectors.join(', '));
  log('找到头像', { count: avatars.length });
  
  avatars.forEach(avatar => {
    // 跳过已处理的
    if (avatar.hasAttribute('data-gnm-avatar')) return;
    
    // 跳过排除区域
    if (isInExcludedArea(avatar)) return;
    
    // 尝试从父链接或 hovercard 获取用户名
    const username = extractUsernameFromAvatar(avatar);
    if (!username) return;
    
    const devInfo = developerMap.get(username.toLowerCase());
    if (devInfo) {
      avatar.setAttribute('data-gnm-avatar', username);
      avatar.classList.add('gnm-avatar-highlight');
      
      // 添加提示
      avatar.title = `${devInfo.displayName}\nDomain: ${devInfo.domain}\nEmail: ${devInfo.github_acc}`;
      
      log('头像高亮', { username, nick: devInfo.nick });
    }
  });
}

// 从头像元素提取用户名
function extractUsernameFromAvatar(avatar) {
  // 从 data-hovercard-url 提取（最可靠）
  const hovercardUrl = avatar.getAttribute('data-hovercard-url') || 
                       avatar.closest('[data-hovercard-url]')?.getAttribute('data-hovercard-url');
  if (hovercardUrl && hovercardUrl.includes('/users/')) {
    const match = hovercardUrl.match(/\/users\/([^\/\?]+)/);
    if (match) {
      log('从 hovercard-url 提取用户名', match[1]);
      return match[1];
    }
  }
  
  // 从 alt 属性提取（可能有 @ 前缀也可能没有）
  const alt = avatar.getAttribute('alt');
  if (alt) {
    const username = alt.startsWith('@') ? alt.substring(1) : alt;
    // 验证是否是有效的用户名格式
    if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
      log('从 alt 提取用户名', username);
      return username;
    }
  }
  
  // 从父链接的 href 提取
  const parentLink = avatar.closest('a[href^="/"]');
  if (parentLink) {
    const href = parentLink.getAttribute('href');
    const match = href.match(/^\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/);
    if (match) {
      log('从父链接提取用户名', match[1]);
      return match[1];
    }
  }
  
  // 从 src URL 提取（GitHub 头像 URL 格式）
  const src = avatar.getAttribute('src');
  if (src) {
    // 格式: https://avatars.githubusercontent.com/u/123456?v=4
    // 或: https://avatars.githubusercontent.com/username?v=4
    const match = src.match(/avatars\.githubusercontent\.com\/([^\/\?]+)/);
    if (match && !/^\d+$/.test(match[1]) && match[1] !== 'u') {
      log('从 src 提取用户名', match[1]);
      return match[1];
    }
  }
  
  return null;
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
    
    // 根据开关添加样式
    if (featureHighlight) {
      el.classList.add('gnm-replaced', 'gnm-highlight');
    } else {
      el.classList.add('gnm-replaced');
    }
    
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
        if (featureReplace) {
          replaceUsernames();
        }
        if (featureAvatarHighlight) {
          highlightAvatars();
        }
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

// ==================== Mention 自动补全功能 ====================

// 设置 Mention 自动补全
function setupMentionAutocomplete() {
  // 创建弹出框
  createMentionPopup();
  
  // 监听输入事件（使用事件委托）
  document.addEventListener('input', handleInput, true);
  document.addEventListener('keydown', handleKeydown, true);
  document.addEventListener('click', handleClickOutside, true);
  document.addEventListener('blur', handleBlur, true);
  
  // 快捷键 Ctrl+Shift+2 (即 Ctrl+@) 或 Ctrl+Shift+M 打开补全
  document.addEventListener('keydown', handleShortcut, true);
}

// 处理快捷键
function handleShortcut(e) {
  if (!isEnabled || !featureMention || developerList.length === 0) return;
  
  // Mac: Cmd+Shift+M, Windows/Linux: Ctrl+Shift+M
  // 或 Cmd/Ctrl+Shift+2 (即 @)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? e.metaKey : e.ctrlKey;
  
  const isModShift2 = modKey && e.shiftKey && e.key === '2';
  const isModShiftM = modKey && e.shiftKey && (e.key === 'm' || e.key === 'M');
  
  if (isModShift2 || isModShiftM) {
    log('快捷键触发', { key: e.key, isMac, modKey: modKey });
    
    const target = e.target;
    if (!isEditableElement(target)) {
      log('目标不是可编辑元素', target);
      return;
    }
    
    e.preventDefault();
    
    const { cursorPos } = getTextAndCursor(target);
    mentionStartPos = cursorPos;
    currentInput = target;
    
    // 显示所有用户
    filteredUsers = searchUsers('');
    selectedIndex = 0;
    log('显示用户列表', { count: filteredUsers.length });
    showMentionPopup(target, cursorPos);
    renderMentionList();
  }
}

// 创建 Mention 弹出框
function createMentionPopup() {
  if (mentionPopup) {
    log('弹出框已存在');
    return;
  }
  
  mentionPopup = document.createElement('div');
  mentionPopup.className = 'gnm-mention-popup';
  mentionPopup.style.display = 'none';
  document.body.appendChild(mentionPopup);
  log('弹出框已创建', mentionPopup);
}

// 处理输入事件
function handleInput(e) {
  if (!isEnabled || !featureMention || developerList.length === 0) return;
  
  const target = e.target;
  if (!isEditableElement(target)) return;
  
  const { text, cursorPos } = getTextAndCursor(target);
  if (text === null) return;
  
  // 查找 @@ 双 @ 符号位置（避免与 GitHub 原生 @ 冲突）
  const beforeCursor = text.substring(0, cursorPos);
  const atMatch = beforeCursor.match(/@@([a-zA-Z0-9\u4e00-\u9fa5_-]*)$/);
  
  log('输入事件', { beforeCursor: beforeCursor.slice(-10), hasMatch: !!atMatch });
  
  if (atMatch) {
    const query = atMatch[1].toLowerCase();
    mentionStartPos = cursorPos - atMatch[1].length - 2; // @@ 符号的位置
    currentInput = target;
    
    // 搜索匹配的用户
    filteredUsers = searchUsers(query);
    log('@@ 匹配', { query, results: filteredUsers.length });
    
    if (filteredUsers.length > 0) {
      selectedIndex = 0;
      showMentionPopup(target, cursorPos);
      renderMentionList();
    } else {
      hideMentionPopup();
    }
  } else {
    hideMentionPopup();
  }
}

// 检查是否是可编辑元素
function isEditableElement(el) {
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  return tagName === 'textarea' || 
         tagName === 'input' ||
         el.isContentEditable ||
         el.getAttribute('contenteditable') === 'true';
}

// 获取文本和光标位置
function getTextAndCursor(el) {
  if (el.tagName.toLowerCase() === 'textarea' || el.tagName.toLowerCase() === 'input') {
    return {
      text: el.value,
      cursorPos: el.selectionStart
    };
  } else if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return { text: null, cursorPos: 0 };
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(el);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return {
      text: el.textContent,
      cursorPos: preCaretRange.toString().length
    };
  }
  return { text: null, cursorPos: 0 };
}

// 搜索用户
function searchUsers(query) {
  if (!query) {
    // 空查询返回前 8 个用户
    return developerList.slice(0, 8);
  }
  
  const lowerQuery = query.toLowerCase();
  return developerList
    .filter(user => user.searchText.includes(lowerQuery))
    .slice(0, 8);
}

// 显示 Mention 弹出框
function showMentionPopup(target, cursorPos) {
  const rect = getCaretRect(target, cursorPos);
  log('获取光标位置', rect);
  
  if (!rect) {
    log('无法获取光标位置，使用目标元素位置');
    // 回退方案：使用目标元素的位置
    const targetRect = target.getBoundingClientRect();
    mentionPopup.style.display = 'block';
    mentionPopup.style.position = 'fixed';
    mentionPopup.style.left = `${targetRect.left}px`;
    mentionPopup.style.top = `${targetRect.bottom + 4}px`;
    mentionPopup.style.zIndex = '99999';
  } else {
    mentionPopup.style.display = 'block';
    mentionPopup.style.position = 'fixed';
    mentionPopup.style.left = `${rect.left}px`;
    mentionPopup.style.top = `${rect.bottom + 4}px`;
    mentionPopup.style.zIndex = '99999';
  }
  
  log('弹出框已显示', {
    display: mentionPopup.style.display,
    left: mentionPopup.style.left,
    top: mentionPopup.style.top,
    zIndex: mentionPopup.style.zIndex,
    innerHTML: mentionPopup.innerHTML.substring(0, 100)
  });
}

// 获取光标位置的矩形（视口相对坐标）
function getCaretRect(el, cursorPos) {
  if (el.tagName.toLowerCase() === 'textarea' || el.tagName.toLowerCase() === 'input') {
    // 获取输入框在视口中的位置
    const elRect = el.getBoundingClientRect();
    
    // 使用 mirror div 技术计算光标在输入框内的相对位置
    const mirror = document.createElement('div');
    const computed = getComputedStyle(el);
    
    // 复制样式
    const props = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'border', 'boxSizing', 'letterSpacing', 'wordSpacing'];
    props.forEach(prop => mirror.style[prop] = computed[prop]);
    mirror.style.position = 'absolute';
    mirror.style.top = '0';
    mirror.style.left = '-9999px';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.width = `${el.clientWidth}px`;
    mirror.style.overflow = 'hidden';
    
    // 考虑滚动位置
    const textBeforeCursor = el.value.substring(0, cursorPos);
    mirror.textContent = textBeforeCursor;
    
    const span = document.createElement('span');
    span.textContent = '|';
    mirror.appendChild(span);
    
    document.body.appendChild(mirror);
    
    // 计算 span 在 mirror 中的相对位置
    const mirrorRect = mirror.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const relativeLeft = spanRect.left - mirrorRect.left;
    const relativeTop = spanRect.top - mirrorRect.top;
    
    document.body.removeChild(mirror);
    
    // 转换为视口坐标，并考虑输入框的滚动
    const scrollTop = el.scrollTop || 0;
    const scrollLeft = el.scrollLeft || 0;
    
    return {
      left: elRect.left + relativeLeft - scrollLeft,
      bottom: elRect.top + relativeTop + spanRect.height - scrollTop
    };
  } else {
    // contenteditable
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    return {
      left: rect.left,
      bottom: rect.bottom
    };
  }
}

// 隐藏 Mention 弹出框
function hideMentionPopup() {
  if (mentionPopup) {
    mentionPopup.style.display = 'none';
  }
  currentInput = null;
  mentionStartPos = -1;
  filteredUsers = [];
}

// 渲染 Mention 列表
function renderMentionList() {
  if (!mentionPopup) {
    log('错误: mentionPopup 不存在');
    return;
  }
  
  const html = filteredUsers.map((user, index) => `
    <div class="gnm-mention-item ${index === selectedIndex ? 'selected' : ''}" data-index="${index}">
      <span class="gnm-mention-github">@${escapeHtml(user.github_name)}</span>
      ${user.nick ? `<span class="gnm-mention-nick">(${escapeHtml(user.nick)})</span>` : ''}
      ${user.domain ? `<span class="gnm-mention-domain">${escapeHtml(user.domain)}</span>` : ''}
    </div>
  `).join('');
  
  mentionPopup.innerHTML = html;
  log('渲染列表', { count: filteredUsers.length, htmlLength: html.length });
  
  // 绑定点击事件
  mentionPopup.querySelectorAll('.gnm-mention-item').forEach(item => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const index = parseInt(item.getAttribute('data-index'));
      selectUser(index);
    });
    item.addEventListener('mouseenter', () => {
      selectedIndex = parseInt(item.getAttribute('data-index'));
      updateSelection();
    });
  });
}

// 更新选中状态
function updateSelection() {
  mentionPopup.querySelectorAll('.gnm-mention-item').forEach((item, index) => {
    item.classList.toggle('selected', index === selectedIndex);
  });
}

// 选择用户
function selectUser(index) {
  const user = filteredUsers[index];
  if (!user || !currentInput) return;
  
  const { text } = getTextAndCursor(currentInput);
  if (text === null) return;
  
  // 获取当前光标位置
  let cursorPos;
  if (currentInput.tagName.toLowerCase() === 'textarea' || currentInput.tagName.toLowerCase() === 'input') {
    cursorPos = currentInput.selectionStart;
  } else {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(currentInput);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorPos = preCaretRange.toString().length;
    }
  }
  
  // 计算替换范围 - @@ 触发的话从 @@ 开始替换，快捷键触发的话直接插入
  const beforeTrigger = text.substring(0, mentionStartPos);
  const afterCursor = text.substring(cursorPos);
  const insertText = '@' + user.github_name + ' ';
  const newText = beforeTrigger + insertText + afterCursor;
  const newCursorPos = mentionStartPos + insertText.length;
  
  // 插入文本
  if (currentInput.tagName.toLowerCase() === 'textarea' || currentInput.tagName.toLowerCase() === 'input') {
    currentInput.value = newText;
    currentInput.selectionStart = currentInput.selectionEnd = newCursorPos;
    // 触发 input 事件（不再触发我们的监听器）
    setTimeout(() => {
      currentInput.dispatchEvent(new Event('input', { bubbles: true }));
    }, 0);
  } else {
    // contenteditable
    currentInput.textContent = newText;
    // 设置光标位置
    const selection = window.getSelection();
    const range = document.createRange();
    const textNode = currentInput.firstChild || currentInput;
    if (textNode.nodeType === Node.TEXT_NODE) {
      range.setStart(textNode, Math.min(newCursorPos, textNode.length));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    setTimeout(() => {
      currentInput.dispatchEvent(new Event('input', { bubbles: true }));
    }, 0);
  }
  
  hideMentionPopup();
}

// 处理键盘事件
function handleKeydown(e) {
  if (mentionPopup?.style.display === 'none' || filteredUsers.length === 0) return;
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredUsers.length;
      updateSelection();
      scrollToSelected();
      break;
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredUsers.length) % filteredUsers.length;
      updateSelection();
      scrollToSelected();
      break;
    case 'Enter':
    case 'Tab':
      e.preventDefault();
      selectUser(selectedIndex);
      break;
    case 'Escape':
      e.preventDefault();
      hideMentionPopup();
      break;
  }
}

// 滚动到选中项
function scrollToSelected() {
  const selected = mentionPopup.querySelector('.gnm-mention-item.selected');
  if (selected) {
    selected.scrollIntoView({ block: 'nearest' });
  }
}

// 点击外部关闭
function handleClickOutside(e) {
  if (mentionPopup && !mentionPopup.contains(e.target) && e.target !== currentInput) {
    hideMentionPopup();
  }
}

// 失去焦点时关闭（延迟以允许点击选项）
function handleBlur(e) {
  setTimeout(() => {
    if (document.activeElement !== currentInput) {
      hideMentionPopup();
    }
  }, 150);
}

// HTML 转义
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

