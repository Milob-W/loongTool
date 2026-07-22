const StreamTools = {
  pipelineSteps: [],
  stepIdCounter: 0,
  previewData: [],

  init() {
    this.renderStreamPipeline();
  },

  /* ========== Render ========== */
  renderStreamPipeline() {
    document.getElementById('panel-stream').innerHTML = `
      <div class="card">
        <div class="card-header">📥 1. 数据源</div>
        <div class="card-body">
          <div class="form-row">
            <label>格式</label>
            <select id="st-source-type" onchange="StreamTools.onSourceTypeChange()">
              <option value="csv">CSV / TSV</option>
              <option value="json">JSON 数组</option>
              <option value="text">纯文本 (每行一项)</option>
            </select>
          </div>
          <div id="st-source-config">
            <div class="form-row"><label>分隔符</label>
              <select id="st-csv-delimiter"><option value=",">逗号 ,</option><option value="\t">制表符</option><option value="|">竖线</option><option value="custom">自定义</option></select>
              <input type="text" id="st-csv-delimiter-custom" placeholder="自定义" style="display:none;width:80px">
            </div>
            <div class="form-row"><label><input type="checkbox" id="st-csv-header" checked onchange="StreamTools.onSourceConfigChange()"> 首行为表头</label></div>
            <div class="form-row" id="st-csv-col-select">
              <label>提取列</label>
              <select id="st-csv-column" style="min-width:120px"><option value="">-- 选择列 --</option></select>
              <span class="hint">或手动输入列号</span>
              <input type="text" id="st-csv-column-idx" placeholder="列号从1" style="width:60px">
            </div>
          </div>
          <div id="st-json-config" style="display:none">
            <div class="form-row"><label>JSONPath</label><input type="text" id="st-json-path" value="$[*].name" placeholder='如: $[*].name 或 $..name' style="width:100%;font-family:monospace"></div>
            <div class="form-row"><label>提取字段</label>
              <select id="st-json-field" style="min-width:120px"><option value="">解析后可选</option></select>
            </div>
          </div>
          <textarea id="st-input" class="large" placeholder="${'输入 CSV 数据:\nname,age,city\n张三,30,北京\n李四,25,上海\n王五,35,广州'}"></textarea>
          <div class="status-bar" id="st-input-status">等待输入...</div>
          <button class="btn btn-sm" onclick="StreamTools.parseSource()">🔄 解析数据源</button>
          <span class="hint ml-auto">解析后可从下方添加处理步骤</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span>⛓️ 2. 处理管道 (Pipeline)</span>
          <span class="badge badge-info" id="st-preview-count" style="margin-left:8px">0 项</span>
          <div class="ml-auto" style="display:flex;gap:4px">
            <button class="btn btn-sm" onclick="StreamTools.runPipeline(true)">👁️ 预览</button>
            <button class="btn btn-sm btn-primary" onclick="StreamTools.runPipeline(false)">▶️ 执行全部</button>
          </div>
        </div>
        <div class="card-body" id="st-pipeline-steps">
          <div class="empty-state">先在上方解析数据源，然后点击 "+" 添加处理步骤</div>
        </div>
        <div class="card-body" style="border-top:1px solid var(--border)">
          <div class="btn-group">
            <select id="st-add-step-type" style="width:180px">
              <option value="filter">🔍 Filter 过滤</option>
              <option value="map">✏️ Map 映射</option>
              <option value="sort">📶 Sort 排序</option>
              <option value="distinct">🧹 Distinct 去重</option>
              <option value="limit">✂️ Limit 截取</option>
              <option value="skip">⏭️ Skip 跳过</option>
              <option value="reverse">🔃 Reverse 反转</option>
              <option value="flatmap">🔀 FlatMap 展开</option>
              <option value="groupby">📊 GroupBy 分组</option>
              <option value="reduce">📦 Reduce 归约</option>
              <option value="peek">👁️ Peek 窥视</option>
            </select>
            <button class="btn btn-primary" onclick="StreamTools.addStep()">+ 添加步骤</button>
            <button class="btn" onclick="StreamTools.clearPipeline()">🗑️ 清空管道</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">📊 结果</div>
          <div class="card-body" id="st-result">
            <div class="empty-state">执行管道后显示结果</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">📋 管道日志 / 中间数据</div>
          <div class="card-body relative">
            <textarea id="st-log" class="large" readonly style="min-height:200px;font-size:11px" placeholder="执行日志..."></textarea>
          </div>
        </div>
      </div>
    `;

    document.getElementById('st-csv-delimiter').addEventListener('change', () => {
      const c = document.getElementById('st-csv-delimiter-custom');
      c.style.display = document.getElementById('st-csv-delimiter').value === 'custom' ? 'inline-block' : 'none';
    });
    document.getElementById('st-csv-header').addEventListener('change', () => this.onSourceConfigChange());
    document.getElementById('st-csv-column-idx').addEventListener('input', () => this.onSourceConfigChange());
    document.getElementById('st-json-path').addEventListener('input', () => this.onSourceConfigChange());
    document.getElementById('st-input').addEventListener('input', () => {
      const lines = document.getElementById('st-input').value.split('\n').length;
      document.getElementById('st-input-status').textContent = `${lines} 行`;
    });
  },

  onSourceTypeChange() {
    const type = document.getElementById('st-source-type').value;
    document.getElementById('st-source-config').style.display = type === 'csv' ? 'block' : 'none';
    document.getElementById('st-json-config').style.display = type === 'json' ? 'block' : 'none';
  },

  onSourceConfigChange() {
    this.previewData = [];
    this.renderPipelineSteps();
  },

  /* ========== CSV / JSON / Text Parsing ========== */
  parseCSV(text, delimiter, hasHeader) {
    const rows = text.split('\n').filter(l => l.trim());
    if (rows.length === 0) return { headers: [], data: [] };

    const parseRow = (row) => {
      const result = [];
      let current = '', inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === delimiter && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      result.push(current.trim());
      return result;
    };

    const parsedRows = rows.map(parseRow);

    if (hasHeader) {
      return { headers: parsedRows[0], data: parsedRows.slice(1) };
    }
    return { headers: parsedRows[0] ? parsedRows[0].map((_, i) => `Col${i + 1}`) : [], data: parsedRows };
  },

  parseJSON(text, path) {
    try {
      const data = JSON.parse(text);
      let items = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (path) {
        const resolvePath = (obj, p) => {
          if (p.startsWith('$')) p = p.slice(1);
          if (p.startsWith('.')) p = p.slice(1);
          if (p.startsWith('[')) {
            const match = p.match(/^\[(\d+)\]/);
            if (match) { return resolvePath(obj[match[1]], p.slice(match[0].length)); }
          }
          if (p.startsWith('*.')) {
            if (Array.isArray(obj)) return obj.flatMap(item => resolvePath(item, p.slice(2)));
            return [];
          }
          if (p.startsWith('..')) {
            const results = [];
            const walk = (o, remaining) => {
              if (!o || typeof o !== 'object') return;
              if (remaining.startsWith('.')) remaining = remaining.slice(1);
              if (remaining.includes('.')) {
                const [key, ...rest] = remaining.split('.');
                const sub = Array.isArray(o) ? o : [o];
                sub.forEach(item => { if (item[key] !== undefined) walk(item[key], rest.join('.')); });
              } else {
                const sub = Array.isArray(o) ? o : [o];
                sub.forEach(item => { if (item[remaining] !== undefined) results.push(item[remaining]); });
                Object.values(o).forEach(v => { if (typeof v === 'object') walk(v, remaining); });
              }
            };
            walk(obj, p.slice(2));
            return results;
          }
          if (p.includes('.')) {
            const [key, ...rest] = p.split('.');
            if (Array.isArray(obj)) return obj.flatMap(item => resolvePath(item, rest.join('.')));
            if (obj && obj[key] !== undefined) return resolvePath(obj[key], rest.join('.'));
            return [];
          }
          if (Array.isArray(obj)) return obj.map(item => item[p]).filter(v => v !== undefined);
          return obj[p] !== undefined ? [obj[p]] : [];
        };
        items = resolvePath(data, path);
        if (!Array.isArray(items)) items = [items];
      }
      return items.filter(i => i !== null && i !== undefined);
    } catch (e) {
      this.log(`JSON 解析错误: ${e.message}`);
      return [];
    }
  },

  parseSource() {
    const type = document.getElementById('st-source-type').value;
    const text = document.getElementById('st-input').value;
    if (!text.trim()) { showToast('请输入数据'); return; }

    let items = [];
    let fields = [];

    if (type === 'csv') {
      let delim = document.getElementById('st-csv-delimiter').value;
      if (delim === 'custom') delim = document.getElementById('st-csv-delimiter-custom').value || ',';
      if (delim === '\\t') delim = '\t';
      const hasHeader = document.getElementById('st-csv-header').checked;
      const { headers, data } = this.parseCSV(text, delim, hasHeader);
      fields = headers || [];
      items = data;

      const colSelect = document.getElementById('st-csv-column');
      colSelect.innerHTML = fields.map((f, i) => `<option value="${i}">${f} (Col${i+1})</option>`).join('');
      colSelect.style.display = fields.length > 0 ? 'inline-block' : 'none';

      const colIdx = document.getElementById('st-csv-column-idx');
      let col = parseInt(colIdx.value) - 1;
      if (isNaN(col) || col < 0) col = 0;

      items = items.map(row => ({
        _raw: row.join(delim),
        _cols: row,
        _fields: fields,
        val: row[col] || ''
      }));

    } else if (type === 'json') {
      const path = document.getElementById('st-json-path').value;
      const parsed = this.parseJSON(text, path);
      items = parsed;

      if (items.length > 0 && typeof items[0] === 'object') {
        fields = Object.keys(items[0]);
        items = items.map(item => ({
          _raw: JSON.stringify(item),
          _cols: fields.map(f => String(item[f] ?? '')),
          _fields: fields,
          val: String(Object.values(item)[0] ?? '')
        }));
      } else {
        items = items.map(v => ({
          _raw: String(v),
          _cols: [String(v)],
          _fields: ['value'],
          val: String(v)
        }));
      }
    } else {
      items = text.split('\n').filter(l => l.trim()).map(line => ({
        _raw: line,
        _cols: [line],
        _fields: ['value'],
        val: line
      }));
    }

    this.previewData = items;
    this.log(`解析完成: ${items.length} 条记录`);
    document.getElementById('st-preview-count').textContent = `${items.length} 项`;
    document.getElementById('st-input-status').textContent = `${items.length} 项已解析`;

    if (items.length > 0) {
      const sample = items[0];
      if (sample._fields && sample._fields.length > 0) {
        this.log(`字段: ${sample._fields.join(', ')}`);
        this.log(`示例值: ${sample.val}`);
      }
    }

    this.renderPipelineSteps();
    this.showResult(items);
  },

  /* ========== Pipeline Step Management ========== */
  addStep(type) {
    type = type || document.getElementById('st-add-step-type').value;
    const step = {
      id: ++this.stepIdCounter,
      type: type,
      config: this.defaultConfig(type)
    };
    this.pipelineSteps.push(step);
    this.renderPipelineSteps();
    this.log(`[+] 添加步骤: ${this.stepLabel(type)}`);
  },

  removeStep(id) {
    const idx = this.pipelineSteps.findIndex(s => s.id === id);
    if (idx >= 0) {
      const removed = this.pipelineSteps.splice(idx, 1)[0];
      this.log(`[-] 移除步骤: ${this.stepLabel(removed.type)}`);
    }
    this.renderPipelineSteps();
  },

  clearPipeline() {
    this.pipelineSteps = [];
    this.renderPipelineSteps();
    this.log('[-] 管道已清空');
  },

  moveStep(id, direction) {
    const idx = this.pipelineSteps.findIndex(s => s.id === id);
    if (direction === 'up' && idx > 0) {
      [this.pipelineSteps[idx-1], this.pipelineSteps[idx]] = [this.pipelineSteps[idx], this.pipelineSteps[idx-1]];
    } else if (direction === 'down' && idx < this.pipelineSteps.length - 1) {
      [this.pipelineSteps[idx], this.pipelineSteps[idx+1]] = [this.pipelineSteps[idx+1], this.pipelineSteps[idx]];
    }
    this.renderPipelineSteps();
  },

  defaultConfig(type) {
    const configs = {
      filter: { condition: 'contains', value: '', mode: 'keep' },
      map: { operation: 'upperCase', param1: '', param2: '' },
      sort: { order: 'asc' },
      distinct: {},
      limit: { count: 10 },
      skip: { count: 5 },
      reverse: {},
      flatmap: { delimiter: ',' },
      groupby: { by: 'firstChar' },
      reduce: { operation: 'join', delimiter: ', ' },
      peek: {},
    };
    return configs[type] || {};
  },

  stepLabel(type) {
    const labels = {
      filter: 'Filter 过滤', map: 'Map 映射', sort: 'Sort 排序',
      distinct: 'Distinct 去重', limit: 'Limit 截取', skip: 'Skip 跳过',
      reverse: 'Reverse 反转', flatmap: 'FlatMap 展开', groupby: 'GroupBy 分组',
      reduce: 'Reduce 归约', peek: 'Peek 窥视',
    };
    return labels[type] || type;
  },

  /* ========== Render Pipeline Steps ========== */
  renderPipelineSteps() {
    const container = document.getElementById('st-pipeline-steps');
    if (!container) return;

    const steps = this.pipelineSteps;
    if (steps.length === 0) {
      container.innerHTML = `<div class="empty-state">管道为空 — 点击上方 "+ 添加步骤" 开始构建处理链</div>`;
      return;
    }

    container.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">${
      steps.map((step, i) => `
        <div style="border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface)">
          <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg);border-bottom:1px solid var(--border)">
            <span class="badge badge-info" style="min-width:24px;text-align:center">${i + 1}</span>
            <span style="font-weight:600;font-size:0.8125rem;flex:1">${this.stepLabel(step.type)}</span>
            <div style="display:flex;gap:4px">
              ${i > 0 ? `<button class="btn btn-sm" onclick="StreamTools.moveStep(${step.id},'up')" title="上移">↑</button>` : ''}
              ${i < steps.length - 1 ? `<button class="btn btn-sm" onclick="StreamTools.moveStep(${step.id},'down')" title="下移">↓</button>` : ''}
              <button class="btn btn-sm" style="color:var(--red)" onclick="StreamTools.removeStep(${step.id})" title="移除">✕</button>
            </div>
          </div>
          <div class="step-config" style="padding:8px 12px">
            ${this.renderStepConfig(step)}
          </div>
        </div>
      `).join('')
    }</div>`;
  },

  renderStepConfig(step) {
    const cfg = step.config;
    const checked = (v) => v ? 'checked' : '';

    switch (step.type) {
      case 'filter':
        return `
          <div class="form-row" style="margin-bottom:0">
            <select onchange="StreamTools.updateConfig(${step.id},'condition',this.value)" style="width:120px">
              ${['contains','equals','startsWith','endsWith','matches','length','gt','lt'].map(o =>
                `<option value="${o}" ${cfg.condition===o?'selected':''}>${{contains:'包含',equals:'等于',startsWith:'开头是',endsWith:'结尾是',matches:'正则匹配',length:'长度',gt:'大于',lt:'小于'}[o]}</option>`
              ).join('')}
            </select>
            <input type="text" value="${cfg.value}" oninput="StreamTools.updateConfig(${step.id},'value',this.value)" placeholder="值" style="width:160px">
            <select onchange="StreamTools.updateConfig(${step.id},'mode',this.value)" style="width:80px">
              <option value="keep" ${cfg.mode==='keep'?'selected':''}>保留</option>
              <option value="remove" ${cfg.mode==='remove'?'selected':''}>排除</option>
            </select>
          </div>`;
      case 'map':
        return `
          <div class="form-row" style="margin-bottom:0">
            <select onchange="StreamTools.updateConfig(${step.id},'operation',this.value);StreamTools.renderPipelineSteps()" style="width:150px">
              ${['upperCase','lowerCase','trim','substring','replace','prefix','suffix','reverse','template'].map(o =>
                `<option value="${o}" ${cfg.operation===o?'selected':''}>${{upperCase:'大写',lowerCase:'小写',trim:'去空格',substring:'截取',replace:'替换',prefix:'加前缀',suffix:'加后缀',reverse:'反转',template:'模板'}[o]}</option>`
              ).join('')}
            </select>
            ${cfg.operation === 'substring' ? `
              <input type="number" value="${cfg.param1}" oninput="StreamTools.updateConfig(${step.id},'param1',this.value)" placeholder="开始" style="width:60px">
              <input type="number" value="${cfg.param2}" oninput="StreamTools.updateConfig(${step.id},'param2',this.value)" placeholder="结束" style="width:60px">
            ` : ''}
            ${cfg.operation === 'replace' ? `
              <input type="text" value="${cfg.param1}" oninput="StreamTools.updateConfig(${step.id},'param1',this.value)" placeholder="查找" style="width:100px">
              <input type="text" value="${cfg.param2}" oninput="StreamTools.updateConfig(${step.id},'param2',this.value)" placeholder="替换为" style="width:100px">
            ` : ''}
            ${['prefix','suffix'].includes(cfg.operation) ? `
              <input type="text" value="${cfg.param1}" oninput="StreamTools.updateConfig(${step.id},'param1',this.value)" placeholder="文本" style="width:100px">
            ` : ''}
            ${cfg.operation === 'template' ? `
              <input type="text" value="${cfg.param1}" oninput="StreamTools.updateConfig(${step.id},'param1',this.value)" placeholder='如: {val} 条' style="width:200px;font-family:monospace">
              <span class="hint">{val} 代表当前值, {i} 代表序号</span>
            ` : ''}
          </div>`;
      case 'sort':
        return `
          <div class="form-row" style="margin-bottom:0">
            <select onchange="StreamTools.updateConfig(${step.id},'order',this.value)" style="width:150px">
              <option value="asc" ${cfg.order==='asc'?'selected':''}>升序 A→Z</option>
              <option value="desc" ${cfg.order==='desc'?'selected':''}>降序 Z→A</option>
              <option value="num-asc" ${cfg.order==='num-asc'?'selected':''}>数字升序</option>
              <option value="num-desc" ${cfg.order==='num-desc'?'selected':''}>数字降序</option>
              <option value="length-asc" ${cfg.order==='length-asc'?'selected':''}>按长度升序</option>
              <option value="length-desc" ${cfg.order==='length-desc'?'selected':''}>按长度降序</option>
              <option value="natural" ${cfg.order==='natural'?'selected':''}>自然排序</option>
            </select>
          </div>`;
      case 'limit':
        return `
          <div class="form-row" style="margin-bottom:0">
            <label>保留前</label>
            <input type="number" value="${cfg.count}" oninput="StreamTools.updateConfig(${step.id},'count',parseInt(this.value)||1)" style="width:80px">
            <span class="hint">项</span>
          </div>`;
      case 'skip':
        return `
          <div class="form-row" style="margin-bottom:0">
            <label>跳过前</label>
            <input type="number" value="${cfg.count}" oninput="StreamTools.updateConfig(${step.id},'count',parseInt(this.value)||0)" style="width:80px">
            <span class="hint">项</span>
          </div>`;
      case 'flatmap':
        return `
          <div class="form-row" style="margin-bottom:0">
            <label>按分隔符拆分</label>
            <input type="text" value="${cfg.delimiter}" oninput="StreamTools.updateConfig(${step.id},'delimiter',this.value)" placeholder="分隔符" style="width:80px">
            <label><input type="checkbox" ${checked(cfg.trim)} onchange="StreamTools.updateConfig(${step.id},'trim',this.checked)"> 去空格</label>
            <label><input type="checkbox" ${checked(cfg.filterEmpty)} onchange="StreamTools.updateConfig(${step.id},'filterEmpty',this.checked)" checked> 过滤空串</label>
          </div>`;
      case 'groupby':
        return `
          <div class="form-row" style="margin-bottom:0">
            <select onchange="StreamTools.updateConfig(${step.id},'by',this.value)" style="width:150px">
              <option value="firstChar" ${cfg.by==='firstChar'?'selected':''}>首字母分组</option>
              <option value="length" ${cfg.by==='length'?'selected':''}>按长度分组</option>
              <option value="exact" ${cfg.by==='exact'?'selected':''}>精确分组</option>
            </select>
          </div>`;
      case 'reduce':
        return `
          <div class="form-row" style="margin-bottom:0">
            <select onchange="StreamTools.updateConfig(${step.id},'operation',this.value);StreamTools.renderPipelineSteps()" style="width:120px">
              <option value="join" ${cfg.operation==='join'?'selected':''}>Join 连接</option>
              <option value="count" ${cfg.operation==='count'?'selected':''}>Count 计数</option>
              <option value="sum" ${cfg.operation==='sum'?'selected':''}>Sum 求和</option>
              <option value="min" ${cfg.operation==='min'?'selected':''}>Min 最小值</option>
              <option value="max" ${cfg.operation==='max'?'selected':''}>Max 最大值</option>
            </select>
            ${cfg.operation === 'join' ? `
              <input type="text" value="${cfg.delimiter}" oninput="StreamTools.updateConfig(${step.id},'delimiter',this.value)" placeholder="连接符" style="width:80px">
            ` : ''}
          </div>`;
      case 'peek':
        return `<span class="text-xs text-muted">窥视步骤: 执行到此步时会将中间数据显示在日志中</span>`;
      default:
        return '';
    }
  },

  updateConfig(stepId, key, value) {
    const step = this.pipelineSteps.find(s => s.id === stepId);
    if (step) step.config[key] = value;
  },

  /* ========== Stream Operations ========== */
  opFilter(items, config) {
    const { condition, value, mode } = config;
    const predicate = (item) => {
      const v = item.val;
      switch (condition) {
        case 'contains': return v.includes(value);
        case 'equals': return v === value;
        case 'startsWith': return v.startsWith(value);
        case 'endsWith': return v.endsWith(value);
        case 'matches': try { return new RegExp(value).test(v); } catch { return false; }
        case 'length': return v.length === parseInt(value);
        case 'gt': return parseFloat(v) > parseFloat(value);
        case 'lt': return parseFloat(v) < parseFloat(value);
        default: return true;
      }
    };
    return mode === 'remove' ? items.filter(i => !predicate(i)) : items.filter(predicate);
  },

  opMap(items, config) {
    const { operation, param1, param2 } = config;
    return items.map((item, i) => {
      let v = item.val;
      switch (operation) {
        case 'upperCase': v = v.toUpperCase(); break;
        case 'lowerCase': v = v.toLowerCase(); break;
        case 'trim': v = v.trim(); break;
        case 'reverse': v = v.split('').reverse().join(''); break;
        case 'substring': v = v.substring(parseInt(param1) || 0, parseInt(param2) || v.length); break;
        case 'replace': v = v.replaceAll(param1 || '', param2 || ''); break;
        case 'prefix': v = (param1 || '') + v; break;
        case 'suffix': v = v + (param1 || ''); break;
        case 'template': v = (param1 || '{val}').replace(/\{val\}/g, v).replace(/\{i\}/g, String(i + 1)); break;
      }
      return { ...item, val: v, _processed: v };
    });
  },

  opSort(items, config) {
    const { order } = config;
    const sorted = [...items];
    switch (order) {
      case 'asc': sorted.sort((a, b) => a.val.localeCompare(b.val)); break;
      case 'desc': sorted.sort((a, b) => b.val.localeCompare(a.val)); break;
      case 'num-asc': sorted.sort((a, b) => (parseFloat(a.val) || 0) - (parseFloat(b.val) || 0)); break;
      case 'num-desc': sorted.sort((a, b) => (parseFloat(b.val) || 0) - (parseFloat(a.val) || 0)); break;
      case 'length-asc': sorted.sort((a, b) => a.val.length - b.val.length); break;
      case 'length-desc': sorted.sort((a, b) => b.val.length - a.val.length); break;
      case 'natural': sorted.sort((a, b) => a.val.localeCompare(b.val, undefined, { numeric: true })); break;
    }
    return sorted;
  },

  opDistinct(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = item.val;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  opLimit(items, config) {
    return items.slice(0, config.count || 10);
  },

  opSkip(items, config) {
    return items.slice(config.count || 0);
  },

  opReverse(items) {
    return [...items].reverse();
  },

  opFlatMap(items, config) {
    const { delimiter, trim, filterEmpty } = config;
    const result = [];
    for (const item of items) {
      const parts = item.val.split(delimiter || ',');
      for (const p of parts) {
        let v = filterEmpty ? p.trim() : p;
        if (trim) v = v.trim();
        if (filterEmpty && !v) continue;
        result.push({ ...item, val: v, _processed: v });
      }
    }
    return result;
  },

  opGroupBy(items, config) {
    const { by } = config;
    const groups = {};
    for (const item of items) {
      let key;
      switch (by) {
        case 'firstChar': key = (item.val[0] || '').toUpperCase() || '(empty)'; break;
        case 'length': key = `len=${item.val.length}`; break;
        case 'exact': key = item.val; break;
        default: key = item.val;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    const result = [];
    for (const [key, group] of Object.entries(groups)) {
      result.push({
        val: `${key} (${group.length} 项)`,
        _group: true,
        _groupKey: key,
        _groupCount: group.length,
        _groupItems: group.map(g => g.val)
      });
    }
    return result;
  },

  opReduce(items, config) {
    const { operation, delimiter } = config;
    const vals = items.map(i => i.val);
    switch (operation) {
      case 'join': return [{ val: vals.join(delimiter || ', '), _reduced: true }];
      case 'count': return [{ val: `Count: ${vals.length}`, _reduced: true }];
      case 'sum': {
        const sum = vals.reduce((a, b) => a + (parseFloat(b) || 0), 0);
        return [{ val: `Sum: ${sum}`, _reduced: true }];
      }
      case 'min': {
        const nums = vals.map(v => parseFloat(v)).filter(v => !isNaN(v));
        return [{ val: `Min: ${nums.length > 0 ? Math.min(...nums) : 'N/A'}`, _reduced: true }];
      }
      case 'max': {
        const nums = vals.map(v => parseFloat(v)).filter(v => !isNaN(v));
        return [{ val: `Max: ${nums.length > 0 ? Math.max(...nums) : 'N/A'}`, _reduced: true }];
      }
      default: return items;
    }
  },

  /* ========== Execute Pipeline ========== */
  runPipeline(previewOnly) {
    if (this.previewData.length === 0) {
      showToast('请先在数据源步骤解析数据');
      return;
    }

    let items = [...this.previewData];
    this.log(`\n=== 开始执行管道 (${items.length} 项) ===`);
    if (previewOnly) this.log('(预览模式: 每步之后显示前 5 项)');

    const steps = previewOnly ? this.pipelineSteps.slice(0, 1) : this.pipelineSteps;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const type = step.type;
      const before = items.length;

      this.log(`\n[步骤 ${i+1}] ${this.stepLabel(type)}`);

      try {
        switch (type) {
          case 'filter': items = this.opFilter(items, step.config); break;
          case 'map': items = this.opMap(items, step.config); break;
          case 'sort': items = this.opSort(items, step.config); break;
          case 'distinct': items = this.opDistinct(items); break;
          case 'limit': items = this.opLimit(items, step.config); break;
          case 'skip': items = this.opSkip(items, step.config); break;
          case 'reverse': items = this.opReverse(items); break;
          case 'flatmap': items = this.opFlatMap(items, step.config); break;
          case 'groupby': items = this.opGroupBy(items, step.config); break;
          case 'reduce': items = this.opReduce(items, step.config); break;
          case 'peek':
            this.log(`  👁️ 中间数据 (前 10 项):\n    ${items.slice(0, 10).map(i => i.val).join('\n    ')}`);
            this.log(`  (共 ${items.length} 项)`);
            break;
        }

        const after = items.length;
        this.log(`  → ${before} → ${after} 项`);

        if (previewOnly) {
          this.log(`  预览 (前 5):\n    ${items.slice(0, 5).map(i => i.val).join('\n    ')}`);
          if (items.length > 5) this.log(`    ... (还有 ${items.length - 5} 项)`);
        }

      } catch (e) {
        this.log(`  ❌ 错误: ${e.message}`);
        showToast(`步骤 ${i+1} 出错: ${e.message}`);
        break;
      }
    }

    if (!previewOnly) {
      this.log(`\n✅ 管道执行完成: ${items.length} 项`);
      this.showResult(items);
      document.getElementById('st-preview-count').textContent = `${items.length} 项`;
    } else {
      this.log('\n💡 预览完成 - 移除 "预览模式" 限制后执行完整管道');
    }
  },

  showResult(items) {
    const container = document.getElementById('st-result');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state">无数据</div>`;
      return;
    }

    const groups = items.filter(i => i._group);
    if (groups.length > 0) {
      container.innerHTML = `<div style="max-height:400px;overflow-y:auto">
        <table><tr><th>分组</th><th>数量</th><th>明细</th></tr>
        ${groups.map(g => `<tr>
          <td style="font-weight:600">${g._groupKey}</td>
          <td><span class="badge badge-info">${g._groupCount}</span></td>
          <td style="font-size:0.75rem;color:var(--text-secondary);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g._groupItems.join(', ')}</td>
        </tr>`).join('')}
      </table></div>`;
      return;
    }

    const reduced = items.filter(i => i._reduced);
    if (reduced.length > 0) {
      container.innerHTML = `<div style="font-size:1.5rem;font-weight:700;color:var(--accent);text-align:center;padding:2rem">${reduced[0].val}</div>`;
      return;
    }

    container.innerHTML = `<div style="max-height:400px;overflow-y:auto">
      <div class="status-bar">共 ${items.length} 项</div>
      <table><tr><th>#</th><th>值</th><th>原始行</th></tr>
      ${items.slice(0, 200).map((item, i) => `<tr>
        <td class="text-muted">${i+1}</td>
        <td style="font-family:monospace;word-break:break-all;max-width:300px">${item._processed || item.val}</td>
        <td style="font-size:0.75rem;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item._raw || ''}</td>
      </tr>`).join('')}
      ${items.length > 200 ? `<tr><td colspan="3" class="text-center text-muted">... 仅显示前 200 项 (共 ${items.length} 项) ...</td></tr>` : ''}
      </table>
    </div>`;

    document.getElementById('st-preview-count').textContent = `${items.length} 项`;
  },

  log(msg) {
    const el = document.getElementById('st-log');
    if (!el) return;
    el.value += msg + '\n';
    el.scrollTop = el.scrollHeight;
  },

};
