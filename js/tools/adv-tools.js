const AdvTools = {
  init() {
    this.renderJsonExplorer();
    this.renderListCompare();
    this.renderSqlFormatter();
    this.renderMermaid();
    this.renderCronParser();
    this.renderXmlFormatter();
    this.renderUaParser();
    this.renderAsciiTable();
    this.renderDateFormat();
    this.renderHttpCodes();
    this.renderAsciiCodes();
    this.renderDataSize();
    this.renderTextStats();
    this.renderTimeDuration();
    this.renderPortLookup();
    this.renderSpringBootBanner();
  },

  /* =================================================================
   * JSON EXPLORER — JSON树/字段点击高亮/JSONPath提取
   * ================================================================= */
  renderJsonExplorer() {
    document.getElementById('panel-json-explorer').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">📦 JSON 输入</div>
          <div class="card-body">
            <textarea id="je-input" class="large" placeholder='粘贴 JSON 数据...\n例如:\n{\n  "users": [\n    {"name":"Alice","age":30},\n    {"name":"Bob","age":25}\n  ]\n}'></textarea>
            <div class="btn-group mt-2">
              <button class="btn btn-primary" onclick="AdvTools.buildJsonTree()">🌲 构建树</button>
              <button class="btn" onclick="AdvTools.formatJsonInput()">格式化</button>
              <button class="btn" onclick="document.getElementById('je-input').value=''">清空</button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">🔍 JSONPath / 提取</div>
          <div class="card-body">
            <div class="form-row">
              <input type="text" id="je-path" placeholder='点击树节点自动生成, 或手动输入如 $.users[*].name' style="width:100%;font-family:monospace">
              <button class="btn btn-sm btn-primary" onclick="AdvTools.extractByPath()">提取</button>
            </div>
            <div class="status-bar" id="je-extract-status"></div>
            <select id="je-field-select" style="width:100%;display:none;margin-top:4px" onchange="AdvTools.onFieldSelect()">
              <option value="">选择字段...</option>
            </select>
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">🌳 JSON 结构树 <span class="text-xs text-muted" id="je-tree-status"></span></div>
          <div class="card-body" id="je-tree" style="max-height:500px;overflow-y:auto;font-family:monospace;font-size:0.8125rem;line-height:1.6">
            <div class="empty-state">点击"构建树"</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">📋 提取的值</div>
          <div class="card-body relative">
            <textarea id="je-extract-output" class="large" readonly placeholder="提取的值显示在这里..."></textarea>
            <div class="status-bar" id="je-extract-count"></div>
          </div>
        </div>
      </div>
    `;
  },

  /* build and render an interactive JSON tree */
  buildJsonTree() {
    const raw = document.getElementById('je-input').value.trim();
    if (!raw) return showToast('请先输入 JSON');

    let data;
    try { data = JSON.parse(raw); }
    catch (e) { return showToast(`JSON 解析失败: ${e.message}`); }

    const container = document.getElementById('je-tree');
    const status = document.getElementById('je-tree-status');

    const type = Array.isArray(data) ? `Array[${data.length}]` : typeof data;
    status.textContent = `(${type})`;

    const { html, paths } = this.buildTreeNode(data, '$', 0);
    container.innerHTML = html;

    /* build field selector */
    const allFields = new Set();
    this.collectFieldPaths(data, '$', allFields);
    const sel = document.getElementById('je-field-select');
    sel.innerHTML = '<option value="">选择字段...</option>' +
      [...allFields].sort().map(p => `<option value="${p}">${p}</option>`).join('');
    sel.style.display = 'block';
  },

  /* recursively build tree node HTML, collecting all value paths */
  buildTreeNode(obj, path, depth) {
    const indent = depth * 16;
    const esc = v => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    if (obj === null) return { html: `<div style="padding-left:${indent}px"><span class="je-key" data-path="${esc(path)}">${esc(path.split('/').pop())}</span>: <span class="je-val" style="color:var(--text-muted)">null</span></div>`, paths: [path] };

    if (typeof obj === 'string') {
      const display = obj.length > 80 ? esc(obj.slice(0, 80)) + '…' : esc(obj);
      return { html: `<div style="padding-left:${indent}px" class="je-node" data-path="${esc(path)}">
        <span class="je-key" data-path="${esc(path)}">${esc(path.split('/').pop())}</span>:
        <span class="je-val je-str" data-path="${esc(path)}" onclick="AdvTools.onValClick('${esc(path)}')" title="点击提取">"${display}"</span>
      </div>`, paths: [path] };
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return { html: `<div style="padding-left:${indent}px" class="je-node" data-path="${esc(path)}">
        <span class="je-key" data-path="${esc(path)}">${esc(path.split('/').pop())}</span>:
        <span class="je-val je-prim" data-path="${esc(path)}" onclick="AdvTools.onValClick('${esc(path)}')" title="点击提取">${esc(obj)}</span>
      </div>`, paths: [path] };
    }

    if (Array.isArray(obj)) {
      const id = `je-arr-${depth}-${Math.random().toString(36).slice(2, 6)}`;
      let html = `<div style="padding-left:${indent}px">
        <span class="je-toggle" onclick="AdvTools.toggleNode('${id}')">▼</span>
        <span class="je-key" data-path="${esc(path)}">${esc(path.split('/').pop() || '[]')}</span>:
        <span class="je-bracket">[${obj.length}]</span>
      </div><div id="${id}" class="je-children">`;
      const allPaths = [path];
      obj.forEach((item, i) => {
        const childPath = `${path}[${i}]`;
        const { html: childHtml, paths: childPaths } = this.buildTreeNode(item, childPath, depth + 1);
        html += childHtml;
        allPaths.push(...childPaths);
      });
      html += `</div>`;
      if (obj.length === 0) html = html.replace('▼', '▸').replace(`<div id="${id}"`, `<div id="${id}" style="display:none"`);
      return { html, paths: allPaths };
    }

    if (typeof obj === 'object') {
      const id = `je-obj-${depth}-${Math.random().toString(36).slice(2, 6)}`;
      const keys = Object.keys(obj);
      let html = `<div style="padding-left:${indent}px">
        <span class="je-toggle" onclick="AdvTools.toggleNode('${id}')">▼</span>
        <span class="je-key" data-path="${esc(path)}">${esc(path.split('/').pop() || '{}')}</span>:
        <span class="je-bracket">{${keys.length}}</span>
      </div><div id="${id}" class="je-children">`;
      const allPaths = [path];
      keys.forEach(key => {
        const childPath = `${path}.${key}`;
        const { html: childHtml, paths: childPaths } = this.buildTreeNode(obj[key], childPath, depth + 1);
        html += childHtml;
        allPaths.push(...childPaths);
      });
      html += `</div>`;
      if (keys.length === 0) html = html.replace('▼', '▸').replace(`<div id="${id}"`, `<div id="${id}" style="display:none"`);
      return { html, paths: allPaths };
    }

    return { html: '', paths: [] };
  },

  /* collect all distinct field paths from an object/array */
  collectFieldPaths(obj, basePath, set) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      if (obj.length > 0) this.collectFieldPaths(obj[0], basePath, set);
      return;
    }
    for (const key of Object.keys(obj)) {
      const p = `${basePath}.${key}`;
      set.add(p);
      this.collectFieldPaths(obj[key], p, set);
    }
  },

  /* toggle tree node expand/collapse */
  toggleNode(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const toggle = el.previousElementSibling?.querySelector?.('.je-toggle') || el.previousElementSibling;
    if (el.style.display === 'none') {
      el.style.display = 'block';
      if (toggle) toggle.textContent = '▼';
    } else {
      el.style.display = 'none';
      if (toggle) toggle.textContent = '▸';
    }
  },

  /* when a value is clicked: compute JSONPath, highlight, extract */
  onValClick(path) {
    document.getElementById('je-path').value = this.pathToJsonPath(path);
    /* highlight the node */
    document.querySelectorAll('.je-highlight').forEach(el => el.classList.remove('je-highlight'));
    document.querySelectorAll(`[data-path="${path}"]`).forEach(el => el.classList.add('je-highlight'));
    this.extractByPath();
  },

  /* convert internal path format to JSONPath */
  pathToJsonPath(path) {
    /* internal path: $.users[0].name -> $.users[*].name for extraction */
    const wildcard = path.replace(/\[\d+\]/g, '[*]');
    return wildcard;
  },

  onFieldSelect() {
    const path = document.getElementById('je-field-select').value;
    if (path) {
      document.getElementById('je-path').value = path.replace(/\.(\w+)$/, '[*].$1');
      this.extractByPath();
    }
  },

  /* extract values by JSONPath */
  extractByPath() {
    const raw = document.getElementById('je-input').value.trim();
    const jpath = document.getElementById('je-path').value.trim();
    if (!raw || !jpath) return;

    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }

    /* parse JSONPath and resolve */
    const results = this.resolveJsonPath(data, jpath);
    const output = document.getElementById('je-extract-output');
    const count = document.getElementById('je-extract-count');

    if (results.length === 0) {
      output.value = '⚠️ 无匹配结果';
      count.textContent = '0 项';
      return;
    }

    output.value = results.map((v, i) => {
      const str = typeof v === 'string' ? v : JSON.stringify(v, null, 0);
      return `${i + 1}. ${str}`;
    }).join('\n');

    count.textContent = `${results.length} 项`;

    /* also show in the tree via highlight */
    document.querySelectorAll('.je-highlight').forEach(el => el.classList.remove('je-highlight'));
    document.querySelectorAll('.je-extracted').forEach(el => el.classList.remove('je-extracted'));
    this.highlightMatches(data, jpath, '$');
  },

  /* resolve JSONPath: supports $, ., [n], [*], wildcards */
  resolveJsonPath(obj, path) {
    if (!path.startsWith('$')) path = '$' + path;
    let segments = path.replace(/^\$\.?/, '').split(/\.(?![^[]*\])/);
    if (segments[0] === '') segments.shift();

    let current = [obj];

    for (const seg of segments) {
      if (!seg) continue;
      const next = [];

      for (const item of current) {
        if (item === null || item === undefined) continue;

        /* handle [*] or [n] */
        const bracketMatch = seg.match(/^(\w+)?\[([^\]]*)\]$/);
        if (bracketMatch) {
          const [, key, index] = bracketMatch;
          let arr = key ? item[key] : item;
          if (!Array.isArray(arr)) arr = [arr];

          if (index === '*') {
            next.push(...arr);
          } else {
            const idx = parseInt(index);
            if (!isNaN(idx) && idx >= 0 && idx < arr.length) next.push(arr[idx]);
          }
          continue;
        }

        /* handle [*]atend — array wildcard */
        if (seg === '[*]' && Array.isArray(item)) {
          next.push(...item);
          continue;
        }

        /* plain key */
        if (typeof item === 'object' && item !== null) {
          if (Array.isArray(item)) {
            item.forEach(sub => {
              if (sub && typeof sub === 'object' && seg in sub) next.push(sub[seg]);
            });
          } else if (seg in item) {
            next.push(item[seg]);
          }
        }
      }
      current = next;
    }

    return current;
  },

  /* highlight matching nodes in tree */
  highlightMatches(obj, path, basePath) {
    const displayPath = this.pathToJsonPath(basePath);
    if (displayPath === path) {
      document.querySelectorAll(`[data-path="${basePath}"]`).forEach(el => {
        if (el.classList.contains('je-val')) el.classList.add('je-extracted');
      });
    }

    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => this.highlightMatches(item, path, `${basePath}[${i}]`));
    } else {
      for (const key of Object.keys(obj)) {
        this.highlightMatches(obj[key], path, `${basePath}.${key}`);
      }
    }
  },

  formatJsonInput() {
    const raw = document.getElementById('je-input').value.trim();
    if (!raw) return;
    try {
      document.getElementById('je-input').value = JSON.stringify(JSON.parse(raw), null, 2);
    } catch (e) {
      showToast(`JSON 格式错误: ${e.message}`);
    }
    this.buildJsonTree();
  },

  /* =================================================================
   * LIST COMPARATOR — 多列表并集/交集/独有数据比对
   * ================================================================= */
  renderListCompare() {
    const listColors = ['#E8765A', '#5A7C9E', '#788C5D', '#D4A017', '#9B59B6'];
    const listNames = ['A', 'B', 'C', 'D', 'E'];

    let listHtml = '';
    for (let i = 0; i < 3; i++) {
      listHtml += `
        <div class="card" style="border-left: 4px solid ${listColors[i]}">
          <div class="card-header" style="color:${listColors[i]}">
            <span style="font-weight:700">列表 ${listNames[i]}</span>
            <span class="badge" id="lc-count-${i}" style="background:${listColors[i]}20;color:${listColors[i]};margin-left:8px">0 项</span>
          </div>
          <div class="card-body">
            <textarea id="lc-input-${i}" class="large" placeholder="每行一项..." oninput="AdvTools.updateListCount(${i})" style="min-height:100px"></textarea>
          </div>
        </div>`;
    }

    /* extra lists D, E (initially hidden) */
    for (let i = 3; i < 5; i++) {
      listHtml += `
        <div class="card" style="border-left: 4px solid ${listColors[i]};display:none" id="lc-card-${i}">
          <div class="card-header" style="color:${listColors[i]}">
            <span style="font-weight:700">列表 ${listNames[i]}</span>
            <span class="badge" id="lc-count-${i}" style="background:${listColors[i]}20;color:${listColors[i]};margin-left:8px">0 项</span>
          </div>
          <div class="card-body">
            <textarea id="lc-input-${i}" class="large" placeholder="每行一项..." oninput="AdvTools.updateListCount(${i})" style="min-height:100px"></textarea>
          </div>
        </div>`;
    }

    document.getElementById('panel-list-compare').innerHTML = `
      <div class="grid-2" id="lc-grid">
        ${listHtml}
      </div>
      <div class="card">
        <div class="card-header">⚙️ 操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="AdvTools.doListCompare()">🔍 比对全部列表</button>
            <button class="btn" onclick="AdvTools.addList()" id="lc-add-btn">+ 添加列表 (D)</button>
            <button class="btn" onclick="AdvTools.clearAllLists()">🗑️ 清空全部</button>
          </div>
          <div class="form-row mt-2">
            <label>比较模式</label>
            <select id="lc-mode">
              <option value="full">全部对比 (独有+共有)</option>
              <option value="unique-only">仅显示独有数据</option>
              <option value="common-only">仅显示共有数据</option>
            </select>
            <label><input type="checkbox" id="lc-ignore-case" checked> 忽略大小写</label>
            <label><input type="checkbox" id="lc-trim"> 去除首尾空格</label>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">📊 比对结果</div>
        <div class="card-body" id="lc-result">
          <div class="empty-state">点击"比对全部列表"查看结果</div>
        </div>
      </div>
    `;
  },

  _lcListCount: 3,

  updateListCount(idx) {
    const val = document.getElementById(`lc-input-${idx}`).value;
    const lines = val.split('\n').filter(l => l.trim()).length;
    const badge = document.getElementById(`lc-count-${idx}`);
    if (badge) badge.textContent = `${lines} 项`;
  },

  addList() {
    if (this._lcListCount >= 5) {
      showToast('最多支持 5 个列表');
      return;
    }
    const card = document.getElementById(`lc-card-${this._lcListCount}`);
    if (card) {
      card.style.display = 'block';
      this._lcListCount++;
      const btn = document.getElementById('lc-add-btn');
      const next = ['D', 'E'][this._lcListCount - 3] || '';
      btn.textContent = this._lcListCount < 5 ? `+ 添加列表 (${next})` : '已添加全部 (最多 5 个)';
      btn.disabled = this._lcListCount >= 5;
    }
  },

  clearAllLists() {
    for (let i = 0; i < 5; i++) {
      const ta = document.getElementById(`lc-input-${i}`);
      if (ta) { ta.value = ''; this.updateListCount(i); }
    }
    document.getElementById('lc-result').innerHTML = '<div class="empty-state">已清空</div>';
  },

  doListCompare() {
    const listColors = ['#E8765A', '#5A7C9E', '#788C5D', '#D4A017', '#9B59B6'];
    const listNames = ['A', 'B', 'C', 'D', 'E'];
    const mode = document.getElementById('lc-mode').value;
    const ignoreCase = document.getElementById('lc-ignore-case').checked;
    const doTrim = document.getElementById('lc-trim').checked;

    /* collect lists */
    const lists = [];
    for (let i = 0; i < this._lcListCount; i++) {
      const raw = document.getElementById(`lc-input-${i}`).value;
      let items = raw.split('\n').filter(l => l.trim());
      if (doTrim) items = items.map(s => s.trim());
      if (ignoreCase) items = items.map(s => s.toLowerCase());
      lists.push({
        name: listNames[i],
        color: listColors[i],
        raw: raw.split('\n').filter(l => l.trim()),
        normalized: items
      });
    }

    if (lists.every(l => l.normalized.length === 0)) {
      return showToast('请至少在一个列表中输入数据');
    }

    const container = document.getElementById('lc-result');
    let html = '<div class="table-wrap">';

    /* compute statistics */
    const allItems = new Map(); /* normalized -> { counts: [], samples: [] } */
    lists.forEach((list, li) => {
      const seen = new Set();
      list.normalized.forEach((item, ii) => {
        const key = item;
        if (!allItems.has(key)) {
          allItems.set(key, { counts: new Array(lists.length).fill(0), samples: new Array(lists.length).fill('') });
        }
        const entry = allItems.get(key);
        if (!seen.has(key)) { entry.counts[li]++; seen.add(key); }
        if (!entry.samples[li]) entry.samples[li] = list.raw[ii] || item;
      });
    });

    const totalUnique = allItems.size;

    /* categorize */
    const categories = {
      unique: [],    /* in exactly 1 list */
      common: [],   /* in ALL lists */
      partial: [],  /* in 2..N-1 lists */
    };

    for (const [key, entry] of allItems) {
      const presentIn = entry.counts.reduce((a, c, i) => c > 0 ? [...a, i] : a, []);
      const pCount = presentIn.length;

      const samples = entry.samples.filter(s => s);
      const display = samples[0] || key;

      if (pCount === 1) {
        categories.unique.push({ key, listIdx: presentIn[0], display, sample: display });
      } else if (pCount === lists.length) {
        categories.common.push({ key, display, sample: display });
      } else {
        categories.partial.push({ key, presentIn, display, sample: display, pCount });
      }
    }

    /* render */
    const showUnique = mode !== 'common-only';
    const showCommon = mode !== 'unique-only';

    /* summary bar */
    html += `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <span class="badge badge-info">总计 ${totalUnique} 项</span>
      <span class="badge badge-danger">独有 ${categories.unique.length} 项</span>
      <span class="badge badge-success">共有 ${categories.common.length} 项</span>
      <span class="badge" style="background:var(--blue-bg);color:var(--blue)">部分重叠 ${categories.partial.length} 项</span>
    </div>`;

    if (showUnique) {
      /* group unique by list */
      const byList = {};
      for (const u of categories.unique) {
        if (!byList[u.listIdx]) byList[u.listIdx] = [];
        byList[u.listIdx].push(u);
      }

      for (let li = 0; li < lists.length; li++) {
        const items = byList[li] || [];
        if (items.length === 0) continue;
        const color = lists[li].color;
        html += `<div style="margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${color}"></span>
            <span style="font-weight:600">仅列表 ${lists[li].name}: <span style="color:${color}">${items.length} 项</span></span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${items.slice(0, 100).map(u =>
              `<span style="background:${color}15;color:${color};padding:2px 8px;border-radius:4px;font-size:0.75rem;font-family:monospace;border:1px solid ${color}30">${u.sample}</span>`
            ).join('')}
            ${items.length > 100 ? `<span class="text-muted text-xs">...还有 ${items.length - 100} 项</span>` : ''}
          </div>
        </div>`;
      }
    }

    if (showCommon && categories.common.length > 0) {
      html += `<div style="margin-bottom:12px">
        <div style="font-weight:600;margin-bottom:4px;color:var(--green)">✅ 所有列表共有: ${categories.common.length} 项</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${categories.common.slice(0, 100).map(u =>
            `<span style="background:var(--green-bg);color:var(--green);padding:2px 8px;border-radius:4px;font-size:0.75rem;font-family:monospace;border:1px solid #788c5d40">${u.sample}</span>`
          ).join('')}
          ${categories.common.length > 100 ? `<span class="text-muted text-xs">...还有 ${categories.common.length - 100} 项</span>` : ''}
        </div>
      </div>`;
    }

    /* partial overlaps — grouped by combination */
    if (categories.partial.length > 0 && mode === 'full') {
      const comboGroups = {};
      for (const p of categories.partial) {
        const comboKey = p.presentIn.sort().join(',');
        if (!comboGroups[comboKey]) comboGroups[comboKey] = { indices: p.presentIn, items: [] };
        comboGroups[comboKey].items.push(p);
      }

      html += `<div style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:8px;color:var(--blue)">🔗 部分重叠</div>`;
      for (const [comboKey, group] of Object.entries(comboGroups)) {
        const names = group.indices.map(i => lists[i].name).join(' + ');
        html += `<div style="margin-bottom:8px">
          <div class="text-xs text-muted">${names}: ${group.items.length} 项</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${group.items.slice(0, 50).map(u =>
              `<span style="background:var(--bg);padding:2px 8px;border-radius:4px;font-size:0.75rem;font-family:monospace;border:1px solid var(--border)">${u.sample}</span>`
            ).join('')}
            ${group.items.length > 50 ? `<span class="text-muted text-xs">...还有 ${group.items.length - 50} 项</span>` : ''}
          </div>
        </div>`;
      }
      html += `</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  },

  /* =================================================================
   * SQL FORMATTER — SQL关键字大写/子句缩进/压缩
   * ================================================================= */
  renderSqlFormatter() {
    document.getElementById('panel-sql-formatter').innerHTML = `
      <div class="card">
        <div class="card-header">🗃️ SQL 格式化</div>
        <div class="card-body">
          <textarea id="sql-input" class="large" placeholder="粘贴 SQL 语句..." style="min-height:200px;font-family:monospace"></textarea>
          <div class="btn-group mt-2">
            <button class="btn btn-primary" onclick="AdvTools.formatSql()">✨ 格式化</button>
            <button class="btn" onclick="AdvTools.minifySql()">📦 压缩</button>
            <button class="btn" onclick="document.getElementById('sql-input').value=''">🗑️ 清空</button>
          </div>
        </div>
        <div class="card-body">
          <label class="text-xs text-muted">输出</label>
          <textarea id="sql-output" class="large" readonly style="min-height:200px;font-family:monospace"></textarea>
          <div class="btn-group mt-2">
            <button class="btn btn-sm" onclick="AdvTools.copySqlOutput()">📋 复制结果</button>
          </div>
        </div>
      </div>`;
  },

  /* SQL 关键字列表（长优先） */
  _sqlKeywords: [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
    'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE FROM', 'DELETE', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'CREATE INDEX', 'DROP INDEX', 'CREATE VIEW', 'DROP VIEW',
    'CREATE DATABASE', 'DROP DATABASE', 'TRUNCATE TABLE',
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
    'CROSS JOIN', 'JOIN', 'ON', 'USING',
    'AND', 'OR',
    'UNION ALL', 'UNION', 'EXCEPT', 'INTERSECT',
    'AS', 'DISTINCT', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'IN', 'LIKE', 'ILIKE', 'IS', 'NOT', 'NULL', 'EXISTS',
    'BETWEEN', 'TRUE', 'FALSE', 'ASC', 'DESC',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF',
    'CAST', 'CONVERT', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
    'INDEX', 'UNIQUE', 'CHECK', 'DEFAULT', 'CONSTRAINT',
    'IF', 'BEGIN', 'COMMIT', 'ROLLBACK', 'RETURNING',
    'WITH', 'RECURSIVE', 'TABLE', 'TEMP', 'TEMPORARY', 'REPLACE', 'INTO'
  ],

  formatSql() {
    const input = document.getElementById('sql-input').value;
    if (!input.trim()) return showToast('请先输入 SQL');

    const majorClauses = ['SELECT','FROM','WHERE','GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','DELETE','CREATE TABLE','ALTER TABLE','DROP TABLE','UNION ALL','UNION'];
    const joinClauses = ['LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','LEFT OUTER JOIN','RIGHT OUTER JOIN','FULL OUTER JOIN','CROSS JOIN','JOIN','ON','USING'];

    let s = input.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\n/g,' ').replace(/\s+/g,' ').trim();

    majorClauses.forEach(kw => {
      const re = new RegExp('\\b' + kw.replace(/ /g,'\\s+') + '\\b','gi');
      s = s.replace(re, '\n' + kw);
    });
    joinClauses.forEach(kw => {
      const re = new RegExp('\\b' + kw.replace(/ /g,'\\s+') + '\\b','gi');
      s = s.replace(re, '\n  ' + kw);
    });
    s = s.replace(/\b(AND|OR)\b/gi, '\n  $1');

    /* 关键字大写 */
    this._sqlKeywords.sort((a,b) => b.length - a.length).forEach(kw => {
      const re = new RegExp('\\b' + kw.replace(/ /g,'\\s+') + '\\b','gi');
      s = s.replace(re, kw);
    });
    s = s.replace(/\n\s*\n/g, '\n').trim();
    document.getElementById('sql-output').value = s;
  },

  minifySql() {
    const input = document.getElementById('sql-input').value;
    if (!input.trim()) return showToast('请先输入 SQL');
    document.getElementById('sql-output').value = input
      .replace(/--.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'')
      .replace(/\s+/g,' ').replace(/\s*([(),;])\s*/g,'$1').trim();
  },

  copySqlOutput() {
    const val = document.getElementById('sql-output').value;
    if (!val) return showToast('没有内容可复制');
    navigator.clipboard.writeText(val).then(() => showToast('已复制'));
  },

  /* =================================================================
   * MERMAID — 通过文本生成图表（流程图/时序图等）
   * ================================================================= */
  renderMermaid() {
    document.getElementById('panel-mermaid').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">📝 Mermaid 语法</div>
          <div class="card-body">
            <textarea id="mermaid-input" class="large" placeholder="输入 Mermaid 语法&#10;示例:&#10;graph TD;&#10;  A[开始] --> B[结束];" style="min-height:300px;font-family:monospace;font-size:0.8125rem"></textarea>
            <div class="btn-group mt-2">
              <button class="btn btn-primary" onclick="AdvTools.renderMermaidDiagram()">🎨 渲染图表</button>
              <button class="btn" onclick="AdvTools.copyMermaidCode()">📋 复制代码</button>
              <button class="btn" onclick="AdvTools.exportMermaidSvg()">💾 导出 SVG</button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">👁️ 预览</div>
          <div class="card-body" id="mermaid-preview" style="min-height:300px;display:flex;align-items:center;justify-content:center;overflow:auto">
            <div class="empty-state">输入语法后点击"渲染图表"</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">📖 常用语法速查</div>
        <div class="card-body" style="font-size:0.75rem">
          <div class="grid-3">
            <div><b>流程图 graph</b><br><code>graph TD;<br>A[开始]-->B[结束];</code></div>
            <div><b>时序图 sequenceDiagram</b><br><code>sequenceDiagram<br>A->>B: 消息<br>B-->>A: 回复</code></div>
            <div><b>类图 classDiagram</b><br><code>classDiagram<br>class Animal<br>Animal : +run()</code></div>
          </div>
        </div>
      </div>`;
  },

  renderMermaidDiagram() {
    const text = document.getElementById('mermaid-input').value.trim();
    if (!text) return showToast('请输入 Mermaid 语法');
    const container = document.getElementById('mermaid-preview');
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ 渲染中...</div>';
    if (typeof mermaid === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
      script.onload = () => { mermaid.initialize({startOnLoad:false,theme:'default',securityLevel:'loose'}); this._doMermaidRender(text); };
      script.onerror = () => { container.innerHTML = '<div class="empty-state">加载 Mermaid 库失败<br>可复制代码到 <a href="https://mermaid.live" target="_blank">mermaid.live</a> 渲染</div>'; };
      document.head.appendChild(script);
    } else {
      this._doMermaidRender(text);
    }
  },

  async _doMermaidRender(text) {
    const id = 'md-' + Date.now();
    const container = document.getElementById('mermaid-preview');
    try {
      const {svg} = await mermaid.render(id, text);
      container.innerHTML = svg;
      const svgEl = container.querySelector('svg');
      if (svgEl) svgEl.style.maxWidth = '100%';
    } catch(e) {
      container.innerHTML = '<div class="empty-state">渲染失败: ' + e.message.replace(/</g,'&lt;') + '</div>';
    }
  },

  copyMermaidCode() {
    const val = document.getElementById('mermaid-input').value;
    if (!val.trim()) return showToast('没有内容可复制');
    navigator.clipboard.writeText(val).then(() => showToast('已复制'));
  },

  exportMermaidSvg() {
    const svg = document.querySelector('#mermaid-preview svg');
    if (!svg) return showToast('请先渲染图表');
    const str = new XMLSerializer().serializeToString(svg.cloneNode(true));
    const url = URL.createObjectURL(new Blob([str], {type:'image/svg+xml'}));
    const a = document.createElement('a'); a.href = url; a.download = 'diagram.svg'; a.click();
    URL.revokeObjectURL(url);
  },

  /* =================================================================
   * CRON PARSER — Cron表达式解析/可读描述/下次执行时间
   * ================================================================= */
  renderCronParser() {
    document.getElementById('panel-cron').innerHTML = `
      <div class="card">
        <div class="card-header">⏰ Cron 表达式解析</div>
        <div class="card-body">
          <div class="form-row">
            <input type="text" id="cron-input" value="*/5 * * * *" placeholder="输入 cron 表达式（5 或 6 字段）" style="width:100%;font-family:monospace;font-size:1rem;text-align:center" onkeydown="if(event.key==='Enter')AdvTools.parseCronExp()">
            <button class="btn btn-primary" onclick="AdvTools.parseCronExp()">🔍 解析</button>
          </div>
          <div class="status-bar" id="cron-presets">
            预设:
            <a href="#" onclick="AdvTools.setCron('*/5 * * * *');return false">每5分钟</a> ·
            <a href="#" onclick="AdvTools.setCron('0 * * * *');return false">每小时</a> ·
            <a href="#" onclick="AdvTools.setCron('0 9 * * *');return false">每天9:00</a> ·
            <a href="#" onclick="AdvTools.setCron('0 9 * * 1-5');return false">工作日9:00</a> ·
            <a href="#" onclick="AdvTools.setCron('0 0 1 * *');return false">每月1号</a>
          </div>
        </div>
      </div>
      <div class="card" id="cron-result-card" style="display:none">
        <div class="card-header">📋 解析结果</div>
        <div class="card-body" id="cron-result"></div>
      </div>`;
  },

  setCron(val) { document.getElementById('cron-input').value = val; this.parseCronExp(); },

  parseCronExp() {
    const expr = document.getElementById('cron-input').value.trim();
    if (!expr) return showToast('请输入 cron 表达式');
    const parts = expr.split(/\s+/);
    if (parts.length !==5 && parts.length !==6) return showToast('需要 5 或 6 个字段');

    const fieldNames = ['分','时','日','月','周'];
    const fieldRanges = [[0,59],[0,23],[1,31],[1,12],[0,7]];
    const monthNames = ['','1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const dayNames = ['周日','周一','周二','周三','周四','周五','周六','周日'];

    const p = parts.length === 6 ? parts.slice(1) : parts;
    let html = '<table style="width:100%"><tr><th>字段</th><th>值</th><th>说明</th></tr>';
    let errors = [];
    for (let i=0; i<5; i++) {
      const desc = this._describeCronField(p[i], fieldRanges[i][0], fieldRanges[i][1], fieldNames[i]);
      if (desc.error) errors.push(fieldNames[i] + ': ' + desc.error);
      html += '<tr><td style="font-weight:600;width:60px">'+fieldNames[i]+'</td><td style="font-family:monospace;width:120px">'+p[i]+'</td><td>'+desc.text+'</td></tr>';
    }
    html += '</table>';
    if (errors.length) html += '<div style="color:var(--red);margin-top:8px">⚠️ '+errors.join('; ')+'</div>';
    html += '<div style="margin-top:16px;padding:12px;background:var(--accent-bg);border-radius:8px;font-weight:500">'+this._describeCronFull(p)+'</div>';
    html += '<div style="margin-top:16px"><b>⏱️ 未来 5 次执行时间:</b></div>';
    this._getNextCronTimes(p).forEach((t,i) => {
      html += '<div style="font-family:monospace;font-size:0.8125rem;padding:2px 0">'+(i+1)+'. '+t.toLocaleString()+'</div>';
    });
    document.getElementById('cron-result-card').style.display = 'block';
    document.getElementById('cron-result').innerHTML = html;
  },

  _describeCronField(val, min, max, name) {
    const mn = ['','1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const dn = ['周日','周一','周二','周三','周四','周五','周六','周日'];
    if (val === '*') return {text: '每' + ({分:'分钟',时:'小时',日:'天',月:'月',周:'周'}[name]||name)};
    try {
      if (val.includes(',')) return {text: '第 ' + val + ' ' + name};
      if (val.includes('/')) return {text: '每 ' + val.split('/')[1] + ' ' + ({分:'分钟',时:'小时',日:'天',月:'月',周:'周'}[name]||name)};
      if (val.includes('-')) {
        const [a,b] = val.split('-');
        return {text: '从 ' + a + ' 到 ' + b + ' ' + name};
      }
      const n = parseInt(val);
      if (isNaN(n) || n<min || n>max) return {error: '超出范围 '+min+'-'+max};
      if (name==='月') return {text: mn[n]||val};
      if (name==='周') return {text: dn[n]||val};
      return {text: '第 '+n+' '+name};
    } catch(e) { return {error: '格式无效'}; }
  },

  _describeCronFull(p) {
    const [m,h,day,mon,dow] = p;
    if (m==='*' && h==='*') return '每分钟执行';
    if (m==='*') return '每小时的第 '+h+' 点每分钟执行';
    if (day==='*' && mon==='*' && dow==='*') return '每天 ' + h.padStart(2,'0') + ':' + m.padStart(2,'0') + ' 执行';
    if (dow==='*' && mon==='*') return '每月第 ' + day + ' 天 ' + h.padStart(2,'0') + ':' + m.padStart(2,'0') + ' 执行';
    if (day==='*' && mon==='*') return '每 ' + this._cronDowDesc(dow) + ' ' + h.padStart(2,'0') + ':' + m.padStart(2,'0') + ' 执行';
    return m+' '+h+' '+day+' '+mon+' '+dow;
  },

  _cronDowDesc(val) {
    const names = ['周日','周一','周二','周三','周四','周五','周六','周日'];
    if (val==='*') return '';
    if (val.includes(',')) return val.split(',').map(v=>names[parseInt(v)]).join(',');
    if (val.includes('-')) {
      const [a,b] = val.split('-').map(Number);
      return names[a]+'-'+names[b];
    }
    return names[parseInt(val)]||val;
  },

  _getNextCronTimes(p) {
    const times = [];
    let check = new Date(); check.setSeconds(0,0);
    let maxIt = 525600, it = 0;
    while (times.length < 5 && it < maxIt) {
      it++;
      if (this._matchCron(p, check)) times.push(new Date(check));
      check = new Date(check.getTime() + 60000);
    }
    return times;
  },

  _matchCron(p, date) {
    return this._cronMatch(p[0], date.getMinutes(), 0, 59)
      && this._cronMatch(p[1], date.getHours(), 0, 23)
      && this._cronMatch(p[2], date.getDate(), 1, 31)
      && this._cronMatch(p[3], date.getMonth()+1, 1, 12)
      && this._cronMatch(p[4], date.getDay(), 0, 7);
  },

  _cronMatch(pat, val) {
    if (pat === '*') return true;
    if (pat.includes(',')) return pat.split(',').some(p => this._cronMatch(p.trim(), val));
    if (pat.includes('/')) {
      const [r, step] = pat.split('/');
      const sn = parseInt(step);
      if (r === '*') return val % sn === 0;
      const [rMin, rMax] = r.includes('-') ? r.split('-').map(Number) : [parseInt(r), 59];
      return val >= rMin && val <= rMax && (val - rMin) % sn === 0;
    }
    if (pat.includes('-')) {
      const [a,b] = pat.split('-').map(Number);
      return val >= a && val <= b;
    }
    return parseInt(pat) === val;
  },

  /* =================================================================
   * XML FORMATTER — XML格式化/压缩/校验
   * ================================================================= */
  renderXmlFormatter() {
    document.getElementById('panel-xml-formatter').innerHTML = `
      <div class="card">
        <div class="card-header">📄 XML 格式化</div>
        <div class="card-body">
          <textarea id="xml-input" class="large" placeholder="粘贴 XML..." style="min-height:200px;font-family:monospace"></textarea>
          <div class="btn-group mt-2">
            <button class="btn btn-primary" onclick="AdvTools.formatXml()">✨ 格式化</button>
            <button class="btn" onclick="AdvTools.minifyXml()">📦 压缩</button>
            <button class="btn" onclick="AdvTools.validateXml()">✅ 验证</button>
            <button class="btn" onclick="document.getElementById('xml-input').value=''">🗑️ 清空</button>
          </div>
        </div>
        <div class="card-body">
          <label class="text-xs text-muted">输出</label>
          <textarea id="xml-output" class="large" readonly style="min-height:200px;font-family:monospace"></textarea>
          <div class="status-bar" id="xml-status"></div>
          <div class="btn-group mt-2">
            <button class="btn btn-sm" onclick="AdvTools.copyXmlOutput()">📋 复制结果</button>
          </div>
        </div>
      </div>`;
  },

  formatXml() {
    const xml = document.getElementById('xml-input').value.trim();
    if (!xml) return showToast('请先输入 XML');
    try {
      const dom = new DOMParser().parseFromString(xml, 'text/xml');
      const errs = dom.querySelectorAll('parsererror');
      if (errs.length) {
        document.getElementById('xml-status').textContent = '⚠️ ' + errs[0].textContent.replace(/</g,'&lt;');
        return;
      }
      const str = new XMLSerializer().serializeToString(dom);
      document.getElementById('xml-output').value = this._prettyPrintXml(str);
      document.getElementById('xml-status').textContent = '✅ XML 有效';
    } catch(e) {
      document.getElementById('xml-status').textContent = '⚠️ ' + e.message;
    }
  },

  _prettyPrintXml(xml) {
    let out = '', indent = '', tab = '  ';
    const tokens = xml.replace(/>\s*</g, '>\n<').split('\n');
    for (let t of tokens) {
      t = t.trim(); if (!t) continue;
      if (t.match(/^<\//)) { indent = indent.slice(tab.length); out += indent + t + '\n'; }
      else if (t.match(/^<\?xml/) || t.match(/^<!--/) || t.match(/^<!\[CDATA\[/)) { out += indent + t + '\n'; }
      else if (t.match(/^</)) { out += indent + t + '\n'; if (!t.match(/\/>$/)) indent += tab; }
      else { out += indent + t + '\n'; }
    }
    return out.trim();
  },

  minifyXml() {
    const xml = document.getElementById('xml-input').value.trim();
    if (!xml) return showToast('请先输入 XML');
    document.getElementById('xml-output').value = xml.replace(/>\s+</g,'><').replace(/\s+/g,' ').trim();
    document.getElementById('xml-status').textContent = '';
  },

  validateXml() {
    const xml = document.getElementById('xml-input').value.trim();
    if (!xml) return showToast('请先输入 XML');
    const errs = new DOMParser().parseFromString(xml, 'text/xml').querySelectorAll('parsererror');
    document.getElementById('xml-status').textContent = errs.length ? '⚠️ ' + errs[0].textContent.replace(/</g,'&lt;') : '✅ XML 有效';
  },

  copyXmlOutput() {
    const val = document.getElementById('xml-output').value;
    if (!val) return showToast('没有内容可复制');
    navigator.clipboard.writeText(val).then(() => showToast('已复制'));
  },

  /* =================================================================
   * UA PARSER — User-Agent解析/浏览器/OS/设备
   * ================================================================= */
  renderUaParser() {
    document.getElementById('panel-ua-parser').innerHTML = `
      <div class="card">
        <div class="card-header">🌐 User-Agent 解析</div>
        <div class="card-body">
          <div class="form-row">
            <input type="text" id="ua-input" placeholder="粘贴 User-Agent 字符串..." style="width:100%;font-family:monospace;font-size:0.8125rem">
            <button class="btn btn-primary" onclick="AdvTools.parseUa()">🔍 解析</button>
          </div>
          <div class="btn-group mt-2" style="flex-wrap:wrap">
            <span class="text-xs text-muted">预设:</span>
            <button class="btn btn-xs" onclick="AdvTools.setUa('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')">Chrome Win</button>
            <button class="btn btn-xs" onclick="AdvTools.setUa('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15')">Safari Mac</button>
            <button class="btn btn-xs" onclick="AdvTools.setUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')">Safari iOS</button>
            <button class="btn btn-xs" onclick="AdvTools.setUa('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36')">Chrome Android</button>
            <button class="btn btn-xs" onclick="AdvTools.setUa('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0')">Firefox Win</button>
          </div>
        </div>
      </div>
      <div class="card" id="ua-result-card" style="display:none">
        <div class="card-header">📊 解析结果</div>
        <div class="card-body" id="ua-result"></div>
      </div>`;
  },

  setUa(val) { document.getElementById('ua-input').value = val; this.parseUa(); },

  parseUa() {
    const ua = document.getElementById('ua-input').value.trim();
    if (!ua) return showToast('请输入 User-Agent');
    const r = this._analyzeUa(ua);
    let html = '<div style="font-family:monospace;font-size:0.75rem;word-break:break-all;margin-bottom:16px;padding:8px;background:var(--bg);border-radius:4px">' + ua.replace(/</g,'&lt;') + '</div>';
    [['🌐 浏览器', r.browser + ' ' + r.version], ['💻 操作系统', r.os + (r.osVersion?' '+r.osVersion:'')], ['📱 设备类型', r.device], ['⚙️ 渲染引擎', r.engine]].forEach(f => {
      html += '<div style="display:flex;padding:8px 0;border-bottom:1px solid var(--border)"><span style="width:120px;font-weight:600;color:var(--text-muted)">'+f[0]+'</span><span>'+(f[1]||'-')+'</span></div>';
    });
    document.getElementById('ua-result-card').style.display = 'block';
    document.getElementById('ua-result').innerHTML = html;
  },

  _analyzeUa(ua) {
    const r = {browser:'未知', version:'', os:'未知', osVersion:'', device:'桌面', engine:''};
    if (ua.includes('AppleWebKit')) r.engine = 'WebKit';
    if (ua.includes('Gecko/') && !ua.includes('WebKit')) r.engine = 'Gecko';
    if (ua.includes('Trident/')||ua.includes('MSIE')) r.engine = 'Trident';
    if (ua.includes('Chrome/')&&!ua.includes('Edg/')&&!ua.includes('OPR/')) r.engine = 'Blink';
    if (ua.includes('Firefox/')) { r.browser='Firefox'; const m=ua.match(/Firefox\/([\d.]+)/); if(m) r.version=m[1]; }
    else if (ua.includes('Edg/')) { r.browser='Edge'; const m=ua.match(/Edg\/([\d.]+)/); if(m) r.version=m[1]; }
    else if (ua.includes('OPR/')||ua.includes('Opera/')) { r.browser='Opera'; const m=ua.match(/(?:OPR|Opera)\/([\d.]+)/); if(m) r.version=m[1]; }
    else if (ua.includes('Chrome/')) { r.browser='Chrome'; const m=ua.match(/Chrome\/([\d.]+)/); if(m) r.version=m[1]; }
    else if (ua.includes('Safari/')) { r.browser='Safari'; const m=ua.match(/Version\/([\d.]+)/); if(m) r.version=m[1]; }
    else if (ua.includes('Trident/')||ua.includes('MSIE')) { r.browser='Internet Explorer'; const m=ua.match(/(?:MSIE |rv:)([\d.]+)/); if(m) r.version=m[1]; }
    if (ua.includes('Windows NT')) { r.os='Windows'; const m=ua.match(/Windows NT ([\d.]+)/); if(m) r.osVersion=({6.0:'Vista',6.1:'7',6.2:'8',6.3:'8.1','10.0':'10','11.0':'11'})[m[1]]||m[1]; }
    else if (ua.includes('Mac OS X')) { r.os='macOS'; const m=ua.match(/Mac OS X ([\d_]+)/); if(m) r.osVersion=m[1].replace(/_/g,'.'); }
    else if (ua.includes('Android')) { r.os='Android'; const m=ua.match(/Android ([\d.]+)/); if(m) r.osVersion=m[1]; }
    else if (ua.includes('Linux')) r.os='Linux';
    else if (ua.includes('CrOS')) r.os='ChromeOS';
    if (ua.includes('iPhone')) r.device='📱 iPhone';
    else if (ua.includes('iPad')) r.device='📱 iPad';
    else if (ua.includes('iPod')) r.device='📱 iPod';
    else if (ua.includes('Android')&&ua.includes('Mobile')) r.device='📱 手机';
    else if (ua.includes('Android')) r.device='📱 平板';
    else if (ua.includes('Mobi')) r.device='📱 手机';
    return r;
  },

  /* =================================================================
   * ASCII TABLE — 分隔符文本转美观的ASCII表格
   * ================================================================= */
  renderAsciiTable() {
    document.getElementById('panel-ascii-table').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">📊 ASCII 表格生成</div>
          <div class="card-body">
            <textarea id="ascii-table-input" class="large" placeholder="输入表格数据...&#10;&#10;Name\\tAge\\tCity&#10;Alice\\t30\\tBeijing&#10;Bob\\t25\\tShanghai" style="min-height:200px;font-family:monospace;font-size:0.8125rem"></textarea>
            <div class="form-row mt-2">
              <label>分隔符</label>
              <select id="ascii-table-delimiter">
                <option value="tab">Tab</option>
                <option value="comma">逗号 (,)</option>
                <option value="pipe">竖线 (|)</option>
                <option value="space">空格 (多空格)</option>
                <option value="semicolon">分号 (;)</option>
              </select>
              <label><input type="checkbox" id="ascii-table-header" checked> 首行为标题</label>
              <label>对齐</label>
              <select id="ascii-table-align">
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            <div class="btn-group mt-2">
              <button class="btn btn-primary" onclick="AdvTools.generateAsciiTable()">✨ 生成表格</button>
              <button class="btn" onclick="AdvTools.copyAsciiTable()">📋 复制</button>
              <button class="btn" onclick="AdvTools.clearAsciiTable()">🗑️ 清空</button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">👁️ 预览</div>
          <div class="card-body">
            <textarea id="ascii-table-output" class="large" readonly style="min-height:300px;font-family:monospace;font-size:0.8125rem"></textarea>
          </div>
        </div>
      </div>`;
  },

  generateAsciiTable() {
    const input = document.getElementById('ascii-table-input').value;
    if (!input.trim()) return showToast('请输入数据');
    const delimMap = {tab:'\t', comma:',', pipe:'|', space:/\s+/, semicolon:';'};
    const delimType = document.getElementById('ascii-table-delimiter').value;
    const delim = delimMap[delimType];
    const hasHeader = document.getElementById('ascii-table-header').checked;
    const align = document.getElementById('ascii-table-align').value;
    const lines = input.split('\n').filter(l=>l.trim());
    if (!lines.length) return showToast('没有有效数据');
    const rows = lines.map(line => { const c = delimType==='space' ? line.trim().split(/\s+/) : line.split(delim).map(s=>s.trim()); return c; });
    const nc = Math.max(...rows.map(r=>r.length));
    const nr = rows.map(r => { while(r.length<nc) r.push(''); return r; });
    const cw = Array(nc).fill(0);
    nr.forEach(r => r.forEach((c,i) => { cw[i] = Math.max(cw[i], String(c).length); }));
    const pad = (s,w) => { s=String(s); if(align==='left') return s.padEnd(w); if(align==='right') return s.padStart(w); const l=Math.floor((w-s.length)/2); return ' '.repeat(l)+s+' '.repeat(w-s.length-l); };
    const hl = '+' + cw.map(w => '-'.repeat(w+2)).join('+') + '+';
    let out = hl + '\n';
    if (hasHeader && nr.length) {
      out += '|' + nr[0].map((c,i)=>' '+pad(c,cw[i])+' ').join('|') + '|\n' + hl + '\n';
      nr.slice(1).forEach(r => { out += '|' + r.map((c,i)=>' '+pad(c,cw[i])+' ').join('|') + '|\n'; });
    } else {
      nr.forEach(r => { out += '|' + r.map((c,i)=>' '+pad(c,cw[i])+' ').join('|') + '|\n'; });
    }
    out += hl;
    document.getElementById('ascii-table-output').value = out;
  },

  copyAsciiTable() {
    const val = document.getElementById('ascii-table-output').value;
    if (!val) return showToast('没有内容可复制');
    navigator.clipboard.writeText(val).then(() => showToast('已复制'));
  },

  clearAsciiTable() {
    document.getElementById('ascii-table-input').value = '';
    document.getElementById('ascii-table-output').value = '';
  },

  /* =================================================================
   * DATE FORMAT — 日期时间格式转换/时间戳/ISO/RFC/自定义模板
   * ================================================================= */
  renderDateFormat() {
    document.getElementById('panel-date-format').innerHTML = `
      <div class="card">
        <div class="card-header">⏱️ 日期时间格式转换</div>
        <div class="card-body">
          <div class="form-row">
            <input type="text" id="df-input" placeholder="输入日期时间字符串或时间戳..." style="width:100%;font-family:monospace;font-size:0.875rem" onkeydown="if(event.key==='Enter')AdvTools.convertDateFormat()">
            <button class="btn btn-primary" onclick="AdvTools.convertDateFormat()">🔄 转换</button>
            <button class="btn" onclick="AdvTools.setDateNow()">📅 现在</button>
          </div>
          <div class="status-bar" id="df-parse-info"></div>
          <div class="btn-group mt-2" style="flex-wrap:wrap">
            <span class="text-xs text-muted">预设:</span>
            <button class="btn btn-xs" onclick="AdvTools.setDateInput('2024-03-15 14:30:00')">yyyy-MM-dd HH:mm:ss</button>
            <button class="btn btn-xs" onclick="AdvTools.setDateInput('2024-03-15T14:30:00.000Z')">ISO 8601</button>
            <button class="btn btn-xs" onclick="AdvTools.setDateInput('1707892200')">时间戳(秒)</button>
            <button class="btn btn-xs" onclick="AdvTools.setDateInput('1707892200000')">时间戳(毫秒)</button>
            <button class="btn btn-xs" onclick="AdvTools.setDateInput('03/15/2024')">MM/dd/yyyy</button>
          </div>
        </div>
      </div>
      <div class="card" id="df-result-card" style="display:none">
        <div class="card-header">📋 转换结果</div>
        <div class="card-body" id="df-result"></div>
      </div>
      <div class="card">
        <div class="card-header">✏️ 自定义格式</div>
        <div class="card-body">
          <div class="form-row">
            <input type="text" id="df-custom-format" value="yyyy-MM-dd HH:mm:ss" placeholder="格式模板..." style="width:100%;font-family:monospace">
            <button class="btn btn-primary" onclick="AdvTools.applyCustomFormat()">应用</button>
            <button class="btn" onclick="AdvTools.copyCustomResult()">📋 复制</button>
          </div>
          <div class="status-bar" id="df-custom-result"></div>
          <details style="margin-top:8px">
            <summary class="text-xs text-muted" style="cursor:pointer">格式说明</summary>
            <div style="font-size:0.75rem;margin-top:4px;line-height:1.8">
              yyyy=四位年 yy=两位年 M=月(无补零) MM=月(补零) d=日(无补零) dd=日(补零)<br>
              H=24时(无补零) HH=24时(补零) h=12时(无补零) hh=12时(补零)<br>
              m=分(无补零) mm=分(补零) s=秒(无补零) ss=秒(补零) SSS=毫秒<br>
              Z=时区(+0800) ZZ=时区(+08:00) A=AM/PM T=字母T<br>
              用单引号包裹原样输出: yyyy'年'MM'月'dd'日' → 2024年03月15日
            </div>
          </details>
        </div>
      </div>`;
  },

  setDateInput(val) {
    document.getElementById('df-input').value = val;
    this.convertDateFormat();
  },

  setDateNow() {
    const now = new Date();
    const p = n => String(n).padStart(2,'0');
    document.getElementById('df-input').value = now.getFullYear()+'-'+p(now.getMonth()+1)+'-'+p(now.getDate())+' '+p(now.getHours())+':'+p(now.getMinutes())+':'+p(now.getSeconds());
    this.convertDateFormat();
  },

  _parseDateInput(str) {
    str = str.trim();
    if (!str) return null;
    if (str === 'now') return new Date();
    if (/^\d{10}$/.test(str)) return new Date(parseInt(str)*1000);
    if (/^\d{13}$/.test(str)) return new Date(parseInt(str));

    const fmts = [
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/,
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/,
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/,
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{4})-(\d{2})-(\d{2})$/,
      /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{4})\/(\d{2})\/(\d{2})$/,
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      /^(\d{4})年(\d{1,2})月(\d{1,2})日/,
    ];

    for (const re of fmts) {
      const m = str.match(re);
      if (m) {
        const [_, y, mo, d, h=0, mi=0, s=0, ms=0] = m;
        return new Date(+y, +mo-1, +d, +h, +mi, +s, +ms);
      }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    return null;
  },

  _detectFormat(str) {
    str = str.trim();
    if (/^\d{10}$/.test(str)) return '10位时间戳（秒）';
    if (/^\d{13}$/.test(str)) return '13位时间戳（毫秒）';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(str)) return 'ISO 8601（UTC，带毫秒）';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(str)) return 'ISO 8601（UTC）';
    if (/T\d{2}:\d{2}:\d{2}/.test(str)) return 'ISO 8601';
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) return 'yyyy-MM-dd HH:mm:ss';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return 'yyyy-MM-dd';
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) return 'yyyy/MM/dd';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return 'MM/dd/yyyy';
    if (/年/.test(str)) return '中文日期格式';
    return '自动匹配';
  },

  _formatDate(date, fmt) {
    const p2 = n => String(n).padStart(2,'0');
    const p3 = n => String(n).padStart(3,'0');
    const y = date.getFullYear();
    const M = date.getMonth()+1, d = date.getDate();
    const H = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
    const S = date.getMilliseconds(), h = H%12||12, A = H<12?'AM':'PM';
    const tz = -date.getTimezoneOffset();
    const tzH = Math.floor(Math.abs(tz)/60), tzM = Math.abs(tz)%60;
    const tzS = (tz>=0?'+':'-')+p2(tzH)+p2(tzM);
    const tzC = (tz>=0?'+':'-')+p2(tzH)+':'+p2(tzM);

    /* 标记 quote 段 */
    const segs = [];
    let buf = '', inQ = false;
    for (let i=0; i<fmt.length; i++) {
      const ch = fmt[i];
      if (ch === "'") { segs.push(inQ?{q:buf}:buf); inQ=!inQ; buf=''; continue; }
      buf += ch;
    }
    if (buf) segs.push(inQ?{q:buf}:buf);

    return segs.map(seg => {
      if (typeof seg === 'object') return seg.q; /* quoted literal */
      let out = '', i = 0;
      while (i < seg.length) {
        const ch = seg[i];
        let j = i+1; while (j < seg.length && seg[j] === ch) j++;
        const cnt = j-i;
        const rep = (() => {
          switch(ch) {
            case 'y': return cnt>=3?String(y):String(y).slice(-2);
            case 'M': return cnt>=2?p2(M):String(M);
            case 'd': return cnt>=2?p2(d):String(d);
            case 'H': return cnt>=2?p2(H):String(H);
            case 'h': return cnt>=2?p2(h):String(h);
            case 'm': return cnt>=2?p2(m):String(m);
            case 's': return cnt>=2?p2(s):String(s);
            case 'S': return p3(S).slice(0,Math.min(cnt,3));
            case 'Z': return cnt>=2?tzC:tzS;
            case 'A': return A;
            case 'T': return 'T';
            default: return ch.repeat(cnt);
          }
        })();
        out += rep;
        i = j;
      }
      return out;
    }).join('');
  },

  convertDateFormat() {
    const input = document.getElementById('df-input').value.trim();
    if (!input) return showToast('请输入日期时间');
    const date = this._parseDateInput(input);
    if (!date || isNaN(date.getTime())) return showToast('无法解析，请检查格式');

    const p2 = n => String(n).padStart(2,'0');
    const p3 = n => String(n).padStart(3,'0');
    const y = date.getFullYear(), M = p2(date.getMonth()+1), d = p2(date.getDate());
    const H = p2(date.getHours()), m = p2(date.getMinutes()), s = p2(date.getSeconds()), S = p3(date.getMilliseconds());
    const tz = -date.getTimezoneOffset();
    const tzH = p2(Math.floor(Math.abs(tz)/60)), tzM = p2(Math.abs(tz)%60);
    const tzS = (tz>=0?'+':'-')+tzH+tzM;
    const tzC = (tz>=0?'+':'-')+tzH+':'+tzM;

    const convs = [
      ['10 位时间戳（秒）', String(Math.floor(date.getTime()/1000))],
      ['13 位时间戳（毫秒）', String(date.getTime())],
      ['ISO 8601', `${y}-${M}-${d}T${H}:${m}:${s}.${S}${tzC}`],
      ['ISO 8601 (UTC)', `${y}-${M}-${d}T${H}:${m}:${s}.${S}Z`],
      ['yyyy-MM-dd HH:mm:ss', `${y}-${M}-${d} ${H}:${m}:${s}`],
      ['yyyy-MM-dd', `${y}-${M}-${d}`],
      ['yyyy/MM/dd', `${y}/${M}/${d}`],
      ['MM/dd/yyyy', `${M}/${d}/${y}`],
      ['dd/MM/yyyy', `${d}/${M}/${y}`],
      ['yyyy年MM月dd日 HH:mm:ss', `${y}年${M}月${d}日 ${H}:${m}:${s}`],
      ['RFC 2822', date.toUTCString()],
      ['本地日期字符串', date.toLocaleDateString()],
      ['本地时间字符串', date.toLocaleTimeString()],
    ];

    const fmt = this._detectFormat(input);
    let html = `<div class="status-bar" style="margin-bottom:12px">📌 识别格式: <strong>${fmt}</strong> | ${y}-${M}-${d} ${H}:${m}:${s}</div>`;
    html += '<div class="table-wrap"><table><tr><th>格式</th><th>结果</th><th></th></tr>';
    convs.forEach(([name, val]) => {
      const esc = val.replace(/'/g,"\\'");
      html += `<tr><td style="font-weight:500;color:var(--text-secondary);white-space:nowrap">${name}</td><td style="font-family:monospace;word-break:break-all">${val}</td>
        <td><button class="btn btn-xs" onclick="AdvTools.copyValue('${esc}')">📋</button></td></tr>`;
    });
    html += '</table></div>';
    document.getElementById('df-result-card').style.display = 'block';
    document.getElementById('df-result').innerHTML = html;

    const cf = document.getElementById('df-custom-format').value;
    if (cf) document.getElementById('df-custom-result').textContent = this._formatDate(date, cf);
  },

  applyCustomFormat() {
    const input = document.getElementById('df-input').value.trim();
    const fmt = document.getElementById('df-custom-format').value.trim();
    if (!input) return showToast('请先输入日期时间');
    if (!fmt) return showToast('请输入格式模板');
    const date = this._parseDateInput(input);
    if (!date) return showToast('无法解析日期时间');
    document.getElementById('df-custom-result').textContent = this._formatDate(date, fmt);
  },

  copyCustomResult() {
    const el = document.getElementById('df-custom-result');
    if (!el || !el.textContent) return showToast('没有内容可复制');
    navigator.clipboard.writeText(el.textContent).then(() => showToast('已复制'));
  },

  copyValue(val) {
    navigator.clipboard.writeText(val).then(() => showToast('已复制'));
  },

  /* =================================================================
   * HTTP STATUS CODES — HTTP状态码速查
   * ================================================================= */
  renderHttpCodes() {
    const codes = [
      [100,'Continue','继续','信息'], [101,'Switching Protocols','切换协议','信息'],
      [200,'OK','成功','成功'], [201,'Created','已创建','成功'], [204,'No Content','无内容','成功'],
      [301,'Moved Permanently','永久重定向','重定向'], [302,'Found','临时重定向','重定向'],
      [304,'Not Modified','未修改','重定向'],
      [400,'Bad Request','错误请求','客户端错误'], [401,'Unauthorized','未授权','客户端错误'],
      [403,'Forbidden','禁止访问','客户端错误'], [404,'Not Found','未找到','客户端错误'],
      [405,'Method Not Allowed','方法不允许','客户端错误'], [408,'Request Timeout','请求超时','客户端错误'],
      [409,'Conflict','冲突','客户端错误'], [413,'Payload Too Large','请求体过大','客户端错误'],
      [422,'Unprocessable Entity','无法处理的实体','客户端错误'], [429,'Too Many Requests','请求过多','客户端错误'],
      [500,'Internal Server Error','服务器内部错误','服务端错误'], [501,'Not Implemented','未实现','服务端错误'],
      [502,'Bad Gateway','网关错误','服务端错误'], [503,'Service Unavailable','服务不可用','服务端错误'],
      [504,'Gateway Timeout','网关超时','服务端错误'],
    ];
    document.getElementById('panel-http-codes').innerHTML = `
      <div class="card">
        <div class="card-header">🌐 HTTP 状态码速查</div>
        <div class="card-body">
          <input type="text" id="http-codes-filter" placeholder="搜索状态码或关键词（如 404、Not Found、未找到）..." style="width:100%" oninput="AdvTools._filterHttpCodes()">
          <div class="table-wrap mt-2"><table id="http-codes-table">
            <tr><th>状态码</th><th>英文名</th><th>中文说明</th><th>分类</th></tr>
            ${codes.map(([code,en,cn,cat]) =>
              `<tr class="http-row"><td style="font-family:monospace;font-weight:700">${code}</td><td>${en}</td><td>${cn}</td><td><span class="badge" style="background:${cat==='成功'?'var(--green-bg)':cat==='客户端错误'?'var(--red-bg)':cat==='服务端错误'?'var(--red-bg)':cat==='重定向'?'var(--blue-bg)':'var(--bg)'};color:${cat==='成功'?'var(--green)':cat==='客户端错误'?'var(--red)':cat==='服务端错误'?'var(--red)':cat==='重定向'?'var(--blue)':'var(--text-muted)'}">${cat}</span></td></tr>`
            ).join('')}
          </table></div>
        </div>
      </div>`;
  },

  _filterHttpCodes() {
    const q = document.getElementById('http-codes-filter').value.trim().toLowerCase();
    document.querySelectorAll('#http-codes-table .http-row').forEach(row => {
      row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  /* =================================================================
   * ASCII CODES — ASCII 0~127完整对照表
   * ================================================================= */
  renderAsciiCodes() {
    const rows = [];
    for (let i=0; i<128; i++) {
      const ch = i<32||i===127 ? {0:'NUL',1:'SOH',2:'STX',3:'ETX',4:'EOT',5:'ENQ',6:'ACK',7:'BEL',8:'BS',9:'HT',10:'LF',11:'VT',12:'FF',13:'CR',14:'SO',15:'SI',16:'DLE',17:'DC1',18:'DC2',19:'DC3',20:'DC4',21:'NAK',22:'SYN',23:'ETB',24:'CAN',25:'EM',26:'SUB',27:'ESC',28:'FS',29:'GS',30:'RS',31:'US',127:'DEL'}[i] || '' : String.fromCharCode(i);
      const hex = i.toString(16).toUpperCase().padStart(2,'0');
      const bin = i.toString(2).padStart(8,'0');
      rows.push([i, ch, hex, bin]);
    }
    document.getElementById('panel-ascii-codes').innerHTML = `
      <div class="card">
        <div class="card-header">🔣 ASCII 码对照表</div>
        <div class="card-body">
          <input type="text" id="ascii-codes-filter" placeholder="搜索字符或编码..." style="width:100%" oninput="AdvTools._filterAsciiCodes()">
          <div class="table-wrap mt-2" style="max-height:450px;overflow-y:auto"><table id="ascii-codes-table">
            <tr><th>十进制</th><th>字符</th><th>十六进制</th><th>二进制</th></tr>
            ${rows.map(([dec,ch,hex,bin]) =>
              `<tr class="ascii-row"><td style="font-family:monospace">${dec}</td><td style="font-family:monospace;font-size:1rem;text-align:center">${ch.length>1?'<span class="text-muted text-xs">'+ch+'</span>':ch}</td><td style="font-family:monospace">0x${hex}</td><td style="font-family:monospace;font-size:0.6875rem">${bin}</td></tr>`
            ).join('')}
          </table></div>
        </div>
      </div>`;
  },

  _filterAsciiCodes() {
    const q = document.getElementById('ascii-codes-filter').value.trim().toLowerCase();
    document.querySelectorAll('#ascii-codes-table .ascii-row').forEach(row => {
      row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  /* =================================================================
   * DATA SIZE — 数据大小单位换算
   * ================================================================= */
  renderDataSize() {
    document.getElementById('panel-data-size').innerHTML = `
      <div class="card">
        <div class="card-header">💾 数据大小换算</div>
        <div class="card-body">
          <div class="form-row">
            <input type="number" id="ds-input" value="1" min="0" step="any" style="width:120px;font-family:monospace;font-size:1rem">
            <select id="ds-unit" style="font-family:monospace">
              <option value="B">B (字节)</option><option value="KB">KB (千字节)</option><option value="MB" selected>MB (兆字节)</option>
              <option value="GB">GB (吉字节)</option><option value="TB">TB (太字节)</option><option value="PB">PB (拍字节)</option>
              <option value="EB">EB (艾字节)</option>
              <option value="bit">bit (比特)</option><option value="Kibit">Kibit (千比特)</option>
              <option value="Mibit">Mibit (兆比特)</option><option value="Gibit">Gibit (吉比特)</option>
            </select>
            <span class="text-xs text-muted">1 KB = 1024 B</span>
          </div>
          <button class="btn btn-primary" onclick="AdvTools._convertDataSize()">🔄 换算</button>
          <div class="table-wrap mt-2"><table id="ds-result">
            <tr><th>单位</th><th>值</th><th>单位</th><th>值</th></tr>
          </table></div>
        </div>
      </div>`;
    this._convertDataSize();
  },

  _convertDataSize() {
    const val = parseFloat(document.getElementById('ds-input').value);
    const unit = document.getElementById('ds-unit').value;
    if (isNaN(val) || val<0) return;
    const units = ['B','KB','MB','GB','TB','PB','EB'];
    const bits = ['bit','Kibit','Mibit','Gibit'];
    const baseBytes = unit==='B'?val : unit==='KB'?val*1024 : unit==='MB'?val*1048576 : unit==='GB'?val*1073741824 : unit==='TB'?val*1099511627776 : unit==='PB'?val*1125899906842624 : unit==='EB'?val*1152921504606846976 : unit==='bit'?val/8 : unit==='Kibit'?val*1024/8 : unit==='Mibit'?val*1048576/8 : unit==='Gibit'?val*1073741824/8 : 0;
    let html = '<tr><th>单位</th><th>值</th><th>单位</th><th>值</th></tr>';
    const pairs = [];
    units.forEach((u,i) => { const v = baseBytes/Math.pow(1024,i); if(v>=1||i===0) pairs.push({u,v}); });
    bits.forEach((b,i) => { const v = baseBytes*8/Math.pow(1024,i); pairs.push({u:b,v}); });
    for(let i=0; i<pairs.length; i+=2) {
      const a = pairs[i], b = pairs[i+1];
      html += `<tr><td style="font-weight:600">${a.u}</td><td style="font-family:monospace">${a.v<0.001?'~0':a.v.toFixed(a.v<1?4:a.v<100?2:a.v<10000?1:0).replace(/\.?0+$/,'')}</td>
        <td style="font-weight:600">${b?b.u:''}</td><td style="font-family:monospace">${b?b.v.toFixed(b.v<1?4:b.v<100?2:b.v<10000?1:0).replace(/\.?0+$/,''):''}</td></tr>`;
    }
    document.getElementById('ds-result').innerHTML = html;
  },

  /* =================================================================
   * TEXT STATS — 文本统计指标
   * ================================================================= */
  renderTextStats() {
    document.getElementById('panel-text-stats').innerHTML = `
      <div class="card">
        <div class="card-header">📈 文本统计</div>
        <div class="card-body">
          <textarea id="ts-input" class="large" placeholder="粘贴文本，实时统计..." style="min-height:250px" oninput="AdvTools._updateTextStats()"></textarea>
        </div>
      </div>
      <div class="card">
        <div class="card-header">📊 统计结果</div>
        <div class="card-body" id="ts-result"><div class="empty-state">输入文本后自动统计</div></div>
      </div>`;
  },

  _updateTextStats() {
    const text = document.getElementById('ts-input').value;
    if (!text) { document.getElementById('ts-result').innerHTML = '<div class="empty-state">输入文本后自动统计</div>'; return; }
    const total = text.length;
    const noSpace = text.replace(/[\s]/g,'').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    const nonEmptyLines = text.split('\n').filter(l=>l.trim()).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p=>p.trim()).length;
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g)||[]).length;
    const punct = (text.match(/[，。！？、；：""''（）【】《》—…·,\.!?;:"'()\[\]{}<>\-_\/\\@#$%^&*~`\|]/g)||[]).length;
    const bytes = new Blob([text]).size;
    const spaces = (text.match(/\s/g)||[]).length;
    const digits = (text.match(/\d/g)||[]).length;
    const letters = (text.match(/[a-zA-Z]/g)||[]).length;
    const stats = [
      ['总字符数（含空格）', total.toLocaleString()],
      ['总字符数（不含空格）', noSpace.toLocaleString()],
      ['单词数', words.toLocaleString()],
      ['行数', lines.toLocaleString()],
      ['非空行数', nonEmptyLines.toLocaleString()],
      ['段落数', paragraphs.toLocaleString()],
      ['中文字符数', cjk.toLocaleString()],
      ['英文字母数', letters.toLocaleString()],
      ['数字数', digits.toLocaleString()],
      ['标点数', punct.toLocaleString()],
      ['空格数', spaces.toLocaleString()],
      ['字节数 (UTF-8)', bytes.toLocaleString()],
    ];
    document.getElementById('ts-result').innerHTML = '<table><tr><th>指标</th><th>数量</th></tr>' +
      stats.map(([name,val]) => `<tr><td style="font-weight:500;color:var(--text-secondary)">${name}</td><td style="font-family:monospace;font-weight:600;font-size:1rem">${val}</td></tr>`).join('') + '</table>';
  },

  /* =================================================================
   * TIME DURATION — 时间间隔换算（秒↔可读）
   * ================================================================= */
  renderTimeDuration() {
    document.getElementById('panel-time-duration').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">⏱️ 秒数 → 可读</div>
          <div class="card-body">
            <div class="form-row">
              <input type="number" id="td-seconds" value="3661" min="0" step="1" style="width:100%;font-family:monospace;font-size:1rem" onkeydown="if(event.key==='Enter')AdvTools._convertSeconds()">
              <span class="hint">秒</span>
              <button class="btn btn-primary" onclick="AdvTools._convertSeconds()">转换</button>
              <button class="btn btn-xs" onclick="AdvTools._setTd(60)">1分</button>
              <button class="btn btn-xs" onclick="AdvTools._setTd(3600)">1时</button>
              <button class="btn btn-xs" onclick="AdvTools._setTd(86400)">1天</button>
              <button class="btn btn-xs" onclick="AdvTools._setTd(604800)">1周</button>
            </div>
            <div id="td-seconds-result" style="font-family:monospace;font-size:1.25rem;padding:12px;background:var(--accent-bg);border-radius:8px;text-align:center;margin-top:8px"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">✏️ 可读 → 秒数</div>
          <div class="card-body">
            <div class="form-row">
              <input type="text" id="td-human" value="1小时1分1秒" placeholder="如: 2天3小时30分15秒" style="width:100%;font-size:0.875rem" onkeydown="if(event.key==='Enter')AdvTools._parseDuration()">
              <button class="btn btn-primary" onclick="AdvTools._parseDuration()">转换</button>
            </div>
            <div class="hint" style="margin-bottom:8px">支持: 天/日/时/小时/分/分钟/秒/毫秒/周/星期</div>
            <div id="td-human-result" style="font-family:monospace;font-size:1.25rem;padding:12px;background:var(--accent-bg);border-radius:8px;text-align:center"></div>
          </div>
        </div>
      </div>`;
    this._convertSeconds();
    this._parseDuration();
  },

  _setTd(v) { document.getElementById('td-seconds').value = v; this._convertSeconds(); },

  _convertSeconds() {
    const total = parseInt(document.getElementById('td-seconds').value);
    if (isNaN(total)||total<0) return;
    const w = Math.floor(total/604800), d = Math.floor((total%604800)/86400);
    const h = Math.floor((total%86400)/3600), m = Math.floor((total%3600)/60), s = total%60;
    const ms = total*1000;
    document.getElementById('td-seconds-result').innerHTML =
      (w?w+'周 ':'')+(d?d+'天 ':'')+(h?h+'时 ':'')+(m?m+'分 ':'')+s+'秒 <span class="text-muted" style="font-size:0.875rem">('+ms.toLocaleString()+'毫秒)</span>';
  },

  _parseDuration() {
    const str = document.getElementById('td-human').value.trim();
    if (!str) return;
    const units = {周:604800,星期:604800,天:86400,日:86400,时:3600,小时:3600,分:60,分钟:60,秒:1,毫秒:0.001};
    let total = 0;
    for (const [name,sec] of Object.entries(units)) {
      const m = str.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s*'+name));
      if (m) total += parseFloat(m[1]) * sec;
    }
    document.getElementById('td-human-result').innerHTML = total+' 秒 <span class="text-muted" style="font-size:0.875rem">('+Math.round(total*1000).toLocaleString()+'毫秒)</span>';
  },

  /* =================================================================
   * PORT LOOKUP — 常见端口查询
   * ================================================================= */
  renderPortLookup() {
    const ports = [
      [20,'FTP 数据','TCP','文件传输'], [21,'FTP 控制','TCP','文件传输'], [22,'SSH','TCP','远程管理'],
      [23,'Telnet','TCP','远程管理'], [25,'SMTP','TCP','邮件传输'], [53,'DNS','UDP/TCP','域名解析'],
      [67,'DHCP 服务端','UDP','网络配置'], [68,'DHCP 客户端','UDP','网络配置'],
      [80,'HTTP','TCP','Web'], [110,'POP3','TCP','邮件接收'], [123,'NTP','UDP','时间同步'],
      [137,'NetBIOS 名称','UDP','网络服务'], [138,'NetBIOS 数据报','UDP','网络服务'],
      [139,'NetBIOS 会话','TCP','网络服务'], [143,'IMAP','TCP','邮件接收'],
      [161,'SNMP','UDP','网络管理'], [162,'SNMP Trap','UDP','网络管理'],
      [194,'IRC','TCP','聊天'], [389,'LDAP','TCP','目录服务'],
      [443,'HTTPS','TCP','Web 安全'], [445,'SMB','TCP','文件共享'],
      [465,'SMTPS','TCP','邮件安全'], [500,'IKE','UDP','VPN'],
      [514,'Syslog','UDP','日志'], [543,'LPD','TCP','打印'],
      [587,'SMTP 提交','TCP','邮件'], [631,'IPP','TCP','打印'],
      [636,'LDAPS','TCP','目录安全'], [993,'IMAPS','TCP','邮件安全'],
      [995,'POP3S','TCP','邮件安全'], [1080,'SOCKS 代理','TCP','代理'],
      [1194,'OpenVPN','UDP','VPN'], [1433,'MSSQL','TCP','数据库'],
      [1521,'Oracle DB','TCP','数据库'], [2049,'NFS','TCP/UDP','文件共享'],
      [2375,'Docker API','TCP','容器'], [2376,'Docker TLS','TCP','容器安全'],
      [3306,'MySQL','TCP','数据库'], [3389,'RDP','TCP','远程桌面'],
      [5432,'PostgreSQL','TCP','数据库'], [5672,'RabbitMQ','TCP','消息队列'],
      [5900,'VNC','TCP','远程桌面'], [6379,'Redis','TCP','缓存'],
      [6443,'Kubernetes API','TCP','容器编排'], [8080,'HTTP 备用','TCP','Web'],
      [8443,'HTTPS 备用','TCP','Web 安全'], [9092,'Kafka','TCP','消息队列'],
      [9200,'Elasticsearch','TCP','搜索引擎'], [9300,'Elasticsearch 节点','TCP','搜索引擎'],
      [11211,'Memcached','TCP','缓存'], [15672,'RabbitMQ 管理','TCP','消息队列'],
      [27017,'MongoDB','TCP','数据库'],
    ];
    document.getElementById('panel-port-lookup').innerHTML = `
      <div class="card">
        <div class="card-header">🔌 常见端口查询</div>
        <div class="card-body">
          <input type="text" id="port-filter" placeholder="搜索端口号或服务名（如 3306、MySQL）..." style="width:100%" oninput="AdvTools._filterPorts()">
          <div class="table-wrap mt-2" style="max-height:500px;overflow-y:auto"><table id="port-table">
            <tr><th>端口</th><th>服务</th><th>协议</th><th>分类</th></tr>
            ${ports.map(([port,svc,proto,cat]) =>
              `<tr class="port-row"><td style="font-family:monospace;font-weight:700">${port}</td><td>${svc}</td><td style="font-family:monospace;font-size:0.75rem">${proto}</td><td><span class="badge" style="background:${cat==='Web'||cat==='Web 安全'?'var(--accent-bg)':cat==='数据库'?'var(--green-bg)':cat==='邮件'||cat==='邮件安全'?'var(--blue-bg)':'var(--bg)'};color:${cat==='Web'||cat==='Web 安全'?'var(--accent)':cat==='数据库'?'var(--green)':cat==='邮件'||cat==='邮件安全'?'var(--blue)':'var(--text-secondary)'}">${cat}</span></td></tr>`
            ).join('')}
          </table></div>
        </div>
      </div>`;
  },

  _filterPorts() {
    const q = document.getElementById('port-filter').value.trim().toLowerCase();
    document.querySelectorAll('#port-table .port-row').forEach(row => {
      row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },


  /* =================================================================
   * Spring Boot Banner 生成
   * ================================================================= */
  _springFont: {
    'A': [' ### ', '#   #', '#   #', '#####', '#   #', '#   #'],
    'B': ['#### ', '#   #', '#### ', '#   #', '#   #', '#### '],
    'C': [' ### ', '#   #', '#    ', '#    ', '#   #', ' ### '],
    'D': ['#### ', '#   #', '#   #', '#   #', '#   #', '#### '],
    'E': ['#####', '#    ', '#### ', '#    ', '#    ', '#####'],
    'F': ['#####', '#    ', '#### ', '#    ', '#    ', '#    '],
    'G': [' ####', '#   #', '#    ', '#  ##', '#   #', ' ####'],
    'H': ['#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
    'I': ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '#####'],
    'J': [' ####', '   # ', '   # ', '   # ', '#  # ', ' ##  '],
    'K': ['#   #', '#  # ', '##   ', '#  # ', '#  # ', '#   #'],
    'L': ['#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
    'M': ['#    #', '##  ##', '# ## #', '#    #', '#    #', '#    #'],
    'N': ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #'],
    'O': [' ### ', '#   #', '#   #', '#   #', '#   #', ' ### '],
    'P': ['#### ', '#   #', '#   #', '#### ', '#    ', '#    '],
    'Q': [' ### ', '#   #', '#   #', '#   #', '#  ##', ' ### '],
    'R': ['#### ', '#   #', '#   #', '#### ', '#  # ', '#   #'],
    'S': [' ### ', '#   #', '  #  ', '   # ', '#   #', ' ### '],
    'T': ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
    'U': ['#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
    'V': ['#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
    'W': ['#   #', '#   #', '# # #', '# # #', '# # #', ' ### '],
    'X': ['#   #', '#   #', ' ### ', ' ### ', '#   #', '#   #'],
    'Y': ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  '],
    'Z': ['#####', '    #', '   # ', '  #  ', ' #   ', '#####'],
    '0': [' ### ', '#  ##', '# # #', '##  #', '#   #', ' ### '],
    '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '#####'],
    '2': [' ####', '#   #', '    #', '   # ', '  #  ', '#####'],
    '3': [' ####', '#   #', '   ##', '    #', '#   #', ' ####'],
    '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # '],
    '5': ['#####', '#    ', '#### ', '    #', '#   #', ' ####'],
    '6': [' ####', '#    ', '#### ', '#   #', '#   #', ' ####'],
    '7': ['#####', '    #', '   # ', '  #  ', '  #  ', '  #  '],
    '8': [' ####', '#   #', ' #### ', '#   #', '#   #', ' ####'],
    '9': [' ####', '#   #', '#   #', ' ####', '    #', ' ####'],
    ' ': ['     ', '     ', '     ', '     ', '     ', '     '],
  },

  renderSpringBootBanner() {
    document.getElementById('panel-spring-boot-banner').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入设置</div>
          <div class="card-body">
            <div class="form-row">
              <label>Banner 文字</label>
              <textarea id="sb-input" class="large" placeholder="输入要生成 Banner 的文字，如：&#10;MyApp&#10;Spring Boot" rows="4"></textarea>
            </div>
            <div class="form-row">
              <label>字体变体</label>
              <select id="sb-style">
                <option value="standard">标准 (Standard)</option>
                <option value="thick">加粗 (Thick)</option>
                <option value="block">实心 (Block)</option>
                <option value="big">放大 (Big)</option>
              </select>
            </div>
            <div class="form-row">
              <label>填充字符</label>
              <input type="text" id="sb-char" value="#" style="width:60px" maxlength="2">
              <span class="hint">用于绘制 Banner 的字符</span>
            </div>
            <button class="btn btn-primary" onclick="AdvTools._genSpringBanner()">🍃 生成 Banner</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header">Banner 预览</div>
          <div class="card-body">
            <pre id="sb-preview" class="code-block" style="background:var(--bg);padding:1.25rem;font-size:13px;line-height:1.3;min-height:180px;white-space:pre;overflow:auto">点击上方"生成 Banner"预览效果</pre>
            <div class="btn-group">
              <button class="btn" onclick="AdvTools._copySpringBanner()">📋 复制 Banner</button>
              <button class="btn" onclick="AdvTools._downloadSpringBanner()">⬇ 下载 .txt</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Spring Boot 配置参考</div>
        <div class="card-body" style="font-size:0.85rem;line-height:1.7">
          <p>将生成的 Banner 保存为 <code>banner.txt</code> 放到 <code>src/main/resources/</code> 目录下，Spring Boot 启动时自动显示。</p>
          <p class="hint" style="margin-top:0.5rem">也可在 application.properties 中配置：<code>spring.banner.location=classpath:banner.txt</code></p>
        </div>
      </div>`;
  },

  _genSpringBanner() {
    const text = document.getElementById('sb-input').value.trim();
    if (!text) return showToast('请输入文字');
    const style = document.getElementById('sb-style').value;
    const fillChar = document.getElementById('sb-char').value || '#';

    const font = this._springFont;
    const chars = text.toUpperCase().split('');
    const rows = 6;
    let result = [];

    for (let r = 0; r < rows; r++) {
      let line = '';
      for (const ch of chars) {
        const glyph = font[ch];
        if (glyph) {
          line += ' ' + glyph[r];
        } else {
          line += '  ' + '#'.repeat(3) + ' ';
        }
      }
      result.push(line);
    }

    if (style === 'thick') {
      result = result.map(line => line.replace(/#+/g, m => fillChar.repeat(m.length * 2)));
    } else if (style === 'block') {
      result = result.map(line => line.replace(/#/g, '█'));
    } else if (style === 'big') {
      const doubled = [];
      for (const line of result) {
        const l = line.replace(/#/g, fillChar);
        doubled.push(l);
        doubled.push(l);
      }
      result = doubled;
    } else {
      result = result.map(line => line.replace(/#/g, fillChar));
    }

    document.getElementById('sb-preview').textContent = result.join('\n');
  },

  _copySpringBanner() {
    const pre = document.getElementById('sb-preview');
    if (!pre || !pre.textContent || pre.textContent.startsWith('点击')) {
      return showToast('请先生成 Banner');
    }
    navigator.clipboard.writeText(pre.textContent).then(() => {
      showToast('已复制到剪贴板');
    }).catch(() => {
      showToast('复制失败，请手动选择复制');
    });
  },

  _downloadSpringBanner() {
    const pre = document.getElementById('sb-preview');
    if (!pre || !pre.textContent || pre.textContent.startsWith('点击')) {
      return showToast('请先生成 Banner');
    }
    const blob = new Blob([pre.textContent], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'banner.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('已下载 banner.txt');
  },
};
