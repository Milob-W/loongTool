# loongTools — 开发者工具箱

## 项目概览
纯浏览器端 SPA 开发者工具箱，数据不上传服务器。所有处理在浏览器中完成。

## 架构约定
- **单页应用**，hash 路由（`#col-select`），无需构建工具
- **工具注册表**：`js/app.js` 中的 `tools` 对象，key 为工具 ID，value 包含 name/desc/usage/module/init
- **工具模块**：每个文件定义一个全局对象（如 `const AdvTools = {}`），包含 `init()` 方法，由 app.js 自动调用一次
- **面板标识**：`id="panel-{toolId}"`（index.html 中），`data-tool="{toolId}"`（侧栏按钮）
- **DOM 注入**：每个 tool 的 render 方法直接设置 `innerHTML`；事件绑定用 `onclick` 全局函数调用
- **能力说明**：每个工具在 app.js 中提供 `desc`（一句话能力）和 `usage`（使用教程）字段，切换工具时自动显示在头部和可折叠 guide 区
- **侧栏搜索**：`#tool-search` 输入框实时过滤，同步匹配 `name` 和 `desc`；匹配时自动收起无结果的分组

## 添加新工具（三步）
1. **index.html**：添加侧栏 `nav-item`（`data-tool` + `onclick="navigateTo('id')"`）+ 面板 `<div class="tool-panel" id="panel-{id}">`
2. **app.js**：在 `tools` 对象注册，填入 name + module + init 方法名
3. **工具 JS 文件**：实现 render 方法，在模块 `init()` 中调用

## 启动
```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 编码规范
- **所有注释和说明使用中文**
- 每次有意义的修改后 git commit
- 每个工具模块内独立实现 `showToast(msg)` 方法
- CSS 使用 warm-ui 风格（`--accent: #d97757`），全局样式在 `css/style.css`
- 工具 UI 使用 `.card` / `.grid-2` / `.form-row` / `.btn-group` 等组件类
- 纯前端，不使用任何 npm 包或构建工具（Mermaid 图表通过 CDN 动态加载）
- 密码/UUID 等敏感操作使用 Web Crypto API

## 文件结构
- `index.html` — 主入口，侧栏 + 面板占位 + 脚本加载
- `css/style.css` — warm-ui 全局样式
- `js/app.js` — 路由、导航、工具注册
- `js/tools/` — 按功能分 7 个模块：
  - `text-tools.js` — 文本处理（列选择/包裹/连接/大小写/排序/对比/正则）
  - `json-tools.js` — JSON/YAML 工具
  - `encode-tools.js` — Base64/URL/HTML/哈希/UUID/时间戳
  - `more-tools.js` — ASCII 艺术/莫尔斯/编辑距离/密码/进制/转义/ROT/字频/罗马/CSS单位/颜色
  - `stream-tools.js` — Data Stream Pipeline
  - `adv-tools.js` — JSON Explorer/多列表比对/SQL/Mermaid/Cron/XML/UA/ASCII表格/日期格式转换/HTTP状态码/ASCII码表/数据大小换算/文本统计/时间间隔换算/端口查询
  - `csv-tools.js` — CSV 处理（按行/按列/查找替换/正则/清洗/转SQL/JSON/Markdown）

## 工具加载顺序
脚本加载在 index.html 底部按顺序：stream-tools → adv-tools → text-tools → csv-tools → json-tools → encode-tools → more-tools → app.js
