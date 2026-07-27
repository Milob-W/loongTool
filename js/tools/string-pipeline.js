const StringPipeline = {
  steps: [],
  stepIdCounter: 0,

  init() {
    this.renderStringPipeline();
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  },

  renderStringPipeline() {
    document.getElementById('panel-string-pipeline').innerHTML = `
      <div class="card">
        <div class="card-header">📥 输入</div>
        <div class="card-body">
          <textarea id="sp-input" class="large" placeholder="输入要处理的文本，每行一个项目或按需格式..."></textarea>
          <div class="status-bar" id="sp-input-status">0 行</div>
          <div class="btn-group mt-2">
            <button class="btn btn-sm" onclick="StringPipeline.clearInput()">❌ 清空</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span>⛓️ 处理管道</span>
          <span class="badge badge-info" id="sp-step-count">0 步</span>
          <div class="ml-auto" style="display:flex;gap:4px">
            <button class="btn btn-sm btn-primary" onclick="StringPipeline.execute()">▶️ 执行全部</button>
            <button class="btn btn-sm" onclick="StringPipeline.clearSteps()">🗑️ 清空所有步骤</button>
          </div>
        </div>
        <div class="card-body" id="sp-steps-container">
          <div class="empty-state" id="sp-empty-hint">点击下方按钮添加处理步骤，从上到下依次执行</div>
        </div>
        <div class="card-body" style="border-top:1px solid var(--border)">
          <div class="form-row">
            <select id="sp-add-step-type" style="width:200px">
              <option value="case">🔤 大小写转换</option>
              <option value="wrap">🎁 包裹（前缀/后缀）</option>
              <option value="join">🔗 行连接</option>
              <option value="split">✂️ 按分隔符拆分</option>
              <option value="sort">📋 排序</option>
              <option value="reverse-lines">🔃 反转行顺序</option>
              <option value="unique">🧹 去重</option>
              <option value="trim">✂️ 去除两端空格</option>
              <option value="remove-empty">🗑️ 删除空行</option>
              <option value="replace">🔄 替换文本</option>
              <option value="regex-replace">🔬 正则替换</option>
              <option value="reverse-str">↩️ 反转每行内容</option>
              <option value="line-number">🔢 添加行号</option>
              <option value="filter">🔍 按条件过滤</option>
              <option value="repeat">🔁 重复行</option>
              <option value="base64-encode">🔏 Base64 编码</option>
              <option value="base64-decode">🔓 Base64 解码</option>
              <option value="url-encode">🔗 URL 编码</option>
              <option value="url-decode">🔗 URL 解码</option>
              <option value="html-encode">🌐 HTML 编码</option>
              <option value="html-decode">🌐 HTML 解码</option>
              <option value="escape">↩️ 字符串转义</option>
              <option value="unescape">↩️ 字符串反转义</option>
              <option value="rot13">🔄 ROT13</option>
              <option value="prefix-suffix">📎 每行添加前缀后缀</option>
              <option value="column-select">📐 列提取</option>
            </select>
            <button class="btn btn-primary" onclick="StringPipeline.addStep()">+ 添加步骤</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">📊 输出结果</div>
        <div class="card-body">
          <textarea id="sp-output" class="large" readonly placeholder="执行管道后显示结果..."></textarea>
          <div class="status-bar" id="sp-output-status">0 行</div>
          <div class="btn-group mt-2">
            <button class="btn btn-sm" onclick="StringPipeline.copyOutput()">📋 复制</button>
            <button class="btn btn-sm" onclick="StringPipeline.exportOutput()">💾 导出</button>
          </div>
        </div>
      </div>

      <div class="card" id="sp-intermediate-card" style="display:none">
        <div class="card-header">📋 中间结果</div>
        <div class="card-body" id="sp-intermediate-body"></div>
      </div>
    `;

    document.getElementById('sp-input').addEventListener('input', () => {
      const lines = document.getElementById('sp-input').value.split('\n').length;
      document.getElementById('sp-input-status').textContent = `${lines} 行`;
    });
  },

  addStep() {
    const type = document.getElementById('sp-add-step-type').value;
    const id = ++this.stepIdCounter;
    const step = { id, type };
    this.steps.push(step);
    this.renderSteps();
  },

  removeStep(id) {
    this.steps = this.steps.filter(s => s.id !== id);
    this.renderSteps();
  },

  moveStep(id, direction) {
    const idx = this.steps.findIndex(s => s.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= this.steps.length) return;
    [this.steps[idx], this.steps[newIdx]] = [this.steps[newIdx], this.steps[idx]];
    this.renderSteps();
  },

  clearSteps() {
    this.steps = [];
    this.renderSteps();
  },

  clearInput() {
    document.getElementById('sp-input').value = '';
    document.getElementById('sp-input-status').textContent = '0 行';
    this.showToast('已清空');
  },

  getStepConfig(type) {
    switch (type) {
      case 'case': return `<select class="sp-case-mode">
        <option value="upper">大写 UPPER</option>
        <option value="lower">小写 lower</option>
        <option value="title">首字母大写 Title</option>
        <option value="camel">驼峰 camelCase</option>
        <option value="pascal">帕斯卡 PascalCase</option>
        <option value="snake">下划线 snake_case</option>
        <option value="kebab">连字符 kebab-case</option>
        <option value="constant">常量 CONSTANT_CASE</option>
        <option value="toggle">切换大小写 tOGGLE</option>
      </select>`;
      case 'wrap': return `<input class="sp-wrap-prefix" placeholder="前缀" style="width:80px">
        <input class="sp-wrap-suffix" placeholder="后缀" style="width:80px">
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'quote')">"</button>
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'paren')">()</button>
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'bracket')">[]</button>
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'brace')">{}</button>`;
      case 'join': return `<input class="sp-join-sep" placeholder="连接符" value="," style="width:80px">
        <span class="hint">每行用此连接符合并为一行</span>`;
      case 'split': return `<input class="sp-split-sep" placeholder="分隔符" value="," style="width:80px">
        <span class="hint">将每行按分隔符拆分为多行</span>`;
      case 'sort': return `<select class="sp-sort-mode">
        <option value="asc">升序 A→Z</option>
        <option value="desc">降序 Z→A</option>
        <option value="number-asc">数字升序 ↑</option>
        <option value="number-desc">数字降序 ↓</option>
        <option value="by-length">按长度排序</option>
        <option value="shuffle">随机打乱</option>
      </select>`;
      case 'reverse-lines': return `<span class="hint">反转整行顺序，最后一行变第一行</span>`;
      case 'unique': return `<span class="hint">去除重复行，仅保留首次出现的行</span>`;
      case 'trim': return `<span class="hint">去除每行首尾空白字符</span>`;
      case 'remove-empty': return `<span class="hint">删除所有空白行</span>`;
      case 'replace': return `<input class="sp-replace-find" placeholder="查找" style="width:100px">
        <input class="sp-replace-to" placeholder="替换为" style="width:100px">`;
      case 'regex-replace': return `<input class="sp-regex-pat" placeholder="正则" style="width:120px">
        <input class="sp-regex-to" placeholder="替换为" style="width:100px">
        <label><input type="checkbox" class="sp-regex-g" checked> g</label>
        <label><input type="checkbox" class="sp-regex-i"> i</label>`;
      case 'reverse-str': return `<span class="hint">反转每行内容，如 "abc" → "cba"</span>`;
      case 'line-number': return `<input class="sp-ln-fmt" placeholder="格式" value="{n}. {text}" style="width:200px">
        <span class="hint">{n}=行号，{text}=内容</span>`;
      case 'filter': return `<select class="sp-filter-mode">
        <option value="contain">包含</option>
        <option value="not-contain">不包含</option>
        <option value="regex">正则匹配</option>
        <option value="length-gte">长度 ≥</option>
        <option value="length-lte">长度 ≤</option>
      </select>
      <input class="sp-filter-value" placeholder="值" style="width:100px">`;
      case 'repeat': return `<input class="sp-repeat-n" type="number" value="2" min="1" style="width:60px">
        <span class="hint">每行重复 N 次</span>`;
      case 'base64-encode': return `<span class="hint">将文本进行 Base64 编码</span>`;
      case 'base64-decode': return `<span class="hint">将 Base64 解码为文本</span>`;
      case 'url-encode': return `<span class="hint">URL 编码</span>`;
      case 'url-decode': return `<span class="hint">URL 解码</span>`;
      case 'html-encode': return `<span class="hint">HTML 实体编码 (&lt; &gt; &amp; &quot;)</span>`;
      case 'html-decode': return `<span class="hint">HTML 实体解码</span>`;
      case 'escape': return `<select class="sp-escape-lang">
        <option value="js">JavaScript</option>
        <option value="java">Java</option>
        <option value="python">Python</option>
      </select>`;
      case 'unescape': return `<select class="sp-escape-lang">
        <option value="js">JavaScript</option>
        <option value="java">Java</option>
        <option value="python">Python</option>
      </select>`;
      case 'rot13': return `<span class="hint">ROT13 加密/解密（同一操作）</span>`;
      case 'prefix-suffix': return `<input class="sp-ps-prefix" placeholder="前缀" style="width:80px">
        <input class="sp-ps-suffix" placeholder="后缀" style="width:80px">`;
      case 'column-select': return `<input class="sp-cs-delim" placeholder="分隔符" value="," style="width:60px">
        <input class="sp-cs-cols" placeholder="列号" value="1" style="width:80px">
        <span class="hint">列号从1开始，如 1,2 或 1-3</span>`;
      default: return '';
    }
  },

  getStepLabel(type) {
    const labels = {
      'case': '🔤 大小写转换', 'wrap': '🎁 包裹', 'join': '🔗 行连接',
      'split': '✂️ 拆分', 'sort': '📋 排序', 'reverse-lines': '🔃 反转行顺序',
      'unique': '🧹 去重', 'trim': '✂️ 去除空格', 'remove-empty': '🗑️ 删除空行',
      'replace': '🔄 替换', 'regex-replace': '🔬 正则替换', 'reverse-str': '↩️ 反转内容',
      'line-number': '🔢 添加行号', 'filter': '🔍 过滤', 'repeat': '🔁 重复',
      'base64-encode': '🔏 Base64编码', 'base64-decode': '🔓 Base64解码',
      'url-encode': '🔗 URL编码', 'url-decode': '🔗 URL解码',
      'html-encode': '🌐 HTML编码', 'html-decode': '🌐 HTML解码',
      'escape': '↩️ 转义', 'unescape': '↩️ 反转义',
      'rot13': '🔄 ROT13', 'prefix-suffix': '📎 每行添加前缀后缀',
      'column-select': '📐 列提取'
    };
    return labels[type] || type;
  },

  renderSteps() {
    const container = document.getElementById('sp-steps-container');
    const emptyHint = document.getElementById('sp-empty-hint');
    document.getElementById('sp-step-count').textContent = `${this.steps.length} 步`;

    if (this.steps.length === 0) {
      container.innerHTML = `<div class="empty-state" id="sp-empty-hint">点击下方按钮添加处理步骤，从上到下依次执行</div>`;
      return;
    }

    let html = '';
    this.steps.forEach((step, idx) => {
      html += `
        <div class="sp-step" data-id="${step.id}">
          <div class="sp-step-header">
            <span class="sp-step-num">${idx + 1}.</span>
            <span class="sp-step-label">${this.getStepLabel(step.type)}</span>
            <div class="sp-step-actions">
              <button class="btn btn-xs" onclick="StringPipeline.moveStep(${step.id}, -1)" ${idx === 0 ? 'disabled' : ''}>↑</button>
              <button class="btn btn-xs" onclick="StringPipeline.moveStep(${step.id}, 1)" ${idx === this.steps.length - 1 ? 'disabled' : ''}>↓</button>
              <button class="btn btn-xs btn-danger" onclick="StringPipeline.removeStep(${step.id})">✕</button>
            </div>
          </div>
          <div class="sp-step-config">
            ${this.getStepConfig(step.type)}
          </div>
          <div class="sp-step-preview" id="sp-preview-${step.id}" style="display:none">
            <div class="sp-step-preview-header" onclick="StringPipeline.togglePreview(${step.id})">▶ 中间结果</div>
            <pre class="code-block light" style="max-height:150px;overflow:auto;font-size:11px" id="sp-preview-content-${step.id}"></pre>
          </div>
        </div>`;
    });

    container.innerHTML = html;
  },

  togglePreview(id) {
    const content = document.getElementById(`sp-preview-content-${id}`);
    const header = content?.previousElementSibling;
    if (!content || !header) return;
    if (content.style.display === 'none' || !content.style.display) {
      content.style.display = 'block';
      header.textContent = '▼ 中间结果';
    } else {
      content.style.display = 'none';
      header.textContent = '▶ 中间结果';
    }
  },

  setWrapPreset(btn, preset) {
    const config = btn.parentElement;
    const prefix = config.querySelector('.sp-wrap-prefix');
    const suffix = config.querySelector('.sp-wrap-suffix');
    const presets = {
      'quote': ['"', '"'], 'paren': ['(', ')'], 'bracket': ['[', ']'], 'brace': ['{', '}']
    };
    const [p, s] = presets[preset] || ['', ''];
    prefix.value = p;
    suffix.value = s;
  },

  /* ========== 执行管道 ========== */
  execute() {
    const input = document.getElementById('sp-input').value;
    if (!input.trim()) {
      this.showToast('请先输入文本');
      return;
    }

    let data = input;
    let allOutputs = [{ step: '原始输入', data }];
    let error = null;

    for (const step of this.steps) {
      try {
        data = this.processStep(step, data);
        allOutputs.push({ step: this.getStepLabel(step.type), data });
      } catch (e) {
        error = `步骤 ${this.getStepLabel(step.type)} 出错: ${e.message}`;
        this.showToast(error);
        break;
      }
    }

    // 显示最终输出
    const output = document.getElementById('sp-output');
    output.value = data;
    const lines = data.split('\n');
    document.getElementById('sp-output-status').textContent = `${lines.length} 行, ${data.length} 字符`;

    // 显示中间结果
    this.renderIntermediate(allOutputs, error);
  },

  processStep(step, data) {
    const type = step.type;
    const stepEl = document.querySelector(`.sp-step[data-id="${step.id}"]`);

    switch (type) {
      case 'case': {
        const mode = stepEl?.querySelector('.sp-case-mode')?.value || 'upper';
        return StringPipelineUtils.caseConvert(data, mode);
      }
      case 'wrap': {
        const prefix = stepEl?.querySelector('.sp-wrap-prefix')?.value || '';
        const suffix = stepEl?.querySelector('.sp-wrap-suffix')?.value || '';
        return data.split('\n').map(l => l.trim() ? prefix + l + suffix : l).join('\n');
      }
      case 'join': {
        const sep = stepEl?.querySelector('.sp-join-sep')?.value || ',';
        return data.split('\n').filter(l => l.trim()).join(sep);
      }
      case 'split': {
        const sep = stepEl?.querySelector('.sp-split-sep')?.value || ',';
        return data.split('\n').flatMap(l => l.trim() ? l.split(sep) : []).join('\n');
      }
      case 'sort': {
        const mode = stepEl?.querySelector('.sp-sort-mode')?.value || 'asc';
        return StringPipelineUtils.sortLines(data, mode);
      }
      case 'reverse-lines': {
        return data.split('\n').filter(l => l.trim()).reverse().join('\n');
      }
      case 'unique': {
        const seen = new Set();
        return data.split('\n').filter(l => {
          const t = l.trim();
          if (!t) return false;
          if (seen.has(t)) return false;
          seen.add(t);
          return true;
        }).join('\n');
      }
      case 'trim': {
        return data.split('\n').map(l => l.trim()).join('\n');
      }
      case 'remove-empty': {
        return data.split('\n').filter(l => l.trim()).join('\n');
      }
      case 'replace': {
        const find = stepEl?.querySelector('.sp-replace-find')?.value || '';
        const to = stepEl?.querySelector('.sp-replace-to')?.value || '';
        return data.replaceAll(find, to);
      }
      case 'regex-replace': {
        const pat = stepEl?.querySelector('.sp-regex-pat')?.value || '';
        const to = stepEl?.querySelector('.sp-regex-to')?.value || '';
        const g = stepEl?.querySelector('.sp-regex-g')?.checked;
        const i = stepEl?.querySelector('.sp-regex-i')?.checked;
        let flags = '';
        if (g) flags += 'g';
        if (i) flags += 'i';
        const regex = new RegExp(pat, flags);
        return data.replace(regex, to);
      }
      case 'reverse-str': {
        return data.split('\n').map(l => l.split('').reverse().join('')).join('\n');
      }
      case 'line-number': {
        const fmt = stepEl?.querySelector('.sp-ln-fmt')?.value || '{n}. {text}';
        return data.split('\n').map((l, i) => {
          return fmt.replace('{n}', String(i + 1)).replace('{text}', l);
        }).join('\n');
      }
      case 'filter': {
        const mode = stepEl?.querySelector('.sp-filter-mode')?.value || 'contain';
        const val = stepEl?.querySelector('.sp-filter-value')?.value || '';
        const lines = data.split('\n');
        return lines.filter(l => {
          switch (mode) {
            case 'contain': return l.includes(val);
            case 'not-contain': return !l.includes(val);
            case 'regex': return new RegExp(val).test(l);
            case 'length-gte': return l.length >= parseInt(val);
            case 'length-lte': return l.length <= parseInt(val);
            default: return true;
          }
        }).join('\n');
      }
      case 'repeat': {
        const n = parseInt(stepEl?.querySelector('.sp-repeat-n')?.value) || 2;
        return data.split('\n').flatMap(l => l.trim() ? Array(n).fill(l) : []).join('\n');
      }
      case 'base64-encode': {
        return btoa(unescape(encodeURIComponent(data)));
      }
      case 'base64-decode': {
        return decodeURIComponent(escape(atob(data)));
      }
      case 'url-encode': {
        return encodeURIComponent(data);
      }
      case 'url-decode': {
        return decodeURIComponent(data);
      }
      case 'html-encode': {
        return data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }
      case 'html-decode': {
        return data.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/');
      }
      case 'escape': {
        const lang = stepEl?.querySelector('.sp-escape-lang')?.value || 'js';
        return StringPipelineUtils.escapeStr(data, lang);
      }
      case 'unescape': {
        const lang = stepEl?.querySelector('.sp-escape-lang')?.value || 'js';
        return StringPipelineUtils.unescapeStr(data, lang);
      }
      case 'rot13': {
        return data.replace(/[a-zA-Z]/g, c => {
          const code = c.charCodeAt(0);
          const base = code >= 97 ? 97 : 65;
          return String.fromCharCode((code - base + 13) % 26 + base);
        });
      }
      case 'prefix-suffix': {
        const prefix = stepEl?.querySelector('.sp-ps-prefix')?.value || '';
        const suffix = stepEl?.querySelector('.sp-ps-suffix')?.value || '';
        return data.split('\n').map(l => l.trim() ? prefix + l + suffix : l).join('\n');
      }
      case 'column-select': {
        const delim = stepEl?.querySelector('.sp-cs-delim')?.value || ',';
        const colsStr = stepEl?.querySelector('.sp-cs-cols')?.value || '1';
        const cols = StringPipelineUtils.parseColumns(colsStr);
        return data.split('\n').map(line => {
          const cells = line.split(delim);
          return cols.map(c => (cells[c - 1] || '')).join(delim);
        }).join('\n');
      }
      default:
        return data;
    }
  },

  renderIntermediate(allOutputs, error) {
    const card = document.getElementById('sp-intermediate-card');
    const body = document.getElementById('sp-intermediate-body');
    card.style.display = 'block';

    let html = '';
    for (const item of allOutputs) {
      const lines = item.data.split('\n');
      const preview = lines.length > 10 ? lines.slice(0, 10).join('\n') + `\n... (共 ${lines.length} 行)` : item.data;
      html += `<div class="sp-intermediate-item">
        <div class="sp-intermediate-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <span>▶ ${item.step}</span>
          <span class="text-muted" style="font-size:11px">${lines.length} 行, ${item.data.length} 字符</span>
        </div>
        <pre class="code-block light" style="display:none;max-height:120px;overflow:auto;font-size:11px;margin-top:4px">${StringPipelineUtils.escapeHtml(preview)}</pre>
      </div>`;
    }
    if (error) {
      html += `<div class="sp-intermediate-item" style="border-left:3px solid #e74c3c">
        <div class="sp-intermediate-header" style="color:#e74c3c">⚠️ ${StringPipelineUtils.escapeHtml(error)}</div>
      </div>`;
    }
    body.innerHTML = html;
  },

  copyOutput() {
    const textarea = document.getElementById('sp-output');
    if (!textarea.value.trim()) return this.showToast('无内容可复制');
    navigator.clipboard.writeText(textarea.value).then(() => this.showToast('已复制'));
  },

  exportOutput() {
    const textarea = document.getElementById('sp-output');
    if (!textarea.value.trim()) return this.showToast('无内容可导出');
    const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'string-pipeline-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  },
};

/* ========== 工具函数 (分离以便复用) ========== */
const StringPipelineUtils = {
  caseConvert(input, mode) {
    switch (mode) {
      case 'upper': return input.toUpperCase();
      case 'lower': return input.toLowerCase();
      case 'title': return input.replace(/\b\w/g, c => c.toUpperCase());
      case 'camel':
        return input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toLowerCase());
      case 'pascal':
        return input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toUpperCase());
      case 'snake':
        return input.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/[-_\s]+/g, '_').replace(/^_/, '');
      case 'kebab':
        return input.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/[_\s]+/g, '-').replace(/^-/, '');
      case 'constant':
        return input.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/[-_\s]+/g, '_').replace(/^_/, '');
      case 'toggle':
        return input.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
      default: return input;
    }
  },

  sortLines(input, mode) {
    const lines = input.split('\n').filter(l => l.trim());
    switch (mode) {
      case 'asc': return lines.sort((a, b) => a.localeCompare(b)).join('\n');
      case 'desc': return lines.sort((a, b) => b.localeCompare(a)).join('\n');
      case 'number-asc': return lines.sort((a, b) => parseFloat(a) - parseFloat(b)).join('\n');
      case 'number-desc': return lines.sort((a, b) => parseFloat(b) - parseFloat(a)).join('\n');
      case 'by-length': return lines.sort((a, b) => b.length - a.length).join('\n');
      case 'shuffle': {
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        return lines.join('\n');
      }
      default: return input;
    }
  },

  parseColumns(str) {
    const parts = str.split(',');
    const cols = [];
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number);
        for (let i = s; i <= e; i++) cols.push(i);
      } else {
        cols.push(Number(trimmed));
      }
    }
    return cols.filter(n => !isNaN(n) && n > 0);
  },

  escapeStr(str, lang) {
    const map = {
      '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t',
      '"': '\\"', "'": "\\'",
    };
    if (lang === 'js') {
      map['`'] = '\\`';
      map['$'] = '\\$';
    }
    let result = '';
    for (const ch of str) {
      result += map[ch] || ch;
    }
    return result;
  },

  unescapeStr(str, lang) {
    return str.replace(/\\(.)/g, (_, c) => {
      const map = { 'n': '\n', 'r': '\r', 't': '\t', '0': '\0', '\\': '\\', '"': '"', "'": "'" };
      return map[c] || c;
    });
  },

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
};