# loongTools 架构说明

## 1. 项目概览

纯浏览器端 SPA（单页应用）开发者工具箱，所有数据处理在浏览器中完成，数据不上传服务器。

**技术栈**：原生 HTML5 + CSS3 + JavaScript（ES2020+），无任何构建工具或 npm 依赖。

---

## 2. 分层架构

```
┌──────────────────────────────────────────────────┐
│                   index.html                      │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  侧栏导航      │  │  主内容区                │  │
│  │  .sidebar     │  │  .main                  │  │
│  │   ┌─────────┐ │  │  ┌─ header (名称+描述)  │  │
│  │   │nav-item │ │  │  ├─ .tool-guide (教程)  │  │
│  │   │nav-item │ │  │  └─ .content            │  │
│  │   │  ...    │ │  │     └─ .tool-panel*N    │  │
│  │   └─────────┘ │  │        (当前激活一个)    │  │
│  └──────────────┘  └──────────────────────────┘  │
│                     toast 组件                    │
└──────────────────────────────────────────────────┘
```

- **HTML (`index.html`)**：结构层，定义侧栏、面板占位、脚本加载顺序
- **CSS (`css/style.css`)**：表现层，warm-ui 设计系统
- **JS (`js/`)**：行为层，模块路由 + 6 个功能模块

---

## 3. 模块系统

### 3.1 工具注册表 (`js/app.js`)

中心枢纽 `tools` 对象，每个工具一个条目：

```javascript
'tool-id': {
  name: '显示名称',         // 侧栏和头部显示
  desc: '一句话能力说明',    // 头部下方显示
  usage: '使用教程...',     // 可折叠 guide 区
  module: ModuleObject,     // 全局模块对象引用
  init: 'renderMethodName', // 模块上的渲染方法名
}
```

**关键函数**：

| 函数 | 职责 |
|------|------|
| `initApp()` | DOMContentLoaded 时调用，遍历 tools 调用每个模块的 `init()` |
| `navigateTo(id)` | hash 路由：切换激活面板、更新导航高亮、更新头部描述和 guide |
| `toggleGuide()` | 展开/收起使用教程区 |

### 3.2 模块生命周期

```
DOMContentLoaded
  └→ initApp()
       ├→ 遍历 tools
       │    └→ 对每个 module 调用 module.init()（每个模块只调一次）
       │         └→ module.init() 内部调用 renderXxx() 方法
       │              └→ renderXxx() 设置 panel 的 innerHTML
       └→ navigateTo(hash)
            └→ 显示目标 panel，更新头部/guide

用户点击侧栏 nav-item
  └→ navigateTo(id)
       ├→ 切换 .tool-panel.active
       ├→ 更新侧栏高亮
       ├→ 更新头部名称 + 描述
       ├→ 更新 guide 内容（折叠状态）
       └→ 设置 window.location.hash

hashchange（浏览器前进/后退）
  └→ navigateTo(hash)
```

**关键规则**：
- 模块 `init()` 在应用启动时一次性调用，每个模块仅一次（`Set` 去重）
- `renderXxx()` 方法通过 `document.getElementById('panel-{id}').innerHTML = ...` 注入 DOM
- 事件绑定全部使用 `onclick="Module.method()"` 全局调用

### 3.3 模块文件职责

| 文件 | 工具数 | 职责范围 |
|------|--------|----------|
| `text-tools.js` | 8 | 列选择/处理、包裹/连接、大小写、排序、对比、正则 |
| `csv-tools.js` | 1 | CSV 处理（按行/按列/查找替换/正则/清洗/转SQL/JSON/Markdown）|
| `json-tools.js` | 2 | JSON 格式化、JSON↔YAML |
| `encode-tools.js` | 6 | Base64、URL、HTML、哈希、UUID、时间戳 |
| `more-tools.js` | 12 | ASCII 艺术、莫尔斯、编辑距离、密码、进制、转义、ROT、字频、罗马、重复、CSS 单位、颜色 |
| `stream-tools.js` | 1 | Data Stream Pipeline（有状态对象、内部步骤链表） |
| `adv-tools.js` | 17 | JSON Explorer、列表比对、SQL/Mermaid/Cron/XML/UA/ASCII 表格/日期格式/HTTP 码/ASCII 码表/数据大小/文本统计/时间间隔/端口 |

### 3.4 工具面板命名约定

```
侧栏按钮: data-tool="tool-id"    onclick="navigateTo('tool-id')"
HTML面板: <div class="tool-panel" id="panel-tool-id">
注册表:   'tool-id': { ... }
```

---

## 4. CSS 设计系统 (warm-ui)

### 4.1 设计令牌（CSS 自定义属性）

```
--bg: #faf9f5            // 页面背景（暖白）
--surface: #ffffff        // 卡片表面
--border: #e8e6dc         // 边框（浅棕）
--text: #141413           // 主文字
--text-secondary: #6b6a63 // 次要文字
--accent: #d97757         // 强调色（珊瑚橙）
--green: #788c5d          // 成功/绿色
--red: #c44               // 错误/红色
--blue: #5a7c9e           // 信息/蓝色
--radius: 8px             // 卡片圆角
--shadow: 0 1px 3px ...   // 卡片阴影
```

### 4.2 组件类

| 类名 | 用途 |
|------|------|
| `.card` | 白色卡片容器，带边框和阴影 |
| `.card-header` | 卡片标题栏（小号大写、左侧色条） |
| `.card-body` | 卡片内容区 |
| `.grid-2` / `.grid-3` | 2/3 列网格布局 |
| `.form-row` | 表单行（flex 对齐的 label+input 组合） |
| `.btn` / `.btn-primary` / `.btn-sm` / `.btn-xs` | 按钮 |
| `.btn-group` | 按钮组（flex 换行） |
| `.badge` / `.badge-success` / `.badge-danger` / `.badge-info` | 标签徽章 |
| `.tab-bar` / `.tab-item` / `.tab-content` | 标签页切换 |
| `.tool-panel` / `.tool-panel.active` | 工具面板（display 切换） |
| `.tool-guide` | 可折叠使用教程区域 |
| `.tool-desc` | 头部能力说明文字 |
| `.toast` / `.toast.visible` | 底部 Toast 提示 |
| `.empty-state` | 空状态占位 |
| `.table-wrap` | 可横向滚动的表格容器 |
| `.status-bar` | 状态信息栏 |

### 4.3 响应式

768px 断点：侧栏缩至 200px，grid-2/grid-3 切换为单列。

---

## 5. 关键设计决策

### 5.1 为什么不用框架？
- 零依赖启动：`python3 -m http.server` 即可
- 工具类场景 DOM 操作简单，框架反而增加心智负担
- 全局 `onclick` 模式在工具数量不多时完全够用

### 5.2 为什么事件用全局 onclick 而非 addEventListener？
- `renderXxx()` 每次重新设置 `innerHTML`，事件监听会被清除
- 全局 `onclick="Module.method()"` 不会被 innerHTML 覆盖影响
- 所有工具方法挂在全局对象（`AdvTools`、`TextTools` 等）上，天然可访问

### 5.3 为什么模块 init() 只调一次？
- 面板 DOM 在初始化时一次性构建完成后不再变化
- `navigateTo()` 只切换显示/隐藏，不重新渲染
- 避免重复创建 DOM 导致性能浪费

### 5.4 安全模型
- **无网络请求**：所有处理在浏览器本地完成
- **Web Crypto API**：哈希计算、UUID 生成、密码生成使用 `crypto.subtle` / `crypto.randomUUID`
- **用户数据保护**：没有任何数据离开浏览器（Mermaid CDN 加载只获取库文件，不含用户数据）
- **Content Security**：无 eval，无动态脚本执行

### 5.5 外部依赖（仅 Mermaid）
- Mermaid 图表库从 CDN 按需加载（`https://cdn.jsdelivr.net/npm/mermaid@11/...`）
- 仅在用户点击"渲染图表"时加载，非全局注入
- 加载失败时提示用户复制代码到 mermaid.live 渲染

---

## 6. 文件结构

```
loongTools/
├── index.html              # 主入口：侧栏 + 面板占位 + 脚本标签
├── AGENTS.md               # OpenCode 指令文件
├── ARCHITECTURE.md         # 本文
├── css/
│   └── style.css           # warm-ui 设计系统（721行）
└── js/
    ├── app.js              # 路由、导航、工具注册（163行）
    └── tools/
        ├── stream-tools.js   # Data Stream Pipeline（751行，有状态）
        ├── adv-tools.js      # 高级/实用/冷门工具合集（1795行）
        ├── text-tools.js     # 文本处理核心工具（992行）
        ├── csv-tools.js      # CSV 处理工具（1075行）
        ├── json-tools.js     # JSON/YAML 处理（280行）
        ├── encode-tools.js   # 编码解码/安全/生成（453行）
        └── more-tools.js     # 冷门/新奇工具合集（1380行）
```

### 6.1 脚本加载顺序（关键）

```
stream-tools.js  →  adv-tools.js  →  text-tools.js  →  csv-tools.js  →  
json-tools.js  →  encode-tools.js  →  more-tools.js  →  app.js
```

`app.js` 必须在最后加载，因为它依赖前面所有模块的全局对象。

---

## 7. 扩展指南：添加新工具

### 7.1 三步法

```
Step 1: index.html
  ├─ 侧栏: <button class="nav-item" data-tool="my-tool" onclick="navigateTo('my-tool')">
  └─ 面板: <div class="tool-panel" id="panel-my-tool"></div>

Step 2: app.js
  └─ tools['my-tool'] = { name, desc, usage, module: SomeModule, init: 'renderMyTool' }

Step 3: SomeModule 所在的 JS 文件
  ├─ init() 中添加 this.renderMyTool();
  └─ renderMyTool() 中设置 document.getElementById('panel-my-tool').innerHTML = '...'
```

### 7.2 工具实现模式

```javascript
const MyModule = {
  init() {
    this.renderMyTool();
  },

  renderMyTool() {
    document.getElementById('panel-my-tool').innerHTML = `
      <div class="card">
        <div class="card-header">🔧 工具名称</div>
        <div class="card-body">
          <textarea id="my-input" class="large" placeholder="输入..."></textarea>
          <div class="btn-group mt-2">
            <button class="btn btn-primary" onclick="MyModule.doAction()">执行</button>
          </div>
        </div>
        <div class="card-body">
          <div id="my-output"></div>
        </div>
      </div>
    `;
  },

  doAction() {
    // 交互逻辑
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }
};
```

### 7.3 UI 组件使用建议

- **输入区**：`<textarea class="large">` 大文本 / `<input type="text">` 短输入
- **操作区**：`<div class="btn-group">` 包裹按钮
- **配置区**：`<div class="form-row">` 包裹 label + input/select
- **多列布局**：`<div class="grid-2">` 或 `.grid-3`
- **输出展示**：表格用 `.table-wrap` + `<table>`，代码用 `<pre class="code-block">`
- **状态反馈**：`.status-bar` 显示辅助信息，`showToast()` 显示临时提示
- **空状态**：`.empty-state` 提示用户操作

---

## 8. 启动

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

无需构建、无需 `npm install`、无需任何配置。
