# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] - 2025-12-12

### 🎉 New Features / 新功能

**English:**
- **Local Rules Import/Export** - Import local rules from a JSON file and export current local rules
- **Release Packaging Script** - Add a Node-based packaging script (runnable via npm) to generate versioned ZIP for Chrome Web Store

**中文：**
- **本地规则导入/导出** - 支持从本地 JSON 文件导入本地规则，并支持导出当前本地规则
- **发布打包脚本** - 增加基于 Node 的自动打包脚本（可通过 npm 调用），生成带版本号的 Chrome Web Store ZIP 包

## [1.0.1] - 2025-12-04

### 🎉 New Features / 新功能

**English:**
- **Independent Feature Toggles** - Control each feature separately:
  - 👤 User Recognition (replace username with nickname)
  - ✨ Text Highlight (subtle background color)
  - 🖼️ Avatar Highlight (blue border for recognized users)
  - 💬 @@ Autocomplete (mention by nickname)
  - 🐛 Debug Mode
- **@@ Mention Autocomplete** - Type `@@` or press `⌘/Ctrl+Shift+M` to quickly mention team members by nickname
- **Avatar Highlight** - Recognized users' avatars show a blue border
- **GitHub Star Button** - Quick access to star the project
- **Version Check** - Auto-check for updates every 12 hours

**中文：**
- **独立功能开关** - 可单独控制每个功能：
  - 👤 识别用户（替换用户名为花名）
  - ✨ 文字高亮（微妙的背景色）
  - 🖼️ 头像高亮（已识别用户显示蓝色边框）
  - 💬 @@ 快速补全（通过花名提及）
  - 🐛 调试模式
- **@@ Mention 自动补全** - 输入 `@@` 或按 `⌘/Ctrl+Shift+M` 通过花名快速提及团队成员
- **头像高亮** - 已识别用户的头像显示蓝色边框
- **GitHub Star 按钮** - 快速访问项目点星
- **版本检查** - 每 12 小时自动检查更新

### 🐛 Bug Fixes / 修复

**English:**
- Fixed repository path being incorrectly recognized as username
- Fixed Mac keyboard shortcut support (Command key)
- Fixed Mention popup positioning issue
- Fixed avatar highlight display in `overflow:hidden` containers

**中文：**
- 修复仓库路径被误识别为用户名的问题
- 修复 Mac 快捷键支持（Command 键）
- 修复 Mention 弹出框定位问题
- 修复头像高亮在 `overflow:hidden` 容器中的显示问题

### 📖 Documentation / 文档

- Added bilingual README (English + Chinese) / README 添加中英文双语支持
- Added bilingual Release Notes / Release Note 添加中英文双语支持

---

## [1.0.0] - 2025-12-04

### 🎉 Initial Release / 首次发布

**English:**
- GitHub username replacement with nickname format: `username(nickname)`
- Remote JSON data source support
- Local rules management
- Daily auto-update option
- Control panel for configuration

**中文：**
- GitHub 用户名替换为花名格式：`用户名(花名)`
- 远程 JSON 数据源支持
- 本地规则管理
- 每日自动更新选项
- 控制面板配置界面


