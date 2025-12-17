# Features & Management Guide

## Configuration

The extension provides a comprehensive control panel to manage data sources and behavior.

### 1. Popup Menu
Click the extension icon to see a quick status summary and access the full control panel.

![Popup Menu](../img/ui/popup.png)

### 2. Data Source Settings
In the Control Panel, you can configure multiple remote JSON data sources.
- **Multiple URLs**: Add one or more JSON URLs. Data from all enabled sources will be automatically merged (deduplicated by GitHub username).
- **Enable/Disable**: Toggle each data source on or off individually.
- **Load All**: Fetch data from all enabled sources at once.
- **Auto Update**: Enable daily automatic updates from all enabled sources.

![Basic Settings](../img/ui/settings-basic-URL-and-auto-load.png)

### 3. Local Rules
You can manually add mapping rules that override the remote data. This is useful for temporary fixes or adding missing users.

![Local Rules](../img/ui/settings-localrules.png)

### 4. Data Preview
View all loaded mappings (both remote and local) in a searchable table.

![Data View](../img/ui/settings-data-view.png)

### 5. Feature Switches
Toggle specific features on or off according to your needs.

![Feature Switches](../img/ui/settings-basic-switch.png)

---

## In-Action Examples

The extension automatically replaces GitHub usernames with "Username(Nickname)" in various places.

### 1. Commit History
See who really committed the code.

![Commit History](../img/demos/nick-in-commit.png)

### 2. Issue/PR Assignments
Easily identify assignees.

![Assignments](../img/demos/nick-in-assigned.png)

### 3. Review Requests
Know who you are requesting a review from.

![Review Requests](../img/demos/ask-for-review-1.png)
![Review Requests Dropdown](../img/demos/ask-for-review-2.png)

### 4. Discussions
See nicknames in discussion threads.

![Discussions](../img/demos/ask-for-discussion-1.png)

### 5. Workflow Runs
Identify who triggered the workflow.

![Workflow Runs](../img/demos/nick-in-workflow.png)

### 6. Highlight Partner
(Feature demonstration if applicable)

![Highlight Partner](../img/demos/highlight-your-partner.png)

