const TextTools = {
  init() {
    this.renderColumnSelect();
    this.renderColumnProcess();
    this.renderStringWrap();
    this.renderStringJoin();
    this.renderLineGroup();
    this.renderCaseConvert();
    this.renderTextDiff();
    this.renderTextSort();
    this.renderRegexTester();
  },

  /* ========== 1. Column Select Mode ========== */
  renderColumnSelect() {
    document.getElementById('panel-col-select').innerHTML = `
      <div class="card">
        <div class="card-header">输入文本</div>
        <div class="card-body">
          <textarea id="cs-input" class="large" placeholder="每行输入数据，例如：&#10;张三,30,北京,工程师&#10;李四,25,上海,设计师&#10;王五,35,广州,产品经理"></textarea>
          <div class="status-bar" id="cs-status">0 行</div>
          <div class="btn-group mt-2">
            <input type="file" id="cs-file" accept=".csv,.tsv,.txt" style="display:none" onchange="TextTools.loadColumnSelectFile(event)">
            <button class="btn btn-sm" onclick="document.getElementById('cs-file').click()">📂 上传文件</button>
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">列设置</div>
          <div class="card-body">
            <div class="form-row">
              <label>列分隔符</label>
              <select id="cs-delimiter">
                <option value=",">逗号 ,</option>
                <option value="\t">制表符 Tab</option>
                <option value="|">竖线 |</option>
                <option value=" ">空格</option>
                <option value="custom">自定义</option>
              </select>
              <input type="text" id="cs-delimiter-custom" placeholder="自定义分隔符" style="display:none;width:120px">
            </div>
            <div class="form-row">
              <label>选定列</label>
              <input type="text" id="cs-columns" value="1" placeholder="如: 1,2,3 或 1-3" style="width:200px">
              <span class="hint">列号从 1 开始, 如 "1,2" 或 "1-3"</span>
            </div>
            <div class="form-row">
              <label>输出分隔符</label>
              <select id="cs-out-delimiter">
                <option value=",">逗号 ,</option>
                <option value="\t">制表符 Tab</option>
                <option value="|">竖线 |</option>
                <option value=" ">空格</option>
                <option value="custom">自定义</option>
              </select>
              <input type="text" id="cs-out-delimiter-custom" placeholder="自定义" style="display:none;width:120px">
            </div>
            <div class="btn-group">
              <button class="btn btn-primary" onclick="TextTools.doColumnSelect()">提取列</button>
              <button class="btn" onclick="TextTools.previewTable()">预览表格</button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出结果</div>
          <div class="card-body">
            <textarea id="cs-output" class="large" readonly placeholder="结果将显示在这里..."></textarea>
            <div class="status-bar" id="cs-out-status">0 行</div>
          </div>
        </div>
      </div>
      <div class="card" id="cs-table-preview" style="display:none">
        <div class="card-header">表格预览</div>
        <div class="card-body table-wrap" id="cs-table-body"></div>
      </div>
    `;

    document.getElementById('cs-delimiter').addEventListener('change', () => {
      const sel = document.getElementById('cs-delimiter');
      const custom = document.getElementById('cs-delimiter-custom');
      custom.style.display = sel.value === 'custom' ? 'inline-block' : 'none';
    });
    document.getElementById('cs-out-delimiter').addEventListener('change', () => {
      const sel = document.getElementById('cs-out-delimiter');
      const custom = document.getElementById('cs-out-delimiter-custom');
      custom.style.display = sel.value === 'custom' ? 'inline-block' : 'none';
    });
    document.getElementById('cs-input').addEventListener('input', () => this.updateLineCount('cs-input', 'cs-status'));
  },

  getDelimiter(selectId, customId) {
    const sel = document.getElementById(selectId).value;
    if (sel === 'custom') return document.getElementById(customId).value || ',';
    if (sel === '\t') return '\t';
    return sel;
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

  loadColumnSelectFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('cs-input').value = e.target.result;
      this.updateLineCount('cs-input', 'cs-status');
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  loadColumnProcessFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('cp-input').value = e.target.result;
      this.updateLineCount('cp-input', 'cp-status');
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  doColumnSelect() {
    const input = document.getElementById('cs-input').value;
    const delim = this.getDelimiter('cs-delimiter', 'cs-delimiter-custom');
    const outDelim = this.getDelimiter('cs-out-delimiter', 'cs-out-delimiter-custom');
    const cols = this.parseColumns(document.getElementById('cs-columns').value);

    if (!input.trim()) return showToast('请先输入文本');
    if (!cols.length) return showToast('请指定有效的列号');

    const lines = input.split('\n');
    const result = lines.map(line => {
      const cells = line.split(delim);
      return cols.map(c => (cells[c - 1] || '')).join(outDelim);
    });

    const output = document.getElementById('cs-output');
    output.value = result.join('\n');
    this.updateLineCountStatic('cs-out-status', result);
  },

  previewTable() {
    const input = document.getElementById('cs-input').value;
    const delim = this.getDelimiter('cs-delimiter', 'cs-delimiter-custom');

    if (!input.trim()) return showToast('请先输入文本');

    const lines = input.split('\n').filter(l => l.trim());
    const container = document.getElementById('cs-table-preview');
    const body = document.getElementById('cs-table-body');

    container.style.display = 'block';
    const header = lines[0].split(delim);
    const data = lines.slice(1).map(l => l.split(delim));

    let html = '<table><thead><tr>';
    header.forEach((h, i) => {
      html += `<th><span class="text-xs text-muted">#${i+1}</span> ${h.trim()}</th>`;
    });
    html += '</tr></thead><tbody>';
    data.slice(0, 50).forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell.trim()}</td>`;
      });
      html += '</tr>';
    });
    if (data.length > 50) {
      html += `<tr><td colspan="${header.length}" class="text-muted text-center">... 还有 ${data.length - 50} 行 ...</td></tr>`;
    }
    html += '</tbody></table>';
    body.innerHTML = html;
  },

  /* ========== 2. Column Process Mode ========== */
  renderColumnProcess() {
    document.getElementById('panel-col-process').innerHTML = `
      <div class="card">
        <div class="card-header">输入文本</div>
        <div class="card-body">
          <textarea id="cp-input" class="large" placeholder="每行数据，例如：&#10;张三,30,北京&#10;李四,25,上海&#10;王五,35,北京"></textarea>
          <div class="status-bar" id="cp-status">0 行</div>
          <div class="btn-group mt-2">
            <input type="file" id="cp-file" accept=".csv,.tsv,.txt" style="display:none" onchange="TextTools.loadColumnProcessFile(event)">
            <button class="btn btn-sm" onclick="document.getElementById('cp-file').click()">📂 上传文件</button>
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">处理设置</div>
          <div class="card-body">
            <div class="form-row">
              <label>分隔符</label>
              <select id="cp-delimiter">
                <option value=",">逗号 ,</option>
                <option value="\t">制表符 Tab</option>
                <option value="|">竖线 |</option>
                <option value="custom">自定义</option>
              </select>
              <input type="text" id="cp-delimiter-custom" placeholder="自定义" style="display:none;width:120px">
            </div>
            <div class="form-row">
              <label>目标列</label>
              <input type="text" id="cp-column" value="1" placeholder="列号从 1 开始" style="width:80px">
            </div>
            <div class="form-row">
              <label>操作</label>
              <select id="cp-operation">
                <option value="upper">转大写</option>
                <option value="lower">转小写</option>
                <option value="trim">去除空格</option>
                <option value="reverse">反转内容</option>
                <option value="prefix">添加前缀</option>
                <option value="suffix">添加后缀</option>
                <option value="replace">替换文本</option>
                <option value="sort-asc">排序 A-Z</option>
                <option value="sort-desc">排序 Z-A</option>
                <option value="unique">去重</option>
                <option value="filter-length">按长度过滤</option>
              </select>
            </div>
            <div class="form-row" id="cp-params" style="display:none">
              <label>参数</label>
              <div class="flex gap-2 items-center">
                <input type="text" id="cp-param-find" placeholder="查找" style="width:120px;display:none">
                <input type="text" id="cp-param-replace" placeholder="替换为" style="width:120px;display:none">
                <input type="text" id="cp-param-text" placeholder="文本" style="width:120px;display:none">
                <input type="number" id="cp-param-num" placeholder="长度" style="width:80px;display:none">
                <select id="cp-param-compare" style="display:none">
                  <option value="gte">≥</option>
                  <option value="lte">≤</option>
                  <option value="eq">=</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" onclick="TextTools.doColumnProcess()">执行处理</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出结果</div>
          <div class="card-body">
            <textarea id="cp-output" class="large" readonly placeholder="结果将显示在这里..."></textarea>
            <div class="status-bar" id="cp-out-status">0 行</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('cp-delimiter').addEventListener('change', () => {
      const sel = document.getElementById('cp-delimiter');
      const custom = document.getElementById('cp-delimiter-custom');
      custom.style.display = sel.value === 'custom' ? 'inline-block' : 'none';
    });
    document.getElementById('cp-operation').addEventListener('change', () => this.toggleCpParams());
    document.getElementById('cp-input').addEventListener('input', () => this.updateLineCount('cp-input', 'cp-status'));
  },

  toggleCpParams() {
    const op = document.getElementById('cp-operation').value;
    const params = document.getElementById('cp-params');
    const find = document.getElementById('cp-param-find');
    const replace = document.getElementById('cp-param-replace');
    const text = document.getElementById('cp-param-text');
    const num = document.getElementById('cp-param-num');
    const compare = document.getElementById('cp-param-compare');

    params.style.display = ['prefix', 'suffix', 'replace', 'filter-length'].includes(op) ? 'flex' : 'none';
    find.style.display = op === 'replace' ? 'inline-block' : 'none';
    replace.style.display = op === 'replace' ? 'inline-block' : 'none';
    text.style.display = ['prefix', 'suffix'].includes(op) ? 'inline-block' : 'none';
    num.style.display = op === 'filter-length' ? 'inline-block' : 'none';
    compare.style.display = op === 'filter-length' ? 'inline-block' : 'none';
  },

  doColumnProcess() {
    const input = document.getElementById('cp-input').value;
    const delim = this.getDelimiter('cp-delimiter', 'cp-delimiter-custom');
    const colIdx = parseInt(document.getElementById('cp-column').value) - 1;
    const op = document.getElementById('cp-operation').value;

    if (!input.trim()) return showToast('请先输入文本');

    const processCell = (cell) => {
      switch (op) {
        case 'upper': return cell.toUpperCase();
        case 'lower': return cell.toLowerCase();
        case 'trim': return cell.trim();
        case 'reverse': return cell.split('').reverse().join('');
        case 'prefix': {
          const p = document.getElementById('cp-param-text').value;
          return p + cell;
        }
        case 'suffix': {
          const s = document.getElementById('cp-param-text').value;
          return cell + s;
        }
        case 'replace': {
          const f = document.getElementById('cp-param-find').value;
          const r = document.getElementById('cp-param-replace').value;
          return cell.replaceAll(f, r);
        }
        default: return cell;
      }
    };

    let lines = input.split('\n');
    let result;

    if (['sort-asc', 'sort-desc', 'unique'].includes(op)) {
      const rows = lines.filter(l => l.trim()).map(l => l.split(delim));
      if (op === 'sort-asc') {
        rows.sort((a, b) => (a[colIdx] || '').localeCompare(b[colIdx] || ''));
      } else if (op === 'sort-desc') {
        rows.sort((a, b) => (b[colIdx] || '').localeCompare(a[colIdx] || ''));
      } else if (op === 'unique') {
        const seen = new Set();
        const uniq = [];
        for (const row of rows) {
          const key = row[colIdx] || '';
          if (!seen.has(key)) {
            seen.add(key);
            uniq.push(row);
          }
        }
        result = uniq.map(r => r.join(delim)).join('\n');
        document.getElementById('cp-output').value = result;
        this.updateLineCountStatic('cp-out-status', result.split('\n'));
        return;
      }
      result = rows.map(r => r.join(delim)).join('\n');
    } else if (op === 'filter-length') {
      const len = parseInt(document.getElementById('cp-param-num').value) || 0;
      const comp = document.getElementById('cp-param-compare').value;
      const rows = lines.filter(l => l.trim()).map(l => l.split(delim));
      const filtered = rows.filter(r => {
        const cellLen = (r[colIdx] || '').length;
        switch (comp) {
          case 'gte': return cellLen >= len;
          case 'lte': return cellLen <= len;
          case 'eq': return cellLen === len;
          default: return true;
        }
      });
      result = filtered.map(r => r.join(delim)).join('\n');
    } else {
      result = lines.map(line => {
        if (!line.trim()) return line;
        const cells = line.split(delim);
        if (cells[colIdx] !== undefined) {
          cells[colIdx] = processCell(cells[colIdx]);
        }
        return cells.join(delim);
      }).join('\n');
    }

    document.getElementById('cp-output').value = result;
    this.updateLineCountStatic('cp-out-status', result.split('\n'));
  },

  /* ========== 3. String Wrap ========== */
  renderStringWrap() {
    document.getElementById('panel-string-wrap').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="sw-input" class="large" placeholder="每行输入一个字符串..."></textarea>
            <div class="status-bar" id="sw-status">0 行</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="sw-output" class="large" readonly placeholder="结果将显示在这里..."></textarea>
            <div class="status-bar" id="sw-out-status">0 行</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">包裹设置 (StringUtils.wrap)</div>
        <div class="card-body">
          <div class="grid-3">
            <div class="form-row">
              <label>前缀</label>
              <input type="text" id="sw-prefix" value="" placeholder="如: (" style="width:100%">
            </div>
            <div class="form-row">
              <label>后缀</label>
              <input type="text" id="sw-suffix" value="" placeholder="如: )" style="width:100%">
            </div>
            <div class="form-row">
              <label>换行符</label>
              <select id="sw-newline">
                <option value="\n">LF (\n)</option>
                <option value="\r\n">CRLF (\r\n)</option>
                <option value=",">逗号 ,</option>
                <option value=", ">逗号+空格 , </option>
                <option value="none">无(合并一行)</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <label style="min-width:auto">跳过空行</label>
            <input type="checkbox" id="sw-skip-empty" checked>
          </div>
          <div class="btn-group mt-2">
            <button class="btn btn-primary" onclick="TextTools.doStringWrap()">包裹</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('quote')">引号</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('paren')">圆括号</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('bracket')">方括号</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('brace')">花括号</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('angle')">尖括号</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('html-div')">&lt;div&gt;标签</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('html-p')">&lt;p&gt;标签</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('single-quote')">单引号</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('backtick')">反引号</button>
            <button class="btn" onclick="TextTools.applyWrapPreset('sql')">SQL 引号</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('sw-input').addEventListener('input', () => this.updateLineCount('sw-input', 'sw-status'));
  },

  applyWrapPreset(preset) {
    const presets = {
      'quote': ['"', '"'],
      'single-quote': ["'", "'"],
      'paren': ['(', ')'],
      'bracket': ['[', ']'],
      'brace': ['{', '}'],
      'angle': ['<', '>'],
      'backtick': ['`', '`'],
      'html-div': ['<div>', '</div>'],
      'html-p': ['<p>', '</p>'],
      'sql': ["'", "'"],
    };
    const [prefix, suffix] = presets[preset] || ['', ''];
    document.getElementById('sw-prefix').value = prefix;
    document.getElementById('sw-suffix').value = suffix;
    this.doStringWrap();
  },

  doStringWrap() {
    const input = document.getElementById('sw-input').value;
    const prefix = document.getElementById('sw-prefix').value;
    const suffix = document.getElementById('sw-suffix').value;
    const newline = document.getElementById('sw-newline').value;
    const skipEmpty = document.getElementById('sw-skip-empty').checked;

    if (!input.trim()) return showToast('请先输入文本');

    let lines = input.split('\n');
    if (skipEmpty) lines = lines.filter(l => l.trim());

    let result;
    if (newline === 'none') {
      result = lines.map(l => prefix + l + suffix).join('');
    } else if (newline === ', ' || newline === ',') {
      result = lines.map(l => prefix + l + suffix).join(newline === ', ' ? ', ' : ',');
    } else {
      result = lines.map(l => prefix + l + suffix).join(newline);
    }

    document.getElementById('sw-output').value = result;
    this.updateLineCountStatic('sw-out-status', result.split('\n'));
  },

  /* ========== 4. String Join (列连接) ========== */
  renderStringJoin() {
    document.getElementById('panel-string-join').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入数据</div>
          <div class="card-body">
            <textarea id="sj-input" class="large" placeholder="每行输入数据，列间用分隔符分隔&#10;例如：&#10;张三,30,北京&#10;李四,25,上海"></textarea>
            <div class="status-bar" id="sj-status">0 行</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出结果</div>
          <div class="card-body relative">
            <textarea id="sj-output" class="large" readonly placeholder="结果将显示在这里..."></textarea>
            <div class="status-bar" id="sj-out-status">0 行</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">连接设置 (x,y) -&gt; x + 分隔符 + y</div>
        <div class="card-body">
          <div class="grid-3">
            <div class="form-row">
              <label>列分隔符</label>
              <select id="sj-delimiter">
                <option value=",">逗号 ,</option>
                <option value="\t">制表符 Tab</option>
                <option value="|">竖线 |</option>
                <option value=" ">空格</option>
                <option value="custom">自定义</option>
              </select>
              <input type="text" id="sj-delimiter-custom" placeholder="自定义" style="display:none;width:120px">
            </div>
            <div class="form-row">
              <label>选定列</label>
              <input type="text" id="sj-columns" value="1,2" placeholder="列号如: 1,2,3" style="width:200px">
              <span class="hint">列号从 1 开始</span>
            </div>
            <div class="form-row">
              <label>列间连接符</label>
              <input type="text" id="sj-join-str" value="、" placeholder="如: 、 或 - 或 +">
            </div>
          </div>
          <div class="form-row">
            <label style="min-width:auto">跳过空行</label>
            <input type="checkbox" id="sj-skip-empty" checked>
          </div>
          <div class="btn-group mt-2">
            <button class="btn btn-primary" onclick="TextTools.doStringJoin()">连接列</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('dun')">、顿号</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('comma')">, 逗号</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('hyphen')">- 连字符</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('plus')">+ 加号</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('slash')">/ 斜杠</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('arrow')">-> 箭头</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('space')">空格</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('dot')">. 点</button>
            <button class="btn" onclick="TextTools.applyJoinPreset('and')"> &amp; 和</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">模板连接 (高级)</div>
        <div class="card-body">
          <div class="form-row">
            <label>模板</label>
            <input type="text" id="sj-template" value="{1}、{2}" placeholder='如: {1}={2} 或 "{1}","{2}"' style="width:400px">
            <span class="hint">{1} 代表第1列, {2} 代表第2列, 以此类推</span>
          </div>
          <button class="btn btn-primary" onclick="TextTools.doStringJoinTemplate()">按模板连接</button>
        </div>
      </div>
    `;
    document.getElementById('sj-input').addEventListener('input', () => this.updateLineCount('sj-input', 'sj-status'));
    document.getElementById('sj-delimiter').addEventListener('change', () => {
      const sel = document.getElementById('sj-delimiter');
      const custom = document.getElementById('sj-delimiter-custom');
      custom.style.display = sel.value === 'custom' ? 'inline-block' : 'none';
    });
  },

  applyJoinPreset(preset) {
    const presets = {
      'dun': '、',
      'comma': ', ',
      'hyphen': ' - ',
      'plus': ' + ',
      'slash': '/',
      'arrow': ' -> ',
      'space': ' ',
      'dot': '.',
      'and': ' & ',
    };
    document.getElementById('sj-join-str').value = presets[preset] || '、';
    this.doStringJoin();
  },

  doStringJoin() {
    const input = document.getElementById('sj-input').value;
    const delim = this.getDelimiter('sj-delimiter', 'sj-delimiter-custom');
    const cols = this.parseColumns(document.getElementById('sj-columns').value);
    const joinStr = document.getElementById('sj-join-str').value;
    const skipEmpty = document.getElementById('sj-skip-empty').checked;

    if (!input.trim()) return showToast('请先输入文本');
    if (!cols.length) return showToast('请指定有效的列号');

    let lines = input.split('\n');
    if (skipEmpty) lines = lines.filter(l => l.trim());

    const result = lines.map(line => {
      const cells = line.split(delim);
      return cols.map(c => (cells[c - 1] || '')).join(joinStr);
    });

    document.getElementById('sj-output').value = result.join('\n');
    this.updateLineCountStatic('sj-out-status', result);
  },

  doStringJoinTemplate() {
    const input = document.getElementById('sj-input').value;
    const delim = this.getDelimiter('sj-delimiter', 'sj-delimiter-custom');
    const template = document.getElementById('sj-template').value;
    const skipEmpty = document.getElementById('sj-skip-empty').checked;

    if (!input.trim()) return showToast('请先输入文本');

    let lines = input.split('\n');
    if (skipEmpty) lines = lines.filter(l => l.trim());

    const result = lines.map(line => {
      const cells = line.split(delim);
      return template.replace(/\{(\d+)\}/g, (_, idx) => cells[parseInt(idx) - 1] || '');
    });

    document.getElementById('sj-output').value = result.join('\n');
    this.updateLineCountStatic('sj-out-status', result);
  },

  /* ========== 4.5. Line Grouping ========== */
  renderLineGroup() {
    document.getElementById('panel-line-group').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入文本</div>
          <div class="card-body">
            <textarea id="lg-input" class="large" placeholder="每行一个项目，例如：&#10;张三&#10;李四&#10;王五&#10;赵六&#10;钱七&#10;孙八&#10;周九&#10;吴十&#10;郑十一"></textarea>
            <div class="status-bar" id="lg-status">0 行</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出结果</div>
          <div class="card-body relative">
            <textarea id="lg-output" class="large" readonly placeholder="分组结果将显示在这里..."></textarea>
            <div class="status-bar" id="lg-out-status">0 行</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">分组设置</div>
        <div class="card-body">
          <div class="grid-3">
            <div class="form-row">
              <label>每组行数</label>
              <input type="number" id="lg-group-size" value="3" min="1" max="10000" style="width:100px">
            </div>
            <div class="form-row">
              <label>组内连接方式</label>
              <select id="lg-join-mode">
                <option value="keep">保持原始行</option>
                <option value="comma">逗号连接（,）</option>
                <option value="space">空格连接</option>
                <option value="tab">制表符连接（\\t）</option>
                <option value="custom">自定义连接符</option>
              </select>
              <input type="text" id="lg-join-custom" placeholder="自定义连接符" style="display:none;width:120px">
            </div>
            <div class="form-row">
              <label>组间分隔符</label>
              <select id="lg-group-sep">
                <option value="blank">空行分隔（\\n\\n）</option>
                <option value="newline">换行分隔（\\n）</option>
                <option value="custom">自定义分隔</option>
              </select>
              <input type="text" id="lg-group-sep-custom" placeholder="自定义分隔符" style="display:none;width:120px">
            </div>
          </div>
          <div class="option-group mt-2">
            <label><input type="checkbox" id="lg-number-groups"> 添加组编号（Group N: ...）</label>
            <label><input type="checkbox" id="lg-skip-empty"> 跳过空行</label>
          </div>
          <div class="btn-group mt-2">
            <button class="btn btn-primary" onclick="TextTools.doLineGroup()">执行分组</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('lg-input').addEventListener('input', () => this.updateLineCount('lg-input', 'lg-status'));
    document.getElementById('lg-join-mode').addEventListener('change', () => {
      const sel = document.getElementById('lg-join-mode');
      const custom = document.getElementById('lg-join-custom');
      custom.style.display = sel.value === 'custom' ? 'inline-block' : 'none';
    });
    document.getElementById('lg-group-sep').addEventListener('change', () => {
      const sel = document.getElementById('lg-group-sep');
      const custom = document.getElementById('lg-group-sep-custom');
      custom.style.display = sel.value === 'custom' ? 'inline-block' : 'none';
    });
  },

  doLineGroup() {
    const input = document.getElementById('lg-input').value;
    const groupSize = parseInt(document.getElementById('lg-group-size').value) || 3;
    const joinMode = document.getElementById('lg-join-mode').value;
    const joinCustom = document.getElementById('lg-join-custom').value;
    const groupSepMode = document.getElementById('lg-group-sep').value;
    const groupSepCustom = document.getElementById('lg-group-sep-custom').value;
    const numberGroups = document.getElementById('lg-number-groups').checked;
    const skipEmpty = document.getElementById('lg-skip-empty').checked;

    if (!input) return showToast('请先输入文本');
    if (groupSize < 1) return showToast('每组行数至少为 1');

    let lines = input.split('\n');
    if (skipEmpty) lines = lines.filter(l => l.trim() !== '');

    // 解析组内连接方式
    let joinStr;
    switch (joinMode) {
      case 'keep': joinStr = null; break;
      case 'comma': joinStr = ','; break;
      case 'space': joinStr = ' '; break;
      case 'tab': joinStr = '\t'; break;
      case 'custom': joinStr = joinCustom || ','; break;
      default: joinStr = null;
    }

    // 解析组间分隔符
    let groupSep;
    switch (groupSepMode) {
      case 'blank': groupSep = '\n\n'; break;
      case 'newline': groupSep = '\n'; break;
      case 'custom': groupSep = groupSepCustom || '\n\n'; break;
      default: groupSep = '\n\n';
    }

    // 分组处理
    const groups = [];
    for (let i = 0; i < lines.length; i += groupSize) {
      const chunk = lines.slice(i, i + groupSize);
      const groupContent = joinStr === null
        ? chunk.join('\n')
        : chunk.join(joinStr);

      if (numberGroups) {
        groups.push(`Group ${groups.length + 1}:${joinStr === null ? '\n' : ' '}${groupContent}`);
      } else {
        groups.push(groupContent);
      }
    }

    const output = groups.join(groupSep);
    document.getElementById('lg-output').value = output;
    this.updateLineCountStatic('lg-out-status', output.split('\n'));
  },

  /* ========== 5. Case Convert ========== */
  renderCaseConvert() {
    document.getElementById('panel-case-convert').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="cc-input" class="large" placeholder="输入要转换的文本..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="cc-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">转换选项</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn" onclick="TextTools.caseConvert('upper')">大写 UPPER</button>
            <button class="btn" onclick="TextTools.caseConvert('lower')">小写 lower</button>
            <button class="btn" onclick="TextTools.caseConvert('title')">首字母大写 Title Case</button>
            <button class="btn" onclick="TextTools.caseConvert('camel')">驼峰 camelCase</button>
            <button class="btn" onclick="TextTools.caseConvert('pascal')">帕斯卡 PascalCase</button>
            <button class="btn" onclick="TextTools.caseConvert('snake')">下划线 snake_case</button>
            <button class="btn" onclick="TextTools.caseConvert('kebab')">连字符 kebab-case</button>
            <button class="btn" onclick="TextTools.caseConvert('constant')">常量 CONSTANT_CASE</button>
            <button class="btn" onclick="TextTools.caseConvert('toggle')">切换大小写 tOGGLE</button>
          </div>
        </div>
      </div>
    `;
  },

  caseConvert(mode) {
    const input = document.getElementById('cc-input').value;
    if (!input) return showToast('请先输入文本');

    let result;
    switch (mode) {
      case 'upper':
        result = input.toUpperCase();
        break;
      case 'lower':
        result = input.toLowerCase();
        break;
      case 'title':
        result = input.replace(/\b\w/g, c => c.toUpperCase());
        break;
      case 'camel':
        result = input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
          .replace(/^(.)/, c => c.toLowerCase());
        break;
      case 'pascal':
        result = input.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
          .replace(/^(.)/, c => c.toUpperCase());
        break;
      case 'snake':
        result = input.replace(/([A-Z])/g, '_$1').toLowerCase()
          .replace(/[-_\s]+/g, '_').replace(/^_/, '');
        break;
      case 'kebab':
        result = input.replace(/([A-Z])/g, '-$1').toLowerCase()
          .replace(/[_\s]+/g, '-').replace(/^-/, '');
        break;
      case 'constant':
        result = input.replace(/([A-Z])/g, '_$1').toUpperCase()
          .replace(/[-_\s]+/g, '_').replace(/^_/, '');
        break;
      case 'toggle':
        result = input.split('').map(c =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        ).join('');
        break;
    }
    document.getElementById('cc-output').value = result;
  },

  /* ========== 6. Text Diff ========== */
  renderTextDiff() {
    document.getElementById('panel-text-diff').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">原文本 (A)</div>
          <div class="card-body">
            <textarea id="diff-a" class="large" placeholder="原始文本..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">新文本 (B)</div>
          <div class="card-body">
            <textarea id="diff-b" class="large" placeholder="修改后的文本..."></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span>差异对比</span>
          <button class="btn btn-sm" style="margin-left:auto" onclick="TextTools.swapDiff()">交换 A↔B</button>
        </div>
        <div class="card-body relative">
          <pre class="code-block light" id="diff-output" style="min-height:200px">点击下方按钮对比差异</pre>
        </div>
        <div class="card-body">
          <button class="btn btn-primary" onclick="TextTools.doTextDiff()">对比差异</button>
        </div>
      </div>
    `;
  },

  swapDiff() {
    const a = document.getElementById('diff-a');
    const b = document.getElementById('diff-b');
    [a.value, b.value] = [b.value, a.value];
    this.doTextDiff();
  },

  doTextDiff() {
    const a = document.getElementById('diff-a').value;
    const b = document.getElementById('diff-b').value;
    const linesA = a.split('\n');
    const linesB = b.split('\n');

    const lcs = (xs, ys) => {
      const m = xs.length, n = ys.length;
      const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
      for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
          dp[i][j] = xs[i-1] === ys[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
      const backtrack = (i, j) => {
        if (i === 0 && j === 0) return [];
        if (i > 0 && j > 0 && xs[i-1] === ys[j-1])
          return [...backtrack(i-1, j-1), {type: 'same', text: xs[i-1]}];
        if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j]))
          return [...backtrack(i, j-1), {type: 'add', text: ys[j-1]}];
        else
          return [...backtrack(i-1, j), {type: 'del', text: xs[i-1]}];
      };
      return backtrack(m, n);
    };

    const diff = lcs(linesA, linesB);
    let html = '';
    let added = 0, deleted = 0;
    for (const entry of diff) {
      const esc = text => text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      if (entry.type === 'same') {
        html += `<div style="padding:2px 8px">${esc(entry.text)}</div>`;
      } else if (entry.type === 'add') {
        html += `<div style="padding:2px 8px;background:#e6ffe6;color:#2a7a2a">+ ${esc(entry.text)}</div>`;
        added++;
      } else if (entry.type === 'del') {
        html += `<div style="padding:2px 8px;background:#ffe6e6;color:#c44">- ${esc(entry.text)}</div>`;
        deleted++;
      }
    }
    document.getElementById('diff-output').innerHTML = html +
      `<div class="status-bar" style="margin-top:8px"><span class="badge badge-success">+${added} 新增</span> <span class="badge badge-danger">-${deleted} 删除</span></div>`;
  },

  /* ========== 7. Sort / Dedup ========== */
  renderTextSort() {
    document.getElementById('panel-text-sort').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入文本</div>
          <div class="card-body">
            <textarea id="ts-input" class="large" placeholder="每行一个项目..."></textarea>
            <div class="status-bar" id="ts-status">0 行</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出结果</div>
          <div class="card-body relative">
            <textarea id="ts-output" class="large" readonly></textarea>
            <div class="status-bar" id="ts-out-status">0 行</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn" onclick="TextTools.sortLines('asc')">排序 A→Z</button>
            <button class="btn" onclick="TextTools.sortLines('desc')">排序 Z→A</button>
            <button class="btn" onclick="TextTools.sortLines('unique')">去重</button>
            <button class="btn" onclick="TextTools.sortLines('shuffle')">随机打乱</button>
            <button class="btn" onclick="TextTools.sortLines('reverse')">反转顺序</button>
            <button class="btn" onclick="TextTools.sortLines('trim')">去除两端空格</button>
            <button class="btn" onclick="TextTools.sortLines('remove-empty')">删除空行</button>
            <button class="btn" onclick="TextTools.sortLines('number-asc')">数字排序 ↑</button>
            <button class="btn" onclick="TextTools.sortLines('number-desc')">数字排序 ↓</button>
            <button class="btn" onclick="TextTools.sortLines('by-length')">按长度排序</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('ts-input').addEventListener('input', () => this.updateLineCount('ts-input', 'ts-status'));
  },

  sortLines(mode) {
    const input = document.getElementById('ts-input').value;
    if (!input.trim()) return showToast('请先输入文本');

    let lines = input.split('\n');
    let result;

    switch (mode) {
      case 'asc':
        result = lines.filter(l => l.trim()).sort((a, b) => a.localeCompare(b));
        break;
      case 'desc':
        result = lines.filter(l => l.trim()).sort((a, b) => b.localeCompare(a));
        break;
      case 'unique':
        result = [...new Set(lines.filter(l => l.trim()))];
        break;
      case 'shuffle':
        result = lines.filter(l => l.trim());
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        break;
      case 'reverse':
        result = lines.filter(l => l.trim()).reverse();
        break;
      case 'trim':
        result = lines.map(l => l.trim());
        break;
      case 'remove-empty':
        result = lines.filter(l => l.trim());
        break;
      case 'number-asc':
        result = lines.filter(l => l.trim()).sort((a, b) => parseFloat(a) - parseFloat(b));
        break;
      case 'number-desc':
        result = lines.filter(l => l.trim()).sort((a, b) => parseFloat(b) - parseFloat(a));
        break;
      case 'by-length':
        result = lines.filter(l => l.trim()).sort((a, b) => b.length - a.length);
        break;
    }

    document.getElementById('ts-output').value = result.join('\n');
    this.updateLineCountStatic('ts-out-status', result);
  },

  /* ========== 8. Regex Tester ========== */
  renderRegexTester() {
    document.getElementById('panel-regex').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">正则表达式</div>
          <div class="card-body">
            <div class="form-row">
              <input type="text" id="rx-pattern" placeholder="如: \\d+" style="width:100%;font-family:monospace">
            </div>
            <div class="form-row">
              <label>修饰符</label>
              <label><input type="checkbox" id="rx-flag-g" checked> g</label>
              <label><input type="checkbox" id="rx-flag-i"> i</label>
              <label><input type="checkbox" id="rx-flag-m"> m</label>
              <label><input type="checkbox" id="rx-flag-s"> s</label>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">测试文本</div>
          <div class="card-body">
            <textarea id="rx-text" class="large" placeholder="输入要匹配的文本..."></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">匹配结果</div>
        <div class="card-body relative">
          <pre class="code-block light" id="rx-output" style="min-height:120px">等待测试...</pre>
        </div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="TextTools.testRegex()">测试匹配</button>
            <button class="btn" onclick="TextTools.testRegexReplace()">替换</button>
            <input type="text" id="rx-replace" placeholder="替换文本" style="width:200px">
          </div>
        </div>
      </div>
    `;
  },

  testRegex() {
    const pattern = document.getElementById('rx-pattern').value;
    const text = document.getElementById('rx-text').value;
    if (!pattern) return showToast('请输入正则表达式');

    let flags = '';
    if (document.getElementById('rx-flag-g').checked) flags += 'g';
    if (document.getElementById('rx-flag-i').checked) flags += 'i';
    if (document.getElementById('rx-flag-m').checked) flags += 'm';
    if (document.getElementById('rx-flag-s').checked) flags += 's';

    try {
      const regex = new RegExp(pattern, flags);
      const matches = text.match(regex);
      const output = document.getElementById('rx-output');

      if (!matches) {
        output.textContent = '无匹配结果';
        return;
      }

      let result = `找到 ${matches.length} 个匹配:\n\n`;
      const allMatches = [...text.matchAll(new RegExp(pattern, flags.replace('g', '') + 'g'))];
      allMatches.forEach((m, i) => {
        result += `[${i}] = "${m[0]}"`;
        if (m.length > 1) {
          result += `\n     捕获组: ${m.slice(1).map((g, j) => `$${j+1}="${g||''}"`).join(', ')}`;
        }
        result += ` (位置: ${m.index})\n`;
      });
      output.textContent = result;
      output.style.whiteSpace = 'pre-wrap';
    } catch (e) {
      document.getElementById('rx-output').textContent = `正则错误: ${e.message}`;
    }
  },

  testRegexReplace() {
    const pattern = document.getElementById('rx-pattern').value;
    const text = document.getElementById('rx-text').value;
    const replace = document.getElementById('rx-replace').value;
    if (!pattern) return showToast('请输入正则表达式');

    let flags = '';
    if (document.getElementById('rx-flag-g').checked) flags += 'g';
    if (document.getElementById('rx-flag-i').checked) flags += 'i';
    if (document.getElementById('rx-flag-m').checked) flags += 'm';

    try {
      const regex = new RegExp(pattern, flags);
      const result = text.replace(regex, replace);
      document.getElementById('rx-output').textContent = result;
    } catch (e) {
      document.getElementById('rx-output').textContent = `替换错误: ${e.message}`;
    }
  },

  /* ========== Utility ========== */
  updateLineCount(inputId, statusId) {
    const input = document.getElementById(inputId);
    const lines = input.value.split('\n');
    document.getElementById(statusId).textContent = `${lines.length} 行, ${input.value.length} 字符`;
  },

  updateLineCountStatic(statusId, lines) {
    const text = Array.isArray(lines) ? lines.join('\n') : lines;
    document.getElementById(statusId).textContent = `${Array.isArray(lines) ? lines.length : text.split('\n').length} 行, ${text.length} 字符`;
  },

};
