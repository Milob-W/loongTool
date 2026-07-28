const StringPipeline = {
  steps: [],
  stepIdCounter: 0,
  peekLogs: [],
  parsedSource: null,
  savedLists: {},
  listNames: [],
  undoStack: [],
  redoStack: [],

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
        <div class="card-header">📥 1. 数据源</div>
        <div class="card-body">
          <div class="form-row">
            <label>源格式</label>
            <select id="sp-source-type" onchange="StringPipeline.onSourceTypeChange()">
              <option value="text">纯文本 (每行一项)</option>
              <option value="json">JSON</option>
              <option value="csv">CSV / TSV</option>
            </select>
          </div>
          <div id="sp-source-config">
            <div class="form-row" id="sp-json-config" style="display:none">
              <label>JSONPath</label>
              <input type="text" id="sp-json-path" value="$" placeholder="$ 或 $.users[*].name" style="width:100%;font-family:monospace">
              <span class="hint">$=根数组, $.users[*].name=提取每个用户的name</span>
            </div>
            <div class="form-row" id="sp-csv-config" style="display:none">
              <label>分隔符</label>
              <select id="sp-csv-delimiter">
                <option value=",">逗号 ,</option>
                <option value="\t">制表符 Tab</option>
                <option value="|">竖线 |</option>
                <option value="custom">自定义</option>
              </select>
              <input type="text" id="sp-csv-delimiter-custom" placeholder="自定义分隔符" style="display:none;width:80px">
              <label style="margin-left:0.5rem"><input type="checkbox" id="sp-csv-header" checked> 首行为表头</label>
            </div>
          </div>
          <textarea id="sp-input" class="large" placeholder="输入要处理的文本..."></textarea>
          <div class="status-bar" id="sp-input-status">0 行</div>
          <div class="btn-group mt-2">
            <button class="btn btn-sm btn-primary" onclick="StringPipeline.parseSource()">🔄 解析数据源</button>
            <button class="btn btn-sm" onclick="StringPipeline.clearInput()">❌ 清空</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span>⛓️ 处理管道</span>
          <span class="badge badge-info" id="sp-step-count">0 步</span>
          <div class="ml-auto" style="display:flex;gap:4px">
            <button class="btn btn-sm" onclick="StringPipeline.undo()" title="撤销 Ctrl+Z">↩</button>
            <button class="btn btn-sm" onclick="StringPipeline.redo()" title="重做">↪</button>
            <button class="btn btn-sm" onclick="StringPipeline.saveTemplate()">📦 保存模板</button>
            <button class="btn btn-sm" onclick="StringPipeline.loadTemplate()">📂 加载模板</button>
            <button class="btn btn-sm btn-primary" onclick="StringPipeline.execute()">▶️ 执行全部</button>
            <button class="btn btn-sm" onclick="StringPipeline.clearSteps()">🗑️ 清空</button>
          </div>
        </div>
        <div class="card-body" id="sp-steps-container">
          <div class="empty-state" id="sp-empty-hint">点击下方按钮添加处理步骤，从上到下依次执行</div>
        </div>
        <div class="card-body" style="border-top:1px solid var(--border)">
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center">
            <select id="sp-add-step-type" style="min-width:240px;font-size:0.8125rem">
              <optgroup label="🔤 大小写转换">
                <option value="case">全部转换 (upper/lower/camel…)</option>
                <option value="capitalize">首字母大写</option>
                <option value="decapitalize">首字母小写</option>
              </optgroup>
              <optgroup label="✏️ 编辑/变换">
                <option value="replace">替换文本</option>
                <option value="regex-replace">正则替换</option>
                <option value="template">模板映射</option>
                <option value="trim">去除两端空格</option>
                <option value="normalize-space">规范化空白</option>
                <option value="collapse-spaces">collapseSpaces 合并连续空格</option>
                <option value="expandtabs">展开制表符</option>
                <option value="squeeze">去除连续重复字符</option>
                <option value="translate">translate/tr 字符映射替换</option>
                <option value="remove-chars">removeChars 删除指定字符</option>
                <option value="retain-chars">retainChars 只保留指定字符</option>
                <option value="reverse-str">反转每行内容</option>
                <option value="reverse-words">反转单词顺序</option>
                <option value="shuffle-chars">打乱每行字符</option>
                <option value="repeat">重复行</option>
                <option value="substring">截取子串</option>
                <option value="substr">substr 起始+长度</option>
                <option value="insert">insert 在指定位置插入</option>
                <option value="replace-by-pos">replaceByPos 替换指定位置</option>
                <option value="truncate">截断到指定长度</option>
                <option value="truncate-words">按单词截断</option>
                <option value="pad">填充到指定长度</option>
                <option value="pad-zeros">零填充</option>
                <option value="center">居中对齐</option>
                <option value="indent">缩进</option>
                <option value="dedent">去除缩进</option>
                <option value="mask">遮盖部分字符</option>
                <option value="remove-quotes">去除引号</option>
                <option value="slugify">URL友好化</option>
                <option value="to-ascii">去除重音</option>
                <option value="replace-line-endings">换行符规范化</option>
                <option value="escape-regex">escapeRegExp 转义正则字符</option>
                <option value="strip-tags">strip_tags 去除HTML标签</option>
                <option value="format">format 格式化占位符</option>
              </optgroup>
              <optgroup label="🎁 包裹/前缀/后缀">
                <option value="wrap">包裹 (前缀+后缀)</option>
                <option value="prefix-suffix">每行添加前后缀</option>
                <option value="strip-prefix">去除前缀</option>
                <option value="strip-suffix">去除后缀</option>
                <option value="ensure-prefix">确保前缀</option>
                <option value="ensure-suffix">确保后缀</option>
              </optgroup>
              <optgroup label="🔍 过滤/排序/选择">
                <option value="filter">按条件过滤</option>
                <option value="partition">按条件分为两组</option>
                <option value="take-while">TakeWhile 条件保留</option>
                <option value="drop-while">DropWhile 条件丢弃</option>
                <option value="sort">排序</option>
                <option value="unique">去重</option>
                <option value="remove-empty">删除空行</option>
                <option value="limit">Limit 截取前N行</option>
                <option value="last">取后N行</option>
                <option value="skip">Skip 跳过前N行</option>
                <option value="sample">随机抽样</option>
                <option value="pick">按序号选取行</option>
                <option value="reverse-lines">反转行顺序</option>
                <option value="line-number">添加行号</option>
                <option value="extract">正则提取</option>
                <option value="words">words 拆分为单词</option>
                <option value="is-title-case">isTitleCase 标题大小写</option>
              </optgroup>
              <optgroup label="📦 聚合/展开/分批">
                <option value="join">行连接为一行</option>
                <option value="flatten">全部合并为一行</option>
                <option value="split">按分隔符拆分为多行</option>
                <option value="split-lines">splitlines 智能拆分</option>
                <option value="reduce">Reduce 归约</option>
                <option value="groupby">GroupBy 分组</option>
                <option value="batch">分批 (每N行一组)</option>
                <option value="chunk">拆分为固定长度块</option>
                <option value="interleave">交错插入</option>
                <option value="zip">交错合并两个列表</option>
                <option value="word-wrap">按单词换行</option>
              </optgroup>
              <optgroup label="📊 统计/频率">
                <option value="count-occ">统计子串出现次数</option>
                <option value="length">length 每行长度</option>
                <option value="word-count">wordCount 每行单词数</option>
                <option value="frequency">频率统计</option>
                <option value="top">按频率取前N</option>
                <option value="common-prefix">commonPrefix 公共前缀</option>
                <option value="common-suffix">commonSuffix 公共后缀</option>
              </optgroup>
              <optgroup label="🔐 编码/解码/哈希">
                <option value="base64-encode">Base64 编码</option>
                <option value="base64-decode">Base64 解码</option>
                <option value="url-encode">URL 编码</option>
                <option value="url-decode">URL 解码</option>
                <option value="html-encode">HTML 编码</option>
                <option value="html-decode">HTML 解码</option>
                <option value="encode-hex">Hex 编码</option>
                <option value="decode-hex">Hex 解码</option>
                <option value="escape">字符串转义</option>
                <option value="unescape">字符串反转义</option>
                <option value="json-escape">JSON 转义</option>
                <option value="json-unescape">JSON 反转义</option>
                <option value="unicode-escape">Unicode 转义</option>
                <option value="rot13">ROT13</option>
                <option value="hash">哈希计算</option>
              </optgroup>
              <optgroup label="📐 结构化">
                <option value="column-select">列提取</option>
              </optgroup>
              <optgroup label="👁️ 调试">
                <option value="peek">Peek 窥视</option>
                <option value="load">📂 加载列表 (load)</option>
              </optgroup>
              <optgroup label="🏛️ Commons/Spring StringUtils">
                <option value="delete-whitespace">deleteWhitespace 删除所有空白</option>
                <option value="trim-leading">trimLeadingWhitespace 去除开头空白</option>
                <option value="trim-trailing">trimTrailingWhitespace 去除结尾空白</option>
                <option value="strip-start">stripStart 去除开头指定字符</option>
                <option value="strip-end">stripEnd 去除结尾指定字符</option>
                <option value="replace-once">replaceOnce 只替换第一次</option>
                <option value="replace-each">replaceEach 批量替换</option>
                <option value="overlay">overlay 覆盖字符串</option>
                <option value="rotate">rotate 循环移位</option>
                <option value="reverse-delimited">reverseDelimited 按分隔符反转</option>
                <option value="chomp">chomp 去除末尾换行</option>
                <option value="chop">chop 去除末尾字符</option>
                <option value="left">left 取左边N个字符</option>
                <option value="right">right 取右边N个字符</option>
                <option value="mid">mid 取中间N个字符</option>
                <option value="substring-before">substringBefore 取分隔符前</option>
                <option value="substring-after">substringAfter 取分隔符后</option>
                <option value="substring-between">substringBetween 取分隔符之间</option>
                <option value="unwrap">unwrap 去除包裹</option>
                <option value="default-if-blank">defaultIfBlank 空值默认</option>
                <option value="unqualify">unqualify 去限定名</option>
                <option value="simple-match">simpleMatch 通配符匹配过滤</option>
                <option value="contains-any">containsAny 包含任意字符</option>
                <option value="contains-none">containsNone 不包含任意字符</option>
                <option value="contains-only">containsOnly 只包含指定字符</option>
                <option value="is-alpha">isAlpha 仅字母行</option>
                <option value="is-numeric">isNumeric 仅数字行</option>
                <option value="is-alphanumeric">isAlphanumeric 仅字母数字行</option>
                <option value="is-all-lower">isAllLowerCase 全小写行</option>
                <option value="is-all-upper">isAllUpperCase 全大写行</option>
                <option value="ordinal-index-of">ordinalIndexOf 第N次出现位置</option>
              </optgroup>
              <optgroup label="🔗 列表/集合运算">
                <option value="comm">comm 两列表比对</option>
                <option value="dedupe-consecutive">dedupe 去除连续重复行</option>
                <option value="lookup">lookup 字典映射</option>
                <option value="window">window 滑动窗口</option>
              </optgroup>
              <optgroup label="📊 聚合/透视">
                <option value="accumulate">accumulate 累积</option>
                <option value="count">count 聚合统计</option>
                <option value="pivot">pivot 行转列</option>
                <option value="unpivot">unpivot 列转行</option>
              </optgroup>
              <optgroup label="🔬 正则/检测">
                <option value="regex-test">regex-test 正则检测</option>
              </optgroup>
              <optgroup label="📐 其他变换">
                <option value="fold">fold 固定宽度折行</option>
                <option value="unexpand">unexpand 空格转制表符</option>
                <option value="note">📝 步骤注释</option>
              </optgroup>
              <optgroup label="🔢 数值/序列">
                <option value="math">🔢 数值运算</option>
                <option value="generate">🔢 生成序列</option>
              </optgroup>
              <optgroup label="🔗 多列表交互">
                <option value="vlookup">vlookup 跨列表匹配</option>
              </optgroup>
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

      <div class="card" id="sp-saved-card">
        <div class="card-header">
          <span>📂 暂存列表</span>
          <span class="badge badge-info" id="sp-saved-count">0</span>
          <div class="ml-auto" style="display:flex;gap:4px">
            <button class="btn btn-sm" onclick="StringPipeline.clearSaved()">🗑️ 清空全部</button>
          </div>
        </div>
        <div class="card-body" id="sp-saved-body">
          <div class="empty-state">使用管道中的"💾 保存为"步骤暂存中间结果</div>
        </div>
      </div>

      <div class="card" id="sp-intermediate-card" style="display:none">
        <div class="card-header">📋 中间结果 & 日志</div>
        <div class="card-body" id="sp-intermediate-body"></div>
      </div>
    `;

    document.getElementById('sp-input').addEventListener('input', () => {
      const lines = document.getElementById('sp-input').value.split('\n').length;
      document.getElementById('sp-input-status').textContent = `${lines} 行`;
    });
    document.getElementById('sp-csv-delimiter').addEventListener('change', () => {
      const sel = document.getElementById('sp-csv-delimiter');
      const custom = document.getElementById('sp-csv-delimiter-custom');
      if (custom) custom.style.display = sel.value === 'custom' ? 'inline-block' : 'none';
    });
  },

  addStep() {
    const type = document.getElementById('sp-add-step-type').value;
    const id = ++this.stepIdCounter;
    this.pushUndo();
    this.steps.push({ id, type });
    this.renderSteps();
  },

  removeStep(id) {
    this.pushUndo();
    this.steps = this.steps.filter(s => s.id !== id);
    this.renderSteps();
  },

  moveStep(id, direction) {
    const idx = this.steps.findIndex(s => s.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= this.steps.length) return;
    this.pushUndo();
    [this.steps[idx], this.steps[newIdx]] = [this.steps[newIdx], this.steps[idx]];
    this.renderSteps();
  },

  clearSteps() {
    this.pushUndo();
    this.steps = [];
    this.renderSteps();
  },
  /* ===== 撤销/重做 ===== */
  pushUndo() {
    if (this.steps.length > 0 || this.undoStack.length === 0) {
      this.undoStack.push(JSON.parse(JSON.stringify(this.steps)));
    }
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  },
  undo() {
    if (this.undoStack.length === 0) { this.showToast('没有可撤销的操作'); return; }
    this.redoStack.push(JSON.parse(JSON.stringify(this.steps)));
    this.steps = this.undoStack.pop();
    this.renderSteps();
    this.showToast('已撤销');
  },
  redo() {
    if (this.redoStack.length === 0) { this.showToast('没有可重做的操作'); return; }
    this.undoStack.push(JSON.parse(JSON.stringify(this.steps)));
    this.steps = this.redoStack.pop();
    this.renderSteps();
    this.showToast('已重做');
  },
  /* ===== 管道模板 ===== */
  saveTemplate() {
    const cfg = JSON.stringify({ steps: this.steps.map(s => ({ type: s.type })) }, null, 2);
    const blob = new Blob([cfg], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pipeline-template.json'; a.click();
    URL.revokeObjectURL(url);
    this.showToast('模板已导出');
  },
  loadTemplate() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const cfg = JSON.parse(ev.target.result);
          if (!cfg.steps || !Array.isArray(cfg.steps)) { this.showToast('无效的模板文件'); return; }
          this.pushUndo();
          this.steps = cfg.steps.map(s => ({ ...s, id: ++this.stepIdCounter }));
          this.renderSteps();
          this.showToast(`已加载模板: ${cfg.steps.length} 步`);
        } catch (e) { this.showToast('模板解析失败: '+e.message); }
      };
      reader.readAsText(file);
    };
    input.click();
  },
  clearInput() {
    document.getElementById('sp-input').value = '';
    document.getElementById('sp-input-status').textContent = '0 行';
    this.showToast('已清空');
  },
  /* ===== 暂存列表管理 ===== */
  getListNames() { return Object.keys(this.savedLists); },
  getListData(name) { return this.savedLists[name]; },
  saveList(name, data) {
    if (!name.trim()) { this.showToast('请输入保存名称'); return; }
    this.savedLists[name.trim()] = data;
    this.renderSavedLists();
    this.populateSavedRefs();
    this.showToast(`已保存: ${name.trim()} (${data.split('\n').length} 行)`);
  },
  loadList(name) {
    const data = this.savedLists[name];
    if (data === undefined) { this.showToast(`未找到列表: ${name}`); return null; }
    return data;
  },
  clearSaved() {
    if (Object.keys(this.savedLists).length === 0) return;
    if (!confirm('确认清空所有暂存列表？')) return;
    this.savedLists = {};
    this.renderSavedLists();
    this.populateSavedRefs();
    this.showToast('已清空全部暂存列表');
  },
  deleteSaved(name) {
    delete this.savedLists[name];
    this.renderSavedLists();
    this.populateSavedRefs();
  },
  renderSavedLists() {
    const body = document.getElementById('sp-saved-body');
    const count = document.getElementById('sp-saved-count');
    if (!body) return;
    const names = this.getListNames();
    count.textContent = String(names.length);
    if (names.length === 0) {
      body.innerHTML = '<div class="empty-state">执行管道后，每一步的中间结果会自动暂存到这里</div>';
      return;
    }
    let html = '';
    for (const name of names) {
      const data = this.savedLists[name];
      const lines = data.split('\n');
      const preview = lines.length > 5 ? lines.slice(0,5).join('\n') + `\n...` : data;
      html += `<div class="sp-saved-item">
        <div class="sp-saved-header">
          <span class="sp-saved-name" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">📁 ${name}</span>
          <span class="text-muted" style="font-size:11px">${lines.length} 行, ${data.length} 字符</span>
          <button class="btn btn-xs" onclick="StringPipeline.copySaved('${name}')">📋</button>
          <button class="btn btn-xs" onclick="StringPipeline.exportSaved('${name}')">💾</button>
          <button class="btn btn-xs btn-danger" onclick="StringPipeline.deleteSaved('${name}')">✕</button>
        </div>
        <pre class="code-block light" style="display:none;max-height:100px;overflow:auto;font-size:11px;margin-top:4px">${StringPipelineUtils.escapeHtml(preview)}</pre>
      </div>`;
    }
    body.innerHTML = html;
  },
  copySaved(name) {
    const data = this.savedLists[name];
    if (!data) return;
    navigator.clipboard.writeText(data).then(() => this.showToast(`已复制: ${name}`));
  },
  exportSaved(name) {
    const data = this.savedLists[name];
    if (!data) return;
    const blob = new Blob([data], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name.replace(/[/\\?%*:|"<>]/g,'_') + '.txt'; a.click();
    URL.revokeObjectURL(url);
    this.showToast(`已导出: ${name}.txt`);
  },
  populateSavedRefs() {
    const names = this.getListNames();
    document.querySelectorAll('.sp-comm-ref, .sp-zip-ref, .sp-lookup-ref, .sp-load-name, .sp-vl-ref').forEach(sel => {
      const current = sel.value;
      sel.innerHTML = '<option value="">-- 选择暂存列表 --</option>' +
        names.map(n => `<option value="${n}" ${n===current?'selected':''}>${n}</option>`).join('');
    });
  },
  onCommRefChange(sel, prefix) {
    const ref = sel.value;
    const container = sel.parentElement;
    const textarea = container.querySelector('.sp-comm-list, .sp-zip-data, .sp-lookup-map');
    if (textarea) textarea.style.display = ref ? 'none' : '';
  },
  getRefOrTextarea(step, selector, refSelector) {
    const refEl = document.querySelector(`.sp-step[data-id="${step.id}"]`)?.querySelector(refSelector);
    if (refEl && refEl.value) {
      const data = this.loadList(refEl.value);
      if (data) return data;
    }
    const ta = document.querySelector(`.sp-step[data-id="${step.id}"]`)?.querySelector(selector);
    return ta?.value || '';
  },
  getCSVDelimiter() {
    const sel = document.getElementById('sp-csv-delimiter').value;
    if (sel === 'custom') return document.getElementById('sp-csv-delimiter-custom').value || ',';
    if (sel === '\t') return '\t';
    return sel;
  },
  onSourceTypeChange() {
    const type = document.getElementById('sp-source-type').value;
    document.getElementById('sp-json-config').style.display = type === 'json' ? 'flex' : 'none';
    document.getElementById('sp-csv-config').style.display = type === 'csv' ? 'flex' : 'none';
    this.parsedSource = null;
  },
  setParsedSource(text) {
    this.parsedSource = text;
    document.getElementById('sp-input-status').textContent = `${text.split('\n').length} 行 (已解析)`;
    this.showToast('解析完成');
  },
  parseSource() {
    const raw = document.getElementById('sp-input').value;
    if (!raw.trim()) { this.showToast('请先输入数据'); return; }
    const type = document.getElementById('sp-source-type').value;
    try {
      if (type === 'json') return this.parseJSONSource(raw);
      if (type === 'csv') return this.parseCSVSource(raw);
      // text mode: use raw as-is
      this.setParsedSource(raw);
    } catch (e) {
      this.showToast('解析失败: ' + e.message);
    }
  },
  parseJSONSource(raw) {
    const data = JSON.parse(raw);
    let items;
    if (Array.isArray(data)) {
      items = data;
    } else {
      const path = document.getElementById('sp-json-path').value.trim();
      if (path && path !== '$') {
        items = StringPipelineUtils.resolveJSONPath(data, path);
      } else {
        // Try to find the first array in the object
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) { items = data[key]; break; }
        }
        if (!items) items = [data];
      }
    }
    if (!Array.isArray(items)) items = [items];
    // Convert each item to string (JSON if object, otherwise toString)
    const lines = items.map(item =>
      typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)
    );
    this.setParsedSource(lines.join('\n'));
  },
  parseCSVSource(raw) {
    const delimiter = this.getCSVDelimiter();
    const hasHeader = document.getElementById('sp-csv-header').checked;
    const rows = raw.split('\n').filter(l => l.trim());
    if (rows.length === 0) { this.setParsedSource(''); return; }
    const parseRow = (row) => {
      const result = []; let cur = '', inQ = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === delimiter && !inQ) { result.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      result.push(cur.trim());
      return result;
    };
    const parsed = rows.map(parseRow);
    if (hasHeader && parsed.length > 0) {
      const header = parsed[0];
      const data = parsed.slice(1);
      this.setParsedSource(data.map(row =>
        row.map((cell, i) => `${header[i] || 'Col'+(i+1)}:${cell}`).join(', ')
      ).join('\n'));
    } else {
      this.setParsedSource(parsed.map(row => row.join(delimiter)).join('\n'));
    }
  },

  getStepConfig(type) {
    const cfg = {
      case: `<select class="sp-case-mode">
        <option value="upper">大写 UPPER</option><option value="lower">小写 lower</option>
        <option value="title">首字母大写 Title</option><option value="camel">驼峰 camelCase</option>
        <option value="pascal">帕斯卡 PascalCase</option><option value="snake">下划线 snake_case</option>
        <option value="kebab">连字符 kebab-case</option><option value="constant">常量 CONSTANT_CASE</option>
        <option value="toggle">切换大小写 tOGGLE</option></select>`,
      capitalize: `<span class="hint">每行首字母大写，其余小写</span>`,
      decapitalize: `<span class="hint">每行首字母小写，其余不变</span>`,
      wrap: `<input class="sp-wrap-prefix" placeholder="前缀" style="width:80px"><input class="sp-wrap-suffix" placeholder="后缀" style="width:80px">
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'quote')">"</button>
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'paren')">()</button>
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'bracket')">[]</button>
        <button class="btn btn-xs" onclick="StringPipeline.setWrapPreset(this,'brace')">{}</button>`,
      'prefix-suffix': `<input class="sp-ps-prefix" placeholder="前缀" style="width:80px"><input class="sp-ps-suffix" placeholder="后缀" style="width:80px">`,
      'strip-prefix': `<input class="sp-strip-p" placeholder="要去除的前缀" style="width:120px">`,
      'strip-suffix': `<input class="sp-strip-s" placeholder="要去除的后缀" style="width:120px">`,
      'ensure-prefix': `<input class="sp-ensure-p" placeholder="前缀" value="https://" style="width:120px"><span class="hint">没有则加</span>`,
      'ensure-suffix': `<input class="sp-ensure-s" placeholder="后缀" value=".com" style="width:80px"><span class="hint">没有则加</span>`,
      join: `<input class="sp-join-sep" placeholder="连接符" value="," style="width:80px"><span class="hint">每行连接为一行</span>`,
      flatten: `<span class="hint">将所有行合并为一行，用空格连接</span>`,
      split: `<input class="sp-split-sep" placeholder="分隔符" value="," style="width:80px"><span class="hint">每行按分隔符拆为多行</span>`,
      sort: `<select class="sp-sort-mode">
        <option value="asc">升序 A→Z</option><option value="desc">降序 Z→A</option>
        <option value="number-asc">数字升序 ↑</option><option value="number-desc">数字降序 ↓</option>
        <option value="by-length">按长度排序</option><option value="natural">自然排序</option>
        <option value="shuffle">随机打乱</option></select>`,
      'reverse-lines': `<span class="hint">反转整行顺序，最后一行变第一行</span>`,
      unique: `<span class="hint">去除重复行，仅保留首次出现的行</span>`,
      trim: `<span class="hint">去除每行首尾空白字符</span>`,
      'normalize-space': `<span class="hint">合并连续空格为单个空格，去除首尾空白</span>`,
      expandtabs: `<input class="sp-expand-size" type="number" value="4" min="1" style="width:60px"><span class="hint">每个制表符替换为N个空格</span>`,
      squeeze: `<input class="sp-squeeze-char" placeholder="字符(留空=所有)" style="width:80px"><span class="hint">去除连续重复字符(如 aa→a)</span>`,
      'remove-empty': `<span class="hint">删除所有空白行</span>`,
      replace: `<input class="sp-replace-find" placeholder="查找" style="width:100px"><input class="sp-replace-to" placeholder="替换为" style="width:100px">`,
      'regex-replace': `<input class="sp-regex-pat" placeholder="正则" style="width:120px"><input class="sp-regex-to" placeholder="替换为" style="width:100px">
        <label><input type="checkbox" class="sp-regex-g" checked> g</label><label><input type="checkbox" class="sp-regex-i"> i</label>`,
      'reverse-str': `<span class="hint">反转每行内容，如 "abc" → "cba"</span>`,
      'reverse-words': `<span class="hint">反转每行单词顺序，如 "a b c" → "c b a"</span>`,
      'shuffle-chars': `<span class="hint">随机打乱每行中的字符顺序</span>`,
      'line-number': `<input class="sp-ln-fmt" placeholder="格式" value="{n}. {text}" style="width:200px"><span class="hint">{n}=行号，{text}=内容</span>`,
      filter: `<select class="sp-filter-mode">
        <option value="contain">包含</option><option value="not-contain">不包含</option>
        <option value="starts-with">开头是</option><option value="ends-with">结尾是</option>
        <option value="equals">等于</option><option value="regex">正则匹配</option>
        <option value="length-gte">长度 ≥</option><option value="length-lte">长度 ≤</option>
        <option value="is-blank">是空白</option><option value="not-blank">非空白</option></select>
      <input class="sp-filter-value" placeholder="值" style="width:100px">`,
      partition: `<select class="sp-partition-mode">
        <option value="contain">包含</option><option value="regex">正则匹配</option>
        <option value="length-gte">长度 ≥</option></select>
      <input class="sp-partition-val" placeholder="值" style="width:100px"><span class="hint">匹配组在前，不匹配在后</span>`,
      'take-while': `<input class="sp-tw-pattern" placeholder="条件(如 包含hello)" style="width:140px">
        <select class="sp-tw-mode"><option value="contain">包含</option><option value="not-contain">不包含</option>
        <option value="starts-with">开头是</option><option value="regex">正则</option></select>
        <span class="hint">保留满足条件的行直到第一个不满足</span>`,
      'drop-while': `<input class="sp-dw-pattern" placeholder="条件" style="width:140px">
        <select class="sp-dw-mode"><option value="contain">包含</option><option value="starts-with">开头是</option>
        <option value="regex">正则</option></select>
        <span class="hint">丢弃满足条件的行直到第一个不满足</span>`,
      repeat: `<input class="sp-repeat-n" type="number" value="2" min="1" style="width:60px"><span class="hint">每行重复 N 次</span>`,
      limit: `<input class="sp-limit-n" type="number" value="10" min="1" style="width:70px"><span class="hint">保留前 N 行</span>`,
      last: `<input class="sp-last-n" type="number" value="5" min="1" style="width:70px"><span class="hint">取最后 N 行</span>`,
      skip: `<input class="sp-skip-n" type="number" value="1" min="0" style="width:70px"><span class="hint">跳过前 N 行</span>`,
      sample: `<input class="sp-sample-n" type="number" value="5" min="1" style="width:70px"><span class="hint">随机抽取 N 行</span>`,
      pick: `<input class="sp-pick-range" placeholder="范围" value="1-5" style="width:100px"><span class="hint">如 1-5, 或 1,3,5</span>`,
      peek: `<span class="hint">👁️ 窥视: 执行到此步时将中间数据显示在日志中</span>`,
      load: `<select class="sp-load-name"></select><span class="hint">加载之前保存的列表数据到当前管道</span>`,
      groupby: `<select class="sp-groupby-mode">
        <option value="firstChar">首字母分组</option><option value="length">按长度分组</option>
        <option value="exact">精确匹配分组</option></select>`,
      reduce: `<select class="sp-reduce-op" onchange="StringPipeline.toggleReduceConfig(this)">
        <option value="join">Join 连接</option><option value="count">Count 计数</option>
        <option value="sum">Sum 求和</option><option value="min">Min 最小值</option>
        <option value="max">Max 最大值</option></select>
      <input class="sp-reduce-sep" placeholder="连接符" value=", " style="width:80px;display:none">`,
      substring: `<input class="sp-sub-start" type="number" value="0" min="0" style="width:60px">
        <input class="sp-sub-end" type="number" placeholder="结尾(留空=到末尾)" style="width:70px">
        <span class="hint">[开始, 结尾)</span>`,
      pad: `<select class="sp-pad-side"><option value="end">右填充</option><option value="start">左填充</option></select>
      <input class="sp-pad-len" type="number" value="10" min="1" style="width:60px">
      <input class="sp-pad-char" placeholder="填充字符" value=" " style="width:40px">`,
      'pad-zeros': `<input class="sp-padz-len" type="number" value="5" min="1" style="width:60px"><span class="hint">左补零到指定长度</span>`,
      center: `<input class="sp-center-len" type="number" value="20" min="1" style="width:60px">
      <input class="sp-center-char" placeholder="填充字符" value=" " style="width:40px">`,
      truncate: `<input class="sp-trunc-len" type="number" value="10" min="1" style="width:60px">
        <select class="sp-trunc-side"><option value="end">截断尾部</option><option value="start">截断头部</option>
        <option value="middle">截断中间</option></select>
        <input class="sp-trunc-ellipsis" placeholder="省略符" value="..." style="width:50px">`,
      'truncate-words': `<input class="sp-truncw-n" type="number" value="5" min="1" style="width:60px">
        <input class="sp-truncw-ellipsis" placeholder="省略符" value="..." style="width:50px">
        <span class="hint">保留前N个单词</span>`,
      template: `<input class="sp-tpl-fmt" placeholder='如: {val} 条' style="width:200px">
        <span class="hint">{val}=内容,{i}=行号,{n}=总行数</span>`,
      extract: `<input class="sp-extract-pat" placeholder="正则" style="width:140px">
        <select class="sp-extract-mode"><option value="match">提取匹配</option><option value="group1">提取捕获组$1</option></select>`,
      interleave: `<input class="sp-intl-text" placeholder="插入文本" style="width:120px">
        <input class="sp-intl-every" type="number" value="3" min="1" style="width:60px"><span class="hint">每N行插入一次</span>`,
      zip: `<textarea class="sp-zip-data" placeholder="粘贴第二个列表，每行一项" style="width:200px;height:40px;font-size:11px"></textarea>
        <input class="sp-zip-sep" placeholder="连接符" value=" " style="width:60px">
        <select class="sp-zip-ref" onchange="StringPipeline.onCommRefChange(this,'zip')"><option value="">-- 或引用暂存列表 --</option></select>
        <span class="hint">两个列表交错合并</span>`,
      batch: `<input class="sp-batch-size" type="number" value="3" min="1" style="width:60px">
        <input class="sp-batch-sep" placeholder="组间分隔符" value="---" style="width:70px">
        <span class="hint">每N行一组</span>`,
      chunk: `<input class="sp-chunk-size" type="number" value="5" min="1" style="width:60px">
        <span class="hint">将每行拆分为固定长度块，每块一行</span>`,
      'word-wrap': `<input class="sp-ww-width" type="number" value="20" min="1" style="width:60px">
        <span class="hint">按指定宽度换行(不拆单词)</span>`,
      mask: `<select class="sp-mask-mode"><option value="end">遮盖尾部</option><option value="start">遮盖头部</option>
        <option value="middle">遮盖中间</option><option value="email">Email 遮盖</option></select>
      <input class="sp-mask-char" placeholder="遮盖字符" value="*" style="width:40px">
      <input class="sp-mask-keep" type="number" placeholder="保留位数" value="4" style="width:60px">`,
      'remove-quotes': `<span class="hint">去除行首尾的引号（单引号/双引号）</span>`,
      slugify: `<span class="hint">转为 URL 友好格式: 小写+连字符+去除特殊字符</span>`,
      'to-ascii': `<span class="hint">去除重音符号(é→e, ñ→n, ü→u 等)</span>`,
      'replace-line-endings': `<select class="sp-rle-mode">
        <option value="lf">LF (\\n) Unix</option><option value="crlf">CRLF (\\r\\n) Windows</option>
        <option value="cr">CR (\\r) Mac</option></select>`,
      'count-occ': `<input class="sp-count-sub" placeholder="子串" style="width:100px">
        <span class="hint">统计每行中子串出现次数，输出格式: "行内容 | 次数"</span>`,
      frequency: `<span class="hint">统计每行出现的频率，输出格式: "次数 | 行内容" (按频率降序)</span>`,
      top: `<input class="sp-top-n" type="number" value="5" min="1" style="width:60px">
        <span class="hint">按出现频率取前N行</span>`,
      'base64-encode': `<span class="hint">将文本进行 Base64 编码</span>`,
      'base64-decode': `<span class="hint">将 Base64 解码为文本</span>`,
      'url-encode': `<span class="hint">URL 编码</span>`,
      'url-decode': `<span class="hint">URL 解码</span>`,
      'html-encode': `<span class="hint">HTML 实体编码 (&lt; &gt; &amp; &quot;)</span>`,
      'html-decode': `<span class="hint">HTML 实体解码</span>`,
      'encode-hex': `<span class="hint">将文本编码为十六进制字符串</span>`,
      'decode-hex': `<span class="hint">将十六进制字符串解码为文本</span>`,
      escape: `<select class="sp-escape-lang"><option value="js">JavaScript</option><option value="java">Java</option><option value="python">Python</option></select>`,
      unescape: `<select class="sp-escape-lang"><option value="js">JavaScript</option><option value="java">Java</option><option value="python">Python</option></select>`,
      'json-escape': `<span class="hint">JSON.stringify 转义</span>`,
      'json-unescape': `<span class="hint">JSON.parse 反转义</span>`,
      'unicode-escape': `<span class="hint">将非ASCII字符转为 \\uXXXX 形式</span>`,
      rot13: `<span class="hint">ROT13 加密/解密</span>`,
      hash: `<select class="sp-hash-algo"><option value="md5">MD5</option><option value="sha1">SHA-1</option>
        <option value="sha256">SHA-256</option><option value="sha512">SHA-512</option></select>
        <span class="hint">基于 Web Crypto API</span>`,
      'column-select': `<input class="sp-cs-delim" placeholder="分隔符" value="," style="width:60px">
        <input class="sp-cs-cols" placeholder="列号" value="1" style="width:80px"><span class="hint">列号从1开始，如1,2或1-3</span>`,
      /* ===== Commons / Spring StringUtils ===== */
      'delete-whitespace': `<span class="hint">StringUtils.deleteWhitespace — 删除所有空白字符</span>`,
      'trim-leading': `<span class="hint">StringUtils.trimLeadingWhitespace — 去除开头空白</span>`,
      'trim-trailing': `<span class="hint">StringUtils.trimTrailingWhitespace — 去除结尾空白</span>`,
      'strip-start': `<input class="sp-stripstart-char" placeholder="要去除的字符" value=" " style="width:80px"><span class="hint">StringUtils.stripStart — 去除开头所有指定字符</span>`,
      'strip-end': `<input class="sp-stripend-char" placeholder="要去除的字符" value=" " style="width:80px"><span class="hint">StringUtils.stripEnd — 去除结尾所有指定字符</span>`,
      'replace-once': `<input class="sp-ro-find" placeholder="查找" style="width:100px"><input class="sp-ro-to" placeholder="替换为" style="width:100px"><span class="hint">StringUtils.replaceOnce — 只替换第一次出现</span>`,
      'replace-each': `<textarea class="sp-re-find" placeholder="查找列表&#10;每行一项" style="width:120px;height:40px;font-size:11px"></textarea>
        <textarea class="sp-re-to" placeholder="替换列表&#10;每行一项" style="width:120px;height:40px;font-size:11px"></textarea>
        <span class="hint">StringUtils.replaceEach — 批量替换，一一对应</span>`,
      overlay: `<input class="sp-ov-str" placeholder="覆盖文本" style="width:100px">
        <input class="sp-ov-start" type="number" placeholder="开始" value="0" style="width:60px">
        <input class="sp-ov-end" type="number" placeholder="结束" value="0" style="width:60px">
        <span class="hint">StringUtils.overlay — 用文本覆盖[start,end)部分</span>`,
      rotate: `<input class="sp-rot-n" type="number" placeholder="偏移量(正右负左)" value="3" style="width:80px"><span class="hint">StringUtils.rotate — 字符循环移位</span>`,
      'reverse-delimited': `<input class="sp-rd-sep" placeholder="分隔符" value="." style="width:60px"><span class="hint">StringUtils.reverseDelimited — 按分隔符反转元素</span>`,
      chomp: `<span class="hint">StringUtils.chomp — 去除末尾换行符(\\n或\\r\\n)</span>`,
      chop: `<span class="hint">StringUtils.chop — 去除末尾一个字符</span>`,
      left: `<input class="sp-left-n" type="number" value="3" min="0" style="width:60px"><span class="hint">StringUtils.left — 取左边N个字符</span>`,
      right: `<input class="sp-right-n" type="number" value="3" min="0" style="width:60px"><span class="hint">StringUtils.right — 取右边N个字符</span>`,
      mid: `<input class="sp-mid-pos" type="number" placeholder="起始位置" value="0" style="width:70px">
        <input class="sp-mid-len" type="number" placeholder="长度" value="3" style="width:60px">
        <span class="hint">StringUtils.mid — 从指定位置取N个字符</span>`,
      'substring-before': `<input class="sp-sb-sep" placeholder="分隔符" value="@" style="width:80px"><span class="hint">StringUtils.substringBefore — 取分隔符前的部分</span>`,
      'substring-after': `<input class="sp-sa-sep" placeholder="分隔符" value="@" style="width:80px"><span class="hint">StringUtils.substringAfter — 取分隔符后的部分</span>`,
      'substring-between': `<input class="sp-sb-open" placeholder="开始标记" value="[" style="width:60px">
        <input class="sp-sb-close" placeholder="结束标记" value="]" style="width:60px">
        <span class="hint">StringUtils.substringBetween — 取两标记之间的部分</span>`,
      unwrap: `<input class="sp-unwrap-c" placeholder="包裹字符" value="\"" style="width:60px"><span class="hint">StringUtils.unwrap — 去除首尾指定字符包裹</span>`,
      'default-if-blank': `<input class="sp-dib-def" placeholder="默认值" style="width:120px"><span class="hint">StringUtils.defaultIfBlank — 空白行替换为默认值</span>`,
      unqualify: `<input class="sp-unqual-sep" placeholder="分隔符" value="." style="width:60px"><span class="hint">Spring StringUtils.unqualify — 取最后分隔符后的部分</span>`,
      'simple-match': `<input class="sp-sm-pat" placeholder="通配符" value="*.txt" style="width:120px"><span class="hint">Spring simpleMatch — 通配符匹配过滤(*任意)</span>`,
      'contains-any': `<input class="sp-cany-chars" placeholder="字符集合" style="width:120px"><span class="hint">StringUtils.containsAny — 行包含任意指定字符则保留</span>`,
      'contains-none': `<input class="sp-cnone-chars" placeholder="字符集合" style="width:120px"><span class="hint">StringUtils.containsNone — 行不包含任意指定字符则保留</span>`,
      'contains-only': `<input class="sp-conly-chars" placeholder="允许的字符集" style="width:120px"><span class="hint">StringUtils.containsOnly — 行只包含指定字符则保留</span>`,
      'is-alpha': `<span class="hint">StringUtils.isAlpha — 仅保留全字母行</span>`,
      'is-numeric': `<span class="hint">StringUtils.isNumeric — 仅保留全数字行</span>`,
      'is-alphanumeric': `<span class="hint">StringUtils.isAlphanumeric — 仅保留字母数字行</span>`,
      'is-all-lower': `<span class="hint">StringUtils.isAllLowerCase — 仅保留全小写行</span>`,
      'is-all-upper': `<span class="hint">StringUtils.isAllUpperCase — 仅保留全大写行</span>`,
      'ordinal-index-of': `<input class="sp-oi-sub" placeholder="子串" style="width:80px">
        <input class="sp-oi-n" type="number" placeholder="第N次" value="2" min="1" style="width:60px">
        <span class="hint">StringUtils.ordinalIndexOf — 第N次出现的位置，输出: "行内容 | N"</span>`,
      /* ===== 扩展操作 ===== */
      lookup: `<textarea class="sp-lookup-map" placeholder="映射表&#10;原值=新值(每行一项)" style="width:200px;height:40px;font-size:11px"></textarea>
        <select class="sp-lookup-ref" onchange="StringPipeline.onCommRefChange(this,'lookup')"><option value="">-- 或引用暂存列表 --</option></select>
        <span class="hint">查找替换，如 "旧值=新值" 或引用暂存列表</span>`,
      comm: `<textarea class="sp-comm-list" placeholder="第二个列表&#10;每行一项" style="width:140px;height:40px;font-size:11px"></textarea>
        <select class="sp-comm-mode"><option value="all">全部(A独有+共有+B独有)</option><option value="a-only">仅在A中</option><option value="b-only">仅在B中</option><option value="both">两者共有</option></select>
        <select class="sp-comm-ref" onchange="StringPipeline.onCommRefChange(this)"><option value="">-- 或引用暂存列表 --</option></select>`,
      fold: `<input class="sp-fold-width" type="number" value="20" min="1" style="width:60px">
        <span class="hint">在精确列位置折行(不保留单词完整性)</span>`,
      unexpand: `<input class="sp-unexpand-size" type="number" value="4" min="2" style="width:60px">
        <span class="hint">将前导空格转为制表符，每N个空格换一个Tab</span>`,
      accumulate: `<select class="sp-accum-mode">
        <option value="sum">Sum 累加数字</option>
        <option value="concat">Concat 累积连接</option>
        <option value="count">Count 行计数</option>
      </select>
      <input class="sp-accum-sep" placeholder="连接符" value=" " style="width:60px;display:none">
      <span class="hint">每行输出从开始到当前行的累积值</span>`,
      'regex-test': `<input class="sp-rt-pat" placeholder="正则" style="width:140px">
        <select class="sp-rt-mode"><option value="bool">true/false 是否匹配</option><option value="count">匹配次数</option></select>`,
      count: `<span class="hint">输出聚合统计: 总行数、字符数、单词数</span>`,
      pivot: `<input class="sp-pivot-delim" placeholder="输入分隔符" value="," style="width:70px">
        <input class="sp-pivot-out" placeholder="输出分隔符" value="|" style="width:60px">
        <span class="hint">将多行数据转置为一行多列</span>`,
      unpivot: `<input class="sp-unpivot-delim" placeholder="分隔符" value="," style="width:70px">
        <span class="hint">将一行数据按分隔符拆为多行</span>`,
      window: `<input class="sp-win-size" type="number" placeholder="窗口大小" value="3" min="1" style="width:70px">
        <input class="sp-win-step" type="number" placeholder="步长" value="1" min="1" style="width:60px">
        <input class="sp-win-sep" placeholder="组间分隔" value="---" style="width:70px">
        <span class="hint">滑动窗口: 每size行一组, 步长step</span>`,
      'dedupe-consecutive': `<span class="hint">删除连续重复的行(仅相邻重复的去重)</span>`,
      note: `<input class="sp-note-text" placeholder="在此输入步骤说明..." style="width:100%"><span class="hint">对当前步骤添加备注说明，不影响数据</span>`,
      math: `<select class="sp-math-op">
        <option value="add">+ 加</option><option value="sub">- 减</option>
        <option value="mul">× 乘</option><option value="div">÷ 除</option>
        <option value="round">round 四舍五入</option><option value="floor">floor 向下取整</option>
        <option value="ceil">ceil 向上取整</option><option value="pow">pow 幂</option><option value="abs">abs 绝对值</option>
      </select>
      <input class="sp-math-val" type="number" placeholder="数值" value="1" style="width:80px">`,
      generate: `<select class="sp-gen-type">
        <option value="range">range 范围(a→b)</option>
        <option value="repeat">repeat 重复文本</option>
        <option value="uuid">UUID v4</option>
        <option value="timestamp">时间戳</option>
      </select>
      <input class="sp-gen-start" placeholder="起始/内容" value="1" style="width:80px">
      <input class="sp-gen-end" placeholder="结束/行数" value="10" style="width:80px">
      <input class="sp-gen-step" placeholder="步长" value="1" style="width:60px">`,
      vlookup: `<textarea class="sp-vl-data" placeholder="查找表&#10;值=结果 (每行一项)" style="width:160px;height:40px;font-size:11px"></textarea>
        <select class="sp-vl-ref" onchange="StringPipeline.onCommRefChange(this,'vlookup')"><option value="">-- 或引用暂存列表 --</option></select>
        <span class="hint">当前行的值如果在查找表中存在，替换为结果</span>`,
    }; // ← end of cfg
    return cfg[type] || '';
  },

  toggleReduceConfig(sel) {
    const sep = sel.parentElement.querySelector('.sp-reduce-sep');
    if (sep) sep.style.display = sel.value === 'join' ? 'inline-block' : 'none';
  },

  getStepLabel(type) {
    const m = {
      case:'🔤 大小写转换', capitalize:'首字母大写', decapitalize:'首字母小写',
      wrap:'🎁 包裹', 'prefix-suffix':'📎 每行添加前后缀',
      'strip-prefix':'去除前缀', 'strip-suffix':'去除后缀',
      'ensure-prefix':'确保前缀', 'ensure-suffix':'确保后缀',
      join:'🔗 行连接', flatten:'📦 全部合并', split:'✂️ 拆分',
      sort:'📋 排序', 'reverse-lines':'🔃 反转行顺序', unique:'🧹 去重',
      trim:'✂️ 去除空格', 'normalize-space':'✨ 规范化空白',
      expandtabs:'展开制表符', squeeze:'去除连续重复字符',
      'remove-empty':'🗑️ 删除空行', replace:'🔄 替换',
      'regex-replace':'🔬 正则替换', 'reverse-str':'↩️ 反转内容',
      'reverse-words':'↩️ 反转单词', 'shuffle-chars':'🎲 打乱字符',
      'line-number':'🔢 添加行号', filter:'🔍 过滤',
      partition:'📊 分为两组', 'take-while':'TakeWhile',
      'drop-while':'DropWhile', repeat:'🔁 重复',
      limit:'✂️ Limit', last:'取后N行', skip:'⏭️ Skip',
      sample:'🎲 随机抽样', pick:'🔢 选取行',
      peek:'👁️ Peek', load:'📂 加载列表', groupby:'📊 GroupBy', reduce:'📦 Reduce',
      substring:'✂️ 截取子串', pad:'📏 填充', 'pad-zeros':'零填充',
      center:'居中对齐', truncate:'✂️ 截断',
      'truncate-words':'按单词截断', template:'📝 模板映射',
      extract:'🔬 正则提取', interleave:'🔀 交错插入',
      zip:'🔀 交错合并', batch:'📦 分批', chunk:'拆分为块',
      'word-wrap':'按单词换行', mask:'🎭 遮盖',
      'remove-quotes':'去除引号', slugify:'URL友好化',
      'to-ascii':'去除重音', 'replace-line-endings':'换行符规范化',
      'count-occ':'📊 统计子串', frequency:'📊 频率统计',
      top:'📊 取前N', 'base64-encode':'🔏 Base64编码',
      'base64-decode':'🔓 Base64解码', 'url-encode':'🔗 URL编码',
      'url-decode':'🔗 URL解码', 'html-encode':'🌐 HTML编码',
      'html-decode':'🌐 HTML解码', 'encode-hex':'Hex编码',
      'decode-hex':'Hex解码', escape:'↩️ 转义', unescape:'↩️ 反转义',
      'json-escape':'📋 JSON转义', 'json-unescape':'📋 JSON反转义',
      'unicode-escape':'🌍 Unicode转义', rot13:'🔄 ROT13',
      hash:'🔑 哈希计算', 'column-select':'📐 列提取',
      /* Commons / Spring StringUtils */
      'delete-whitespace':'deleteWhitespace 删除所有空白',
      'trim-leading':'trimLeadingWhitespace 去除开头空白',
      'trim-trailing':'trimTrailingWhitespace 去除结尾空白',
      'strip-start':'stripStart 去除开头字符', 'strip-end':'stripEnd 去除结尾字符',
      'replace-once':'replaceOnce 只替换第一次', 'replace-each':'replaceEach 批量替换',
      overlay:'overlay 覆盖', rotate:'rotate 循环移位',
      'reverse-delimited':'reverseDelimited 按分隔符反转',
      chomp:'chomp 去末尾换行', chop:'chop 去末尾字符',
      left:'left 左N字符', right:'right 右N字符', mid:'mid 中间N字符',
      'substring-before':'substringBefore 取分隔符前',
      'substring-after':'substringAfter 取分隔符后',
      'substring-between':'substringBetween 取分隔符之间',
      unwrap:'unwrap 去除包裹', 'default-if-blank':'defaultIfBlank 空值默认',
      unqualify:'unqualify 去限定名', 'simple-match':'simpleMatch 通配符过滤',
      'contains-any':'containsAny 包含任意字符',
      'contains-none':'containsNone 不包含任意字符',
      'contains-only':'containsOnly 只包含指定字符',
      'is-alpha':'isAlpha 仅字母', 'is-numeric':'isNumeric 仅数字',
      'is-alphanumeric':'isAlphanumeric 仅字母数字',
      'is-all-lower':'isAllLowerCase 全小写', 'is-all-upper':'isAllUpperCase 全大写',
      'ordinal-index-of':'ordinalIndexOf 第N次位置',
      /* 扩展 */
      lookup:'lookup 字典映射', comm:'comm 两表比对', fold:'fold 固定折行',
      unexpand:'unexpand 空格转制表符', accumulate:'accumulate 累积',
      'regex-test':'regex-test 正则检测', count:'count 聚合统计',
      pivot:'pivot 行转列', unpivot:'unpivot 列转行',
      window:'window 滑动窗口', 'dedupe-consecutive':'去连续重复',
      note:'📝 步骤注释', math:'🔢 数值运算', generate:'🔢 生成序列',
      vlookup:'vlookup 跨列表匹配',
      /* 更多语言/库 */
      'collapse-spaces':'collapseSpaces 合并空白', 'split-lines':'splitlines 智能拆分',
      translate:'translate/tr 字符映射', 'remove-chars':'removeChars 删除字符',
      'retain-chars':'retainChars 保留字符', 'common-prefix':'commonPrefix 公共前缀',
      'common-suffix':'commonSuffix 公共后缀', insert:'insert 插入',
      'replace-by-pos':'replaceByPos 替换位置', 'start-case':'startCase 单词首字母大写',
      words:'words 拆分为单词', 'escape-regex':'escapeRegExp 转义正则',
      'strip-tags':'strip_tags 去HTML标签', 'is-title-case':'isTitleCase 标题大小写',
      length:'length 每行长度', 'word-count':'wordCount 每行单词数',
      format:'format 格式化', substr:'substr 起始+长度'
    };
    return m[type] || type;
  },

  renderSteps() {
    const container = document.getElementById('sp-steps-container');
    document.getElementById('sp-step-count').textContent = `${this.steps.length} 步`;
    if (this.steps.length === 0) {
      container.innerHTML = `<div class="empty-state">点击下方按钮添加处理步骤，从上到下依次执行</div>`;
      return;
    }
    let html = '';
    this.steps.forEach((step, idx) => {
      const noteEl = document.querySelector(`.sp-step[data-id="${step.id}"] .sp-note-text`);
      const noteVal = noteEl?.value || '';
      html += `<div class="sp-step" data-id="${step.id}" draggable="true"
        ondragstart="StringPipeline.onDragStart(event, ${step.id})"
        ondragover="event.preventDefault()"
        ondrop="StringPipeline.onDrop(event, ${step.id})">
        <div class="sp-step-header">
          <span class="sp-step-num" style="cursor:grab">⠿ ${idx+1}.</span>
          <span class="sp-step-label">${this.getStepLabel(step.type)}</span>
          ${step.type==='note'?`<span class="text-muted" style="font-size:11px">${this.escapeAttr(noteVal||'')}</span>`:''}
          <div class="sp-step-actions">
            <button class="btn btn-xs" onclick="StringPipeline.moveStep(${step.id},-1)" ${idx===0?'disabled':''}>↑</button>
            <button class="btn btn-xs" onclick="StringPipeline.moveStep(${step.id},1)" ${idx===this.steps.length-1?'disabled':''}>↓</button>
            <button class="btn btn-xs btn-danger" onclick="StringPipeline.removeStep(${step.id})">✕</button>
          </div>
        </div>
        <div class="sp-step-config">${this.getStepConfig(step.type)}</div>
        <div class="sp-step-preview" id="sp-preview-${step.id}" style="display:none">
          <div class="sp-step-preview-header" onclick="StringPipeline.togglePreview(${step.id})">▶ 中间结果</div>
          <pre class="code-block light" style="max-height:150px;overflow:auto;font-size:11px" id="sp-preview-content-${step.id}"></pre>
        </div>
      </div>`;
    });
    container.innerHTML = html;
    this.populateSavedRefs();
  },

  onDragStart(event, id) {
    event.dataTransfer.setData('text/plain', String(id));
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
  },
  onDrop(event, targetId) {
    event.preventDefault();
    event.target.closest('.sp-step').style.opacity = '';
    const sourceId = parseInt(event.dataTransfer.getData('text/plain'));
    if (sourceId === targetId) return;
    const srcIdx = this.steps.findIndex(s => s.id === sourceId);
    const tgtIdx = this.steps.findIndex(s => s.id === targetId);
    if (srcIdx < 0 || tgtIdx < 0) return;
    this.pushUndo();
    const [removed] = this.steps.splice(srcIdx, 1);
    this.steps.splice(tgtIdx > srcIdx ? tgtIdx : tgtIdx, 0, removed);
    this.renderSteps();
  },
  escapeAttr(str) { return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },

  togglePreview(id) {
    const c = document.getElementById(`sp-preview-content-${id}`);
    const h = c?.previousElementSibling;
    if (!c || !h) return;
    const show = c.style.display !== 'block';
    c.style.display = show ? 'block' : 'none';
    h.textContent = show ? '▼ 中间结果' : '▶ 中间结果';
  },

  setWrapPreset(btn, preset) {
    const p = btn.parentElement;
    const pre = {quote:['"','"'],paren:['(',')'],bracket:['[',']'],brace:['{','}']};
    const [a,b] = pre[preset]||['',''];
    p.querySelector('.sp-wrap-prefix').value = a;
    p.querySelector('.sp-wrap-suffix').value = b;
  },

  /* ========== 执行管道 ========== */
  execute() {
    const raw = document.getElementById('sp-input').value;
    if (!raw.trim()) { this.showToast('请先输入数据'); return; }
    const input = this.parsedSource || raw;
    this.peekLogs = [];
    let data = input;
    const allOutputs = [{ step: '原始输入' + (this.parsedSource ? '(已解析)' : ''), data }];
    let error = null;
    for (const step of this.steps) {
      try { data = this.processStep(step, data); allOutputs.push({ step: this.getStepLabel(step.type), data }); }
      catch (e) { error = `步骤 ${this.getStepLabel(step.type)} 出错: ${e.message}`; this.showToast(error); break; }
    }
    const output = document.getElementById('sp-output');
    output.value = data;
    const lines = data.split('\n');
    document.getElementById('sp-output-status').textContent = `${lines.length} 行, ${data.length} 字符`;
    this.renderIntermediate(allOutputs, error);
    // 自动暂存所有中间结果到 savedLists
    for (const item of allOutputs) {
      // 用 "原始输入" / "步骤N-xxx" 作为key
      const key = item.step;
      this.savedLists[key] = item.data;
    }
    this.renderSavedLists();
  },

  processStep(step, data) {
    const type = step.type;
    const $ = sel => document.querySelector(`.sp-step[data-id="${step.id}"]`)?.querySelector(sel);

    switch (type) {
      case 'case': return StringPipelineUtils.caseConvert(data, $('.sp-case-mode')?.value || 'upper');
      case 'capitalize': return data.split('\n').map(l => l ? l[0].toUpperCase() + l.slice(1).toLowerCase() : l).join('\n');
      case 'decapitalize': return data.split('\n').map(l => l ? l[0].toLowerCase() + l.slice(1) : l).join('\n');
      case 'wrap': { const p=$('.sp-wrap-prefix')?.value||'',s=$('.sp-wrap-suffix')?.value||''; return data.split('\n').map(l=>l.trim()?p+l+s:l).join('\n'); }
      case 'prefix-suffix': { const p=$('.sp-ps-prefix')?.value||'',s=$('.sp-ps-suffix')?.value||''; return data.split('\n').map(l=>l.trim()?p+l+s:l).join('\n'); }
      case 'strip-prefix': { const p=$('.sp-strip-p')?.value||''; return data.split('\n').map(l=>l.startsWith(p)?l.slice(p.length):l).join('\n'); }
      case 'strip-suffix': { const s=$('.sp-strip-s')?.value||''; return data.split('\n').map(l=>l.endsWith(s)?l.slice(0,-s.length):l).join('\n'); }
      case 'ensure-prefix': { const p=$('.sp-ensure-p')?.value||''; return data.split('\n').map(l=>l.trim()?l.startsWith(p)?l:p+l:l).join('\n'); }
      case 'ensure-suffix': { const s=$('.sp-ensure-s')?.value||''; return data.split('\n').map(l=>l.trim()?l.endsWith(s)?l:l+s:l).join('\n'); }
      case 'join': { const s=$('.sp-join-sep')?.value||','; return data.split('\n').filter(l=>l.trim()).join(s); }
      case 'flatten': return data.split('\n').filter(l=>l.trim()).join(' ');
      case 'split': { const s=$('.sp-split-sep')?.value||','; return data.split('\n').flatMap(l=>l.trim()?l.split(s):[]).join('\n'); }
      case 'sort': return StringPipelineUtils.sortLines(data, $('.sp-sort-mode')?.value||'asc');
      case 'reverse-lines': return data.split('\n').filter(l=>l.trim()).reverse().join('\n');
      case 'unique': { const s=new Set(); return data.split('\n').filter(l=>{const t=l.trim();return t&&!s.has(t)?(s.add(t),true):false;}).join('\n'); }
      case 'trim': return data.split('\n').map(l=>l.trim()).join('\n');
      case 'normalize-space': return data.split('\n').map(l=>l.trim().replace(/\s+/g,' ')).join('\n');
      case 'expandtabs': { const n=parseInt($('.sp-expand-size')?.value)||4; return data.split('\n').map(l=>l.replace(/\t/g,' '.repeat(n))).join('\n'); }
      case 'squeeze': { const c=$('.sp-squeeze-char')?.value||''; const r=c?new RegExp(`(${StringPipelineUtils.escapeRegex(c)})\\1+`,'g'):new RegExp('(.)\\1+','g'); return data.replace(r,'$1'); }
      case 'remove-empty': return data.split('\n').filter(l=>l.trim()).join('\n');
      case 'replace': { const f=$('.sp-replace-find')?.value||'',t=$('.sp-replace-to')?.value||''; return data.replaceAll(f,t); }
      case 'regex-replace': { const p=$('.sp-regex-pat')?.value||'',t=$('.sp-regex-to')?.value||''; let f='';if($('.sp-regex-g')?.checked)f+='g';if($('.sp-regex-i')?.checked)f+='i';return data.replace(new RegExp(p,f),t); }
      case 'reverse-str': return data.split('\n').map(l=>l.split('').reverse().join('')).join('\n');
      case 'reverse-words': return data.split('\n').map(l=>l.split(/\s+/).reverse().join(' ')).join('\n');
      case 'shuffle-chars': return data.split('\n').map(l=>{const a=l.split('');for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.join('');}).join('\n');
      case 'line-number': { const f=$('.sp-ln-fmt')?.value||'{n}. {text}'; return data.split('\n').map((l,i)=>f.replace('{n}',String(i+1)).replace('{text}',l)).join('\n'); }
      case 'filter': { const m=$('.sp-filter-mode')?.value||'contain',v=$('.sp-filter-value')?.value||''; return data.split('\n').filter(l=>{switch(m){case'contain':return l.includes(v);case'not-contain':return!l.includes(v);case'starts-with':return l.startsWith(v);case'ends-with':return l.endsWith(v);case'equals':return l===v;case'regex':return new RegExp(v).test(l);case'length-gte':return l.length>=parseInt(v);case'length-lte':return l.length<=parseInt(v);case'is-blank':return l.trim()==='';case'not-blank':return l.trim()!=='';default:return true;}}).join('\n'); }
      case 'partition': { const m=$('.sp-partition-mode')?.value||'contain',v=$('.sp-partition-val')?.value||''; const lines=data.split('\n'); const match=[],rest=[]; for(const l of lines){let ok;switch(m){case'contain':ok=l.includes(v);break;case'regex':ok=new RegExp(v).test(l);break;case'length-gte':ok=l.length>=parseInt(v);break;default:ok=true;}if(ok)match.push(l);else rest.push(l);} return `# 匹配 (${match.length} 行)\n${match.join('\n')}\n\n# 不匹配 (${rest.length} 行)\n${rest.join('\n')}`; }
      case 'take-while': { const p=$('.sp-tw-pattern')?.value||'',m=$('.sp-tw-mode')?.value||'contain'; const lines=data.split('\n'); const r=[];for(const l of lines){let ok;switch(m){case'contain':ok=l.includes(p);break;case'not-contain':ok=!l.includes(p);break;case'starts-with':ok=l.startsWith(p);break;case'regex':ok=new RegExp(p).test(l);break;default:ok=true;}if(ok)r.push(l);else break;}return r.join('\n'); }
      case 'drop-while': { const p=$('.sp-dw-pattern')?.value||'',m=$('.sp-dw-mode')?.value||'contain'; const lines=data.split('\n');let i=0;for(;i<lines.length;i++){const l=lines[i];let ok;switch(m){case'contain':ok=l.includes(p);break;case'starts-with':ok=l.startsWith(p);break;case'regex':ok=new RegExp(p).test(l);break;default:ok=true;}if(!ok)break;}return lines.slice(i).join('\n'); }
      case 'repeat': { const n=parseInt($('.sp-repeat-n')?.value)||2; return data.split('\n').flatMap(l=>l.trim()?Array(n).fill(l):[]).join('\n'); }
      case 'limit': return data.split('\n').slice(0,parseInt($('.sp-limit-n')?.value)||10).join('\n');
      case 'last': return data.split('\n').slice(-(parseInt($('.sp-last-n')?.value)||5)).join('\n');
      case 'skip': return data.split('\n').slice(parseInt($('.sp-skip-n')?.value)||0).join('\n');
      case 'sample': { const n=parseInt($('.sp-sample-n')?.value)||5;const arr=data.split('\n').filter(l=>l.trim());const s=[];const len=Math.min(n,arr.length);const idx=new Set();while(idx.size<len)idx.add(Math.floor(Math.random()*arr.length));return arr.filter((_,i)=>idx.has(i)).join('\n'); }
      case 'pick': { const r=$('.sp-pick-range')?.value||'1-5';const idx=StringPipelineUtils.parseColumns(r);const lines=data.split('\n');return idx.map(i=>lines[i-1]||'').filter(l=>l!==undefined).join('\n'); }
      case 'peek': { const lines=data.split('\n');const pv=lines.length>15?lines.slice(0,15).join('\n')+`\n... (共 ${lines.length} 行)`:data;this.peekLogs.push(`👁️ Peek (${lines.length}行, ${data.length}字符):\n${pv}`);return data; }
      case 'load': { const name=$('.sp-load-name')?.value||'';const d=this.loadList(name);return d!==null?d:data; }
      case 'groupby': { const m=$('.sp-groupby-mode')?.value||'firstChar';const lines=data.split('\n').filter(l=>l.trim());const g={};for(const l of lines){let k;switch(m){case'firstChar':k=(l[0]||'').toUpperCase()||'(empty)';break;case'length':k=`len=${l.length}`;break;case'exact':k=l;break;default:k=l;}if(!g[k])g[k]=[];g[k].push(l);}return Object.entries(g).map(([k,items])=>`# ${k} (${items.length} 项)\n${items.join('\n')}`).join('\n\n'); }
      case 'reduce': { const op=$('.sp-reduce-op')?.value||'join',sep=$('.sp-reduce-sep')?.value||', ';const lines=data.split('\n').filter(l=>l.trim());const nums=lines.map(v=>parseFloat(v)).filter(v=>!isNaN(v));switch(op){case'join':return lines.join(sep);case'count':return `Count: ${lines.length}`;case'sum':return `Sum: ${nums.reduce((a,b)=>a+b,0)}`;case'min':return `Min: ${nums.length>0?Math.min(...nums):'N/A'}`;case'max':return `Max: ${nums.length>0?Math.max(...nums):'N/A'}`;default:return data;} }
      case 'substring': { const s=parseInt($('.sp-sub-start')?.value)||0;const e=$('.sp-sub-end')?.value;return data.split('\n').map(l=>e?l.substring(s,parseInt(e)):l.substring(s)).join('\n'); }
      case 'pad': { const side=$('.sp-pad-side')?.value||'end',len=parseInt($('.sp-pad-len')?.value)||10,char=$('.sp-pad-char')?.value||' ';return data.split('\n').map(l=>side==='start'?l.padStart(len,char):l.padEnd(len,char)).join('\n'); }
      case 'pad-zeros': { const n=parseInt($('.sp-padz-len')?.value)||5;return data.split('\n').map(l=>l.padStart(n,'0')).join('\n'); }
      case 'center': { const len=parseInt($('.sp-center-len')?.value)||20,char=$('.sp-center-char')?.value||' ';return data.split('\n').map(l=>{const pad=Math.max(0,len-l.length);const left=Math.floor(pad/2);return char.repeat(left)+l+char.repeat(pad-left);}).join('\n'); }
      case 'truncate': { const max=parseInt($('.sp-trunc-len')?.value)||10,side=$('.sp-trunc-side')?.value||'end',ell=$('.sp-trunc-ellipsis')?.value||'...';return data.split('\n').map(l=>{if(l.length<=max)return l;switch(side){case'start':return ell+l.slice(l.length-max+ell.length);case'middle':{const h=Math.floor((max-ell.length)/2);return l.slice(0,h)+ell+l.slice(l.length-h);}default:return l.slice(0,max-ell.length)+ell;}}).join('\n'); }
      case 'truncate-words': { const n=parseInt($('.sp-truncw-n')?.value)||5,ell=$('.sp-truncw-ellipsis')?.value||'...';return data.split('\n').map(l=>{const w=l.split(/\s+/);return w.length>n?w.slice(0,n).join(' ')+ell:l;}).join('\n'); }
      case 'template': { const f=$('.sp-tpl-fmt')?.value||'{val}';const lines=data.split('\n'),t=lines.length;return lines.map((l,i)=>f.replace(/\{val\}/g,l).replace(/\{i\}/g,String(i+1)).replace(/\{n\}/g,String(t))).join('\n'); }
      case 'extract': { const p=$('.sp-extract-pat')?.value||'',m=$('.sp-extract-mode')?.value||'match';const r=new RegExp(p,'g');const lines=data.split('\n');const res=[];if(m==='match'){for(const l of lines){const ms=l.match(r);if(ms)res.push(...ms);}}else{const sr=new RegExp(p);for(const l of lines){const mat=l.match(sr);if(mat&&mat[1]!==undefined)res.push(mat[1]);}}return res.join('\n'); }
      case 'interleave': { const t=$('.sp-intl-text')?.value||'',e=parseInt($('.sp-intl-every')?.value)||3;const lines=data.split('\n');const r=[];lines.forEach((l,i)=>{r.push(l);if((i+1)%e===0&&i<lines.length-1)r.push(t);});return r.join('\n'); }
      case 'zip': { const zipData=this.getRefOrTextarea(step,'.sp-zip-data','.sp-zip-ref');const sep=$('.sp-zip-sep')?.value||' ';const listB=zipData.split('\n').filter(l=>l.trim());const listA=data.split('\n').filter(l=>l.trim());const len=Math.min(listA.length,listB.length);return Array.from({length:len},(_,i)=>listA[i]+sep+listB[i]).join('\n'); }
      case 'lookup': { const mapStr=this.getRefOrTextarea(step,'.sp-lookup-map','.sp-lookup-ref');if(!mapStr.trim())return data;const map={};mapStr.split('\n').filter(l=>l.trim()).forEach(l=>{const i=l.indexOf('=');if(i>0){map[l.slice(0,i).trim()]=l.slice(i+1).trim();}});return data.split('\n').map(l=>map[l]!==undefined?map[l]:l).join('\n'); }
      case 'comm': { const listB=this.getRefOrTextarea(step,'.sp-comm-list','.sp-comm-ref');const mode=$('.sp-comm-mode')?.value||'all';const linesA=data.split('\n').filter(l=>l.trim());const linesB=listB.split('\n').filter(l=>l.trim());const setB=new Set(linesB);const setA=new Set(linesA);const aOnly=linesA.filter(l=>!setB.has(l));const bOnly=linesB.filter(l=>!setA.has(l));const both=linesA.filter(l=>setB.has(l));if(mode==='a-only')return aOnly.join('\n');if(mode==='b-only')return bOnly.join('\n');if(mode==='both')return both.join('\n');return `# A独有 (${aOnly.length})\n${aOnly.join('\n')}\n\n# B独有 (${bOnly.length})\n${bOnly.join('\n')}\n\n# 共有 (${both.length})\n${both.join('\n')}`; }
      case 'fold': { const w=parseInt($('.sp-fold-width')?.value)||20;const lines=data.split('\n');return lines.flatMap(l=>l.match(new RegExp('.{1,'+w+'}','g'))||['']).join('\n'); }
      case 'unexpand': { const n=parseInt($('.sp-unexpand-size')?.value)||4;return data.split('\n').map(l=>l.replace(new RegExp(`^ {${n}}`,'gm'),'\t')).join('\n'); }
      case 'accumulate': { const mode=$('.sp-accum-mode')?.value||'sum',sep=$('.sp-accum-sep')?.value||' ';const lines=data.split('\n');const r=[];let acc=0,parts=[];for(let i=0;i<lines.length;i++){const l=lines[i];if(mode==='sum'){acc+=parseFloat(l)||0;r.push(String(acc));}else if(mode==='count'){r.push(String(i+1));}else{parts.push(l);r.push(parts.join(sep));}}return r.join('\n'); }
      case 'regex-test': { const pat=$('.sp-rt-pat')?.value||'',mode=$('.sp-rt-mode')?.value||'bool';if(!pat)return data;const re=new RegExp(pat,'g');return data.split('\n').map(l=>{const m=l.match(re);return mode==='bool'?`${re.test(l)} | ${l}`:`${(m||[]).length} | ${l}`;}).join('\n'); }
      case 'count': { const lines=data.split('\n');const chars=data.length;const words=data.split(/\s+/).filter(Boolean).length;return `行数: ${lines.length}\n字符数: ${chars}\n单词数: ${words}`; }
      case 'pivot': { const delim=$('.sp-pivot-delim')?.value||',',out=$('.sp-pivot-out')?.value||'|';const cells=data.split('\n').filter(l=>l.trim()).flatMap(l=>l.split(delim));return cells.join(out); }
      case 'unpivot': { const delim=$('.sp-unpivot-delim')?.value||',';return data.split('\n').flatMap(l=>l.split(delim)).join('\n'); }
      case 'window': { const size=parseInt($('.sp-win-size')?.value)||3,step=parseInt($('.sp-win-step')?.value)||1,sep=$('.sp-win-sep')?.value||'---';const lines=data.split('\n');const r=[];for(let i=0;i<lines.length-size+1;i+=step)r.push(lines.slice(i,i+size).join('\n'));return r.join('\n'+sep+'\n'); }
      case 'dedupe-consecutive': { return data.split('\n').filter((l,i,arr)=>i===0||l!==arr[i-1]).join('\n'); }
      case 'note': return data;
      case 'math': { const op=$('.sp-math-op')?.value||'add',val=parseFloat($('.sp-math-val')?.value)||0;return data.split('\n').map(l=>{const n=parseFloat(l);if(isNaN(n))return l;switch(op){case'add':return String(n+val);case'sub':return String(n-val);case'mul':return String(n*val);case'div':return val!==0?String(n/val):l;case'round':return String(Math.round(n));case'floor':return String(Math.floor(n));case'ceil':return String(Math.ceil(n));case'pow':return String(Math.pow(n,val));case'abs':return String(Math.abs(n));default:return l;}}).join('\n'); }
      case 'generate': { const t=$('.sp-gen-type')?.value||'range',start=$('.sp-gen-start')?.value||'1',end=parseInt($('.sp-gen-end')?.value)||10,step=parseInt($('.sp-gen-step')?.value)||1;if(t==='range'){const s=parseInt(start)||1;const r=[];for(let i=s;i<=end;i+=step)r.push(String(i));return r.join('\n');}if(t==='repeat'){return Array(end).fill(start).join('\n');}if(t==='uuid'){const r=[];for(let i=0;i<end;i++){const u='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});r.push(u);}return r.join('\n');}if(t==='timestamp'){const r=[];for(let i=0;i<end;i++)r.push(String(Date.now()+i*step));return r.join('\n');}return data; }
      case 'vlookup': { const mapStr=this.getRefOrTextarea(step,'.sp-vl-data','.sp-vl-ref');if(!mapStr.trim())return data;const map={};mapStr.split('\n').filter(l=>l.trim()).forEach(l=>{const i=l.indexOf('=');if(i>0){map[l.slice(0,i).trim()]=l.slice(i+1).trim();}else if(l.includes(',')){const c=l.split(',');map[c[0].trim()]=c.slice(1).join(',').trim();}});return data.split('\n').map(l=>{if(map[l]!==undefined)return map[l];for(const [k,v] of Object.entries(map)){if(l.includes(k))return l.replace(k,v);}return l;}).join('\n'); }
      default: return data;
    }
  },

  renderIntermediate(allOutputs, error) {
    const card = document.getElementById('sp-intermediate-card');
    const body = document.getElementById('sp-intermediate-body');
    card.style.display = 'block';
    let html = '';
    for (const item of allOutputs) {
      const lines = item.data.split('\n');
      const preview = lines.length > 10 ? lines.slice(0,10).join('\n')+`\n... (共 ${lines.length} 行)` : item.data;
      html += `<div class="sp-intermediate-item"><div class="sp-intermediate-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'"><span>▶ ${item.step}</span><span class="text-muted" style="font-size:11px">${lines.length} 行, ${item.data.length} 字符</span></div><pre class="code-block light" style="display:none;max-height:120px;overflow:auto;font-size:11px;margin-top:4px">${StringPipelineUtils.escapeHtml(preview)}</pre></div>`;
    }
    if (this.peekLogs.length > 0) {
      html += `<div class="sp-intermediate-item" style="border-left-color:var(--blue)"><div class="sp-intermediate-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'"><span>👁️ Peek 日志</span></div><pre class="code-block light" style="display:none;max-height:200px;overflow:auto;font-size:11px;margin-top:4px">${StringPipelineUtils.escapeHtml(this.peekLogs.join('\n---\n'))}</pre></div>`;
    }
    if (error) html += `<div class="sp-intermediate-item" style="border-left:3px solid #e74c3c"><div class="sp-intermediate-header" style="color:#e74c3c">⚠️ ${StringPipelineUtils.escapeHtml(error)}</div></div>`;
    body.innerHTML = html;
  },

  copyOutput() {
    const t = document.getElementById('sp-output');
    if (!t.value.trim()) return this.showToast('无内容可复制');
    navigator.clipboard.writeText(t.value).then(()=>this.showToast('已复制'));
  },
  exportOutput() {
    const t = document.getElementById('sp-output');
    if (!t.value.trim()) return this.showToast('无内容可导出');
    const blob = new Blob([t.value], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'string-pipeline-output.txt'; a.click();
    URL.revokeObjectURL(url);
  },
};

/* ========== 工具函数 ========== */
const StringPipelineUtils = {
  caseConvert(input, mode) {
    switch (mode) {
      case 'upper': return input.toUpperCase();
      case 'lower': return input.toLowerCase();
      case 'title': return input.replace(/\b\w/g, c => c.toUpperCase());
      case 'camel': return input.replace(/[-_\s]+(.)/g,(_,c)=>c.toUpperCase()).replace(/^(.)/,c=>c.toLowerCase());
      case 'pascal': return input.replace(/[-_\s]+(.)/g,(_,c)=>c.toUpperCase()).replace(/^(.)/,c=>c.toUpperCase());
      case 'snake': return input.replace(/([A-Z])/g,'_$1').toLowerCase().replace(/[-_\s]+/g,'_').replace(/^_/, '');
      case 'kebab': return input.replace(/([A-Z])/g,'-$1').toLowerCase().replace(/[_\s]+/g,'-').replace(/^-/,'');
      case 'constant': return input.replace(/([A-Z])/g,'_$1').toUpperCase().replace(/[-_\s]+/g,'_').replace(/^_/, '');
      case 'toggle': return input.split('').map(c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()).join('');
      default: return input;
    }
  },
  sortLines(input, mode) {
    const lines = input.split('\n').filter(l=>l.trim());
    switch (mode) {
      case 'asc': return lines.sort((a,b)=>a.localeCompare(b)).join('\n');
      case 'desc': return lines.sort((a,b)=>b.localeCompare(a)).join('\n');
      case 'number-asc': return lines.sort((a,b)=>parseFloat(a)-parseFloat(b)).join('\n');
      case 'number-desc': return lines.sort((a,b)=>parseFloat(b)-parseFloat(a)).join('\n');
      case 'by-length': return lines.sort((a,b)=>b.length-a.length).join('\n');
      case 'natural': return lines.sort((a,b)=>a.localeCompare(b,void 0,{numeric:true})).join('\n');
      case 'shuffle': { for(let i=lines.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lines[i],lines[j]]=[lines[j],lines[i]];}return lines.join('\n'); }
      default: return input;
    }
  },
  parseColumns(str) {
    const parts = str.split(','); const cols = [];
    for (const p of parts) {
      const t = p.trim();
      if (!t || /^\d+$/.test(t)) { cols.push(Number(t)); }
      else if (t.includes('-') && !t.startsWith('-')) {
        const [s,e]=t.split('-').map(Number);
        if (!isNaN(s) && !isNaN(e)) for(let i=s;i<=e;i++) cols.push(i);
      }
    }
    return cols.filter(n=>!isNaN(n)&&n>0);
  },
  escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); },
  resolveJSONPath(obj, path) {
    // Simplified JSONPath: $, $.key, $.key.subkey, $[*], $.arr[*].key
    if (!path || path === '$') return Array.isArray(obj) ? obj : [obj];
    let p = path;
    if (p.startsWith('$.')) p = p.slice(2);
    else if (p.startsWith('$')) p = p.slice(1);
    const parts = p.split('.').filter(Boolean);
    let current = [obj];
    for (const part of parts) {
      if (part === '*') {
        current = current.flatMap(c => Array.isArray(c) ? c : Object.values(c));
      } else if (part.endsWith(']')) {
        const match = part.match(/^(\w+)?\[(\d+|\*)\]$/);
        if (match) {
          const [, key, idx] = match;
          if (key) current = current.map(c => c[key]).filter(c => c !== undefined);
          if (idx === '*') current = current.flatMap(c => Array.isArray(c) ? c : [c]);
          else current = current.map(c => Array.isArray(c) ? c[parseInt(idx)] : c).filter(c => c !== undefined);
        }
      } else {
        current = current.flatMap(c => {
          if (Array.isArray(c)) return c.map(item => item[part]).filter(v => v !== undefined);
          if (c[part] === undefined) return [];
          return Array.isArray(c[part]) ? c[part] : [c[part]];
        });
      }
    }
    return current;
  },
  escapeStr(str, lang) {
    const map = {'\\':'\\\\','\n':'\\n','\r':'\\r','\t':'\\t','"':'\\"',"'":"\\'"};
    if (lang==='js') { map['`']='\\`'; map['$']='\\$'; }
    return str.split('').map(c=>map[c]||c).join('');
  },
  unescapeStr(str) {
    return str.replace(/\\(.)/g,(_,c)=>({n:'\n',r:'\r',t:'\t','0':'\0','\\':'\\','"':'"',"'":"'"})[c]||c);
  },
  escapeHtml(str) { return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
  async hash(data, algo) {
    const map = {md5:'MD5',sha1:'SHA-1',sha256:'SHA-256',sha512:'SHA-512'};
    const name = map[algo];
    if (!name) return data;
    if (algo === 'md5') {
      // MD5 via SubtleCrypto (not directly supported, use a simple implementation)
      return StringPipelineUtils.md5(data);
    }
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest(name, enc.encode(data));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  },
  md5(str) {
    // webtoolkit.md5 (public domain) adapted for UTF-8
    const s = unescape(encodeURIComponent(str));
    const n = s.length;
    const x = [];
    const nWords = (((n + 8) >>> 6) + 1) << 4;
    for (let i = 0; i < nWords; i++) x[i] = 0;
    for (let i = 0; i < n; i++) x[i>>2] |= (s.charCodeAt(i) & 0xFF) << ((i & 3) * 8);
    x[n>>2] |= 0x80 << ((n & 3) * 8);
    x[14] = n * 8;
    const add = (x, y) => {
      const l = (x & 0xFFFF) + (y & 0xFFFF);
      const m = (x >>> 16) + (y >>> 16) + (l >>> 16);
      return (m << 16) | (l & 0xFFFF);
    };
    const r = (v, s) => (v << s) | (v >>> (32 - s));
    const F = (x, y, z) => (x & y) | (~x & z);
    const G = (x, y, z) => (x & z) | (y & ~z);
    const H = (x, y, z) => x ^ y ^ z;
    const I = (x, y, z) => y ^ (x | ~z);
    const T = [-680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426, -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162, 1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632, 643717713, -373897302, -701558691, 38016083, -660478335, -405537848, 568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784, 1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556, -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222, -722521979, 76029189, -640364487, -421815835, 530742520, -995338651, -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606, -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649, -145523070, -1120210379, 718787259, -343485551];
    const blocks = (x, n, f, k) => {
      for (let i = 0; i < 16; i++) {
        const s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
        const g = k[i];
        f[0] = add(f[0], r(add(add(add(f[0], f[1]), T[n + i]), x[g + (n>>5)]), s[(n>>2) + (i&3)]));
        [f[0], f[1], f[2], f[3]] = [f[3], f[0], f[1], f[2]];
      }
    };
    const K0 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const K1 = [1, 6, 11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12];
    const K2 = [5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2];
    const K3 = [0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9];
    let h = [1732584193, -271733879, -1732584194, 271733878];
    for (let i = 0; i < x.length; i += 16) {
      const a = h.slice();
      const w = x.slice(i, i + 16);
      const u = (f, k) => blocks(w, 0, a, k);
      // Round 1-4 with FF, GG, HH, II
      for (let j = 0; j < 16; j++) {
        const s = [7,12,17,22][j&3];
        a[0] = add(a[1], r(add(add(add(a[0], F(a[1],a[2],a[3])), w[K0[j]]), T[j]), s));
        [a[0],a[1],a[2],a[3]] = [a[3],a[0],a[1],a[2]];
      }
      for (let j = 0; j < 16; j++) {
        const s = [5,9,14,20][j&3];
        a[0] = add(a[1], r(add(add(add(a[0], G(a[1],a[2],a[3])), w[K1[j]]), T[16+j]), s));
        [a[0],a[1],a[2],a[3]] = [a[3],a[0],a[1],a[2]];
      }
      for (let j = 0; j < 16; j++) {
        const s = [4,11,16,23][j&3];
        a[0] = add(a[1], r(add(add(add(a[0], H(a[1],a[2],a[3])), w[K2[j]]), T[32+j]), s));
        [a[0],a[1],a[2],a[3]] = [a[3],a[0],a[1],a[2]];
      }
      for (let j = 0; j < 16; j++) {
        const s = [6,10,15,21][j&3];
        a[0] = add(a[1], r(add(add(add(a[0], I(a[1],a[2],a[3])), w[K3[j]]), T[48+j]), s));
        [a[0],a[1],a[2],a[3]] = [a[3],a[0],a[1],a[2]];
      }
      h = h.map((v, i) => add(v, a[i]));
    }
    return h.map(v => {
      const vU = v >>> 0;
      return [vU & 0xFF, (vU >>> 8) & 0xFF, (vU >>> 16) & 0xFF, (vU >>> 24) & 0xFF]
        .map(b => b.toString(16).padStart(2, '0')).join('');
    }).join('');
  }
};