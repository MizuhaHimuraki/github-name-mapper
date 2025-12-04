# GitHub Name Mapper

<p align="center">
  <img src="icons/icon128.png" alt="GitHub Name Mapper" width="128" height="128">
</p>

<p align="center">
  <strong>A Chrome extension that maps GitHub usernames to "username(nickname)" format</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-development">Development</a> •
  <a href="#中文文档">中文</a>
</p>

---

## ✨ Features

Full feature guide and management instructions: [**Features & Management Guide**](docs/en/Features.md)

- 🔄 **Remote Data Source** - Load developer mapping data from a JSON URL
- ⏰ **Auto Update** - Optional daily auto-update from remote URL
- 📝 **Local Rules** - Manually add local mapping rules with higher priority
- 🎯 **Smart Replacement** - Only active on GitHub, intelligently identifies usernames
- 🎛️ **Control Panel** - Standalone configuration interface with data preview and search
- 🌐 **CORS Support** - Load JSON from any URL without CORS restrictions
- 💬 **Mention Autocomplete** - Type `@@` or press `Ctrl+Shift+M` to quickly mention team members by nickname

## 📸 Preview

After enabling the extension, GitHub usernames will be displayed with nicknames.

![Commit History Preview](docs/img/demos/nick-in-commit.png)

| Original | Replaced |
|----------|----------|
| `zhangsan-dev` | `zhangsan-dev(Zhang San)` |

> 💡 Hover to see full info (domain account, email, etc.)

## 🚀 Quick Start

Detailed installation guide with screenshots: [**Installation Guide**](docs/en/Install.md)

### Installation

1. **Download**
   ```bash
   git clone https://github.com/MizuhaHimuraki/github-name-mapper.git
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the folder

3. **Configure**
   - Click extension icon -> **Control Panel**
   - Enter your JSON URL in "Basic Config"
   - Click **Load**

## 📖 Configuration

### JSON Format

```json
{
  "code": 200,
  "data": {
    "total": 10,
    "list": [
      {
        "domain": "zhangsan",
        "nickname": "Zhang San",
        "account": "zhangsan-dev",
        "email": "zhangsan@example.com"
      }
    ]
  },
  "success": true
}
```

| Field | Description | Required |
|-------|-------------|:--------:|
| `account` | GitHub username | ✅ |
| `nickname` | Nickname/Alias | ✅ |
| `domain` | Domain account | ❌ |
| `email` | Email address | ❌ |

## 🔧 Development

### Project Structure

```
github-name-mapper/
├── manifest.json      # Extension config
├── background.js      # Service Worker
├── content.js         # Content script
├── popup.html/js/css  # Popup panel
├── options.html/js/css # Options page
├── docs/              # Documentation & Images
└── icons/             # Icon files
```

### Local Development

1. Edit code, then click **Refresh** on extension card at `chrome://extensions/`
2. Refresh GitHub page to see changes
3. Press `F12` to open DevTools for debugging

## 🔄 Version Updates

The extension auto-checks GitHub Releases every 12 hours.

### Release New Version

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions will automatically create a release with the packaged ZIP file.

## 📋 Roadmap

- [ ] DingTalk integration (requires internal service)

## 📄 License

[MIT License](LICENSE) © 2025 MizuhaHimuraki

---

# 中文文档

<p align="center">
  <strong>将 GitHub 用户名映射为「用户名(花名)」格式显示的 Chrome 扩展</strong>
</p>

<p align="center">
  <a href="#-功能特性">功能特性</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-配置说明">配置说明</a> •
  <a href="#-开发指南">开发指南</a>
</p>

---

## ✨ 功能特性

完整功能介绍与管理指南：[**功能特性与管理指南**](docs/zh/Features.md)

- 🔄 **远程数据源** - 配置 JSON URL 自动加载开发者映射数据
- ⏰ **每日自动更新** - 可选择启用每天自动从远程 URL 更新数据
- 📝 **本地规则** - 支持手动添加本地映射规则，优先级高于远程数据
- 🎯 **精准替换** - 仅在 GitHub 网站启用，智能识别并替换用户名
- 🎛️ **控制面板** - 独立的配置管理界面，支持数据预览和搜索
- 🌐 **跨域支持** - 支持从任意 URL 加载 JSON 数据，无需担心 CORS 限制
- 💬 **Mention 自动补全** - 输入 `@@` 或按 `Ctrl+Shift+M` 快速通过花名提及团队成员

## 📸 显示效果

插件启用后，GitHub 页面上的用户名会变成：

![提交历史预览](docs/img/demos/nick-in-commit.png)

| 原始显示 | 替换后显示 |
|---------|-----------|
| `zhangsan-dev` | `zhangsan-dev(张三)` |

> 💡 鼠标悬停会显示完整信息（域账号、邮箱等）

## 🚀 快速开始

带截图的详细安装教程：[**安装指南**](docs/zh/Install.md)

### 安装步骤

1. **下载扩展**
   ```bash
   git clone https://github.com/MizuhaHimuraki/github-name-mapper.git
   ```

2. **加载到 Chrome**
   - 访问 `chrome://extensions/`
   - 开启「**开发者模式**」
   - 点击「**加载已解压的扩展程序**」并选择文件夹

3. **配置数据源**
   - 点击扩展图标 -> 「**控制面板**」
   - 在「基础配置」中填入 JSON URL
   - 点击「**加载**」

## 📖 配置说明

### JSON 数据格式

```json
{
  "code": 200,
  "data": {
    "total": 10,
    "list": [
      {
        "domain": "zhangsan",
        "nickname": "张三",
        "account": "zhangsan-dev",
        "email": "zhangsan@example.com"
      }
    ]
  },
  "success": true
}
```

#### 字段说明

| 字段 | 说明 | 必填 |
|------|------|:----:|
| `account` | GitHub 用户名 | ✅ |
| `nickname` | 花名/昵称 | ✅ |
| `domain` | 域账号/工号 | ❌ |
| `email` | 邮箱地址 | ❌ |

> ⚠️ `account` 和 `nickname` 至少需要填写一个

### 本地规则

1. 进入控制面板 → 「本地规则」标签
2. 填写 GitHub 用户名和花名
3. 点击添加

## 🔧 开发指南

### 项目结构

```
github-name-mapper/
├── manifest.json      # 扩展配置文件
├── background.js      # 后台服务脚本 (Service Worker)
├── content.js         # 内容注入脚本
├── content.css        # 替换样式
├── popup.html/js/css  # 弹出面板
├── options.html/js/css # 控制面板
├── docs/              # 文档与图片
└── icons/             # 图标文件
```

### 本地调试

1. 修改代码后，在 `chrome://extensions/` 点击 **刷新**
2. 刷新 GitHub 页面查看效果
3. 按 `F12` 打开开发者工具

## 🔄 版本更新

### 自动检查更新

- 每 12 小时自动检查一次
- 发现新版本时，popup 面板会显示更新提示

### 发布新版本

```bash
git tag v1.0.1
git push origin v1.0.1
```

## 📋 Roadmap

- [ ] 钉钉跳转联系用户（需要内部服务中转）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
