# Privacy Policy for GitHub Name Mapper

**Last Updated: December 19, 2025**

## Overview

GitHub Name Mapper is a Chrome extension that enhances your GitHub browsing experience by mapping GitHub usernames to nicknames. This privacy policy explains how the extension handles data.

## Data Collection

### Data We DO NOT Collect

- **NO personal information is collected** from users
- **NO browsing history** is tracked or stored
- **NO data is transmitted** to external servers controlled by us
- **NO analytics or tracking** services are used

### Data You Provide

The extension allows you to configure:

1. **JSON Data Source URLs**: URLs you provide to load username-to-nickname mappings
2. **Local Mapping Rules**: Custom username mappings you create locally

This data is:
- Stored **locally** in your browser using Chrome's storage API
- **Never transmitted** to any server we control
- **Only used** to display nicknames on GitHub pages

## Permissions Explanation

### `storage`
- **Why**: Store your configuration and mapping data locally in your browser
- **Scope**: Only accesses extension's own storage area

### `alarms`
- **Why**: Schedule automatic updates of mapping data from your configured URLs
- **Scope**: Only used for periodic data refresh feature

### `activeTab`
- **Why**: Access the currently active GitHub tab to replace usernames
- **Scope**: Only active when you're on GitHub.com

### `host_permissions` (GitHub domains only)
- **Why**: Run the username replacement feature on GitHub pages
- **Scope**: Only `https://github.com/*` and `https://*.github.com/*`

## Network Requests

The extension makes network requests **only** to:

1. **Your configured JSON URLs**: To fetch username mapping data (optional feature)
2. **GitHub API**: To check for extension updates (optional feature, can be disabled)

These requests are made **at your direction** and data is only stored locally in your browser.

## Data Storage

All data is stored locally using Chrome's `chrome.storage.local` API:
- Configuration settings
- Username mapping data
- Local custom rules

**No data leaves your browser** except to fetch updates from URLs you explicitly configure.

## Third-Party Services

This extension does **NOT** use any third-party analytics, tracking, or advertising services.

The only external connections are:
- To JSON URLs **you configure** (for loading mapping data)
- To GitHub API (for checking extension updates)

## Open Source

This extension is open source. You can review the complete source code at:
https://github.com/MizuhaHimuraki/github-name-mapper

## Changes to Privacy Policy

We may update this privacy policy from time to time. Changes will be posted in the GitHub repository.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/MizuhaHimuraki/github-name-mapper/issues

---

# 隐私政策（中文）

**最后更新：2025年12月19日**

## 概述

GitHub Name Mapper 是一个 Chrome 扩展，通过将 GitHub 用户名映射为花名来增强您的 GitHub 浏览体验。本隐私政策说明扩展如何处理数据。

## 数据收集

### 我们不收集的数据

- **不收集任何个人信息**
- **不跟踪或存储浏览历史**
- **不向我们控制的外部服务器传输任何数据**
- **不使用任何分析或跟踪服务**

### 您提供的数据

扩展允许您配置：

1. **JSON 数据源 URL**：您提供的用于加载用户名到花名映射的 URL
2. **本地映射规则**：您在本地创建的自定义用户名映射

这些数据：
- 使用 Chrome 存储 API **本地存储**在您的浏览器中
- **从不传输**到我们控制的任何服务器
- **仅用于**在 GitHub 页面上显示花名

## 权限说明

### `storage`（存储）
- **用途**：在您的浏览器中本地存储配置和映射数据
- **范围**：仅访问扩展自己的存储区域

### `alarms`（定时器）
- **用途**：安排从您配置的 URL 自动更新映射数据
- **范围**：仅用于定期数据刷新功能

### `activeTab`（活动标签页）
- **用途**：访问当前活动的 GitHub 标签页以替换用户名
- **范围**：仅在您访问 GitHub.com 时活动

### `host_permissions`（仅限 GitHub 域名）
- **用途**：在 GitHub 页面上运行用户名替换功能
- **范围**：仅 `https://github.com/*` 和 `https://*.github.com/*`

## 网络请求

扩展**仅**向以下地址发起网络请求：

1. **您配置的 JSON URL**：获取用户名映射数据（可选功能）
2. **GitHub API**：检查扩展更新（可选功能，可禁用）

这些请求是**根据您的指示**发起的，数据仅存储在您浏览器的本地。

## 数据存储

所有数据都使用 Chrome 的 `chrome.storage.local` API 本地存储：
- 配置设置
- 用户名映射数据
- 本地自定义规则

**除了从您明确配置的 URL 获取更新外，没有数据离开您的浏览器**。

## 第三方服务

本扩展**不使用**任何第三方分析、跟踪或广告服务。

唯一的外部连接是：
- 向**您配置的** JSON URL（用于加载映射数据）
- 向 GitHub API（用于检查扩展更新）

## 开源

本扩展是开源的。您可以在以下地址查看完整源代码：
https://github.com/MizuhaHimuraki/github-name-mapper

## 隐私政策变更

我们可能会不时更新本隐私政策。更改将发布在 GitHub 仓库中。

## 联系方式

如果您对本隐私政策有疑问，请在以下地址提交 issue：
https://github.com/MizuhaHimuraki/github-name-mapper/issues

