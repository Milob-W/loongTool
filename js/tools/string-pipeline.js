const StringPipeline = {
  steps: [],
  stepIdCounter: 0,
  peekLogs: [],
  parsedSource: null,

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
            <button class="btn btn-sm btn-primary" onclick="StringPipeline.execute()">▶️ 执行全部</button>
            <button class="btn btn-sm" onclick="StringPipeline.clearSteps()">🗑️ 清空所有步骤</button>
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
    this.steps.push({ id, type });
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

  clearSteps() { this.steps = []; this.renderSteps(); },
  clearInput() {
    document.getElementById('sp-input').value = '';
    document.getElementById('sp-input-status').textContent = '0 行';
    this.showToast('已清空');
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
      /* ===== 更多语言/库 ===== */
      'collapse-spaces': `<input class="sp-cs-replace" placeholder="替换为" value=" " style="width:60px"><span class="hint">Guava collapseFrom — 合并连续空白为指定字符</span>`,
      'split-lines': `<span class="hint">Python splitlines — 按换行符拆分(保留空行)</span>`,
      translate: `<input class="sp-tr-from" placeholder="原字符" style="width:80px"><input class="sp-tr-to" placeholder="目标字符" style="width:80px"><span class="hint">Python str.translate / Ruby tr — 逐字符映射</span>`,
      'remove-chars': `<input class="sp-rc-chars" placeholder="要删除的字符" style="width:120px"><span class="hint">Guava removeFrom — 删除行中所有指定字符</span>`,
      'retain-chars': `<input class="sp-rt-chars" placeholder="要保留的字符" style="width:120px"><span class="hint">Guava retainFrom — 只保留行中这些字符</span>`,
      'common-prefix': `<span class="hint">Guava commonPrefix — 所有行的公共前缀(输出1行)</span>`,
      'common-suffix': `<span class="hint">Guava commonSuffix — 所有行的公共后缀(输出1行)</span>`,
      insert: `<input class="sp-ins-pos" type="number" placeholder="位置" value="0" style="width:60px"><input class="sp-ins-text" placeholder="插入文本" style="width:100px"><span class="hint">C# Insert — 在指定位置插入文本</span>`,
      'replace-by-pos': `<input class="sp-rbp-pos" type="number" placeholder="起始" value="0" style="width:60px">
        <input class="sp-rbp-len" type="number" placeholder="长度" value="1" style="width:60px">
        <input class="sp-rbp-text" placeholder="替换文本" style="width:100px">
        <span class="hint">SQL INSERT — 替换指定位置开始的N个字符</span>`,
      'start-case': `<span class="hint">lodash startCase / PHP ucwords — 每个单词首字母大写</span>`,
      words: `<span class="hint">lodash words — 将每行按单词拆分，每词一行</span>`,
      'escape-regex': `<span class="hint">lodash escapeRegExp — 转义字符串中的正则特殊字符</span>`,
      'strip-tags': `<input class="sp-strip-tags" placeholder="允许的标签(可选)" style="width:120px"><span class="hint">PHP strip_tags — 去除HTML/XML标签</span>`,
      'is-title-case': `<span class="hint">Python istitle — 仅保留标题大小写行(每个单词首字母大写)</span>`,
      length: `<span class="hint">输出每行的字符长度: "行内容 | 长度"</span>`,
      'word-count': `<span class="hint">输出每行的单词数: "行内容 | 单词数"</span>`,
      format: `<input class="sp-fmt-tpl" placeholder='如: {0} → {1}' style="width:200px"><span class="hint">Python Format / C# Format — 按位置{0}{1}格式化</span>`,
      substr: `<input class="sp-substr-start" type="number" placeholder="起始" value="0" style="width:60px">
        <input class="sp-substr-len" type="number" placeholder="长度(0=到末尾)" value="0" style="width:60px">
        <span class="hint">PHP substr — 从起始位置取N个字符</span>`,
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
      peek:'👁️ Peek', groupby:'📊 GroupBy', reduce:'📦 Reduce',
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
      html += `<div class="sp-step" data-id="${step.id}">
        <div class="sp-step-header">
          <span class="sp-step-num">${idx+1}.</span>
          <span class="sp-step-label">${this.getStepLabel(step.type)}</span>
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
  },

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
    // 自动解析：如果还没有解析或源文本变了，自动解析
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
      case 'zip': { const zipData=$('.sp-zip-data')?.value||'',sep=$('.sp-zip-sep')?.value||' ';const listB=zipData.split('\n').filter(l=>l.trim());const listA=data.split('\n').filter(l=>l.trim());const len=Math.min(listA.length,listB.length);return Array.from({length:len},(_,i)=>listA[i]+sep+listB[i]).join('\n'); }
      case 'batch': { const size=parseInt($('.sp-batch-size')?.value)||3,sep=$('.sp-batch-sep')?.value||'---';const lines=data.split('\n');const groups=[];for(let i=0;i<lines.length;i+=size)groups.push(lines.slice(i,i+size).join('\n'));return groups.join('\n'+sep+'\n'); }
      case 'chunk': { const size=parseInt($('.sp-chunk-size')?.value)||5;return data.split('\n').flatMap(l=>{const r=[];for(let i=0;i<l.length;i+=size)r.push(l.slice(i,i+size));return r;}).join('\n'); }
      case 'word-wrap': { const w=parseInt($('.sp-ww-width')?.value)||20;return data.split('\n').flatMap(l=>{const r=[];let cur='';for(const word of l.split(/\s+/)){if(!word)continue;if(cur.length+word.length+(cur?1:0)>w){if(cur)r.push(cur);cur=word;}else cur=cur?cur+' '+word:word;}if(cur)r.push(cur);return r;}).join('\n'); }
      case 'mask': { const m=$('.sp-mask-mode')?.value||'end',c=$('.sp-mask-char')?.value||'*',k=parseInt($('.sp-mask-keep')?.value)||4;return data.split('\n').map(l=>{switch(m){case'end':if(l.length<=k)return c.repeat(l.length);return l.slice(0,k)+c.repeat(l.length-k);case'start':if(l.length<=k)return c.repeat(l.length);return c.repeat(l.length-k)+l.slice(l.length-k);case'middle':if(l.length<=k+2)return c.repeat(l.length);const half=Math.floor(k/2);return l.slice(0,half)+c.repeat(l.length-k)+l.slice(l.length-half);case'email':{const at=l.indexOf('@');if(at<=1)return l;return l[0]+c.repeat(at-1)+l.slice(at);}default:return l;}}).join('\n'); }
      case 'remove-quotes': return data.split('\n').map(l=>l.replace(/^['"]|['"]$/g,'')).join('\n');
      case 'slugify': return data.split('\n').map(l=>l.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/^-+|-+$/g,'')).join('\n');
      case 'to-ascii': return data.split('\n').map(l=>l.normalize('NFD').replace(/[\u0300-\u036f]/g,'')).join('\n');
      case 'replace-line-endings': { const m=$('.sp-rle-mode')?.value||'lf';const target=m==='crlf'?'\r\n':m==='cr'?'\r':'\n';return data.replace(/\r\n|\r|\n/g,target); }
      case 'count-occ': { const sub=$('.sp-count-sub')?.value||'';if(!sub)return data;return data.split('\n').map(l=>{const c=(l.match(new RegExp(StringPipelineUtils.escapeRegex(sub),'g'))||[]).length;return `${l} | ${c}`;}).join('\n'); }
      case 'frequency': { const lines=data.split('\n').filter(l=>l.trim());const freq={};for(const l of lines)freq[l]=(freq[l]||0)+1;return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${v} | ${k}`).join('\n'); }
      case 'top': { const n=parseInt($('.sp-top-n')?.value)||5;const lines=data.split('\n').filter(l=>l.trim());const freq={};for(const l of lines)freq[l]=(freq[l]||0)+1;return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`${v} | ${k}`).join('\n'); }
      case 'base64-encode': return btoa(unescape(encodeURIComponent(data)));
      case 'base64-decode': return decodeURIComponent(escape(atob(data)));
      case 'url-encode': return encodeURIComponent(data);
      case 'url-decode': return decodeURIComponent(data);
      case 'html-encode': return data.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      case 'html-decode': return data.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'").replace(/&#x2F;/g,'/');
      case 'encode-hex': return data.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
      case 'decode-hex': return data.replace(/\s/g,'').split(/([0-9a-fA-F]{2})/g).filter(Boolean).map(h=>String.fromCharCode(parseInt(h,16))).join('');
      case 'escape': { const lang=$('.sp-escape-lang')?.value||'js';return StringPipelineUtils.escapeStr(data,lang); }
      case 'unescape': { const lang=$('.sp-escape-lang')?.value||'js';return StringPipelineUtils.unescapeStr(data,lang); }
      case 'json-escape': return JSON.stringify(data).slice(1,-1);
      case 'json-unescape': { try{return JSON.parse('"'+data.replace(/\\"/g,'"').replace(/^"|"$/g,'')+'"');}catch{return data;} }
      case 'unicode-escape': return data.split('').map(c=>{const code=c.charCodeAt(0);return code>127?'\\u'+code.toString(16).padStart(4,'0'):c;}).join('');
      case 'rot13': return data.replace(/[a-zA-Z]/g,c=>{const base=c.charCodeAt(0)>=97?97:65;return String.fromCharCode((c.charCodeAt(0)-base+13)%26+base);});
      case 'hash': { const algo=$('.sp-hash-algo')?.value||'md5';return StringPipelineUtils.hash(data,algo); }
      case 'column-select': { const d=$('.sp-cs-delim')?.value||',',c=$('.sp-cs-cols')?.value||'1';const cols=StringPipelineUtils.parseColumns(c);return data.split('\n').map(l=>{const cells=l.split(d);return cols.map(c=>(cells[c-1]||'')).join(d);}).join('\n'); }
      /* ===== Commons / Spring StringUtils ===== */
      case 'delete-whitespace': return data.replace(/\s+/g,'');
      case 'trim-leading': return data.split('\n').map(l=>l.replace(/^\s+/,'')).join('\n');
      case 'trim-trailing': return data.split('\n').map(l=>l.replace(/\s+$/,'')).join('\n');
      case 'strip-start': { const c=$('.sp-stripstart-char')?.value||' ';const re=new RegExp(`^[${StringPipelineUtils.escapeRegex(c)}]+`);return data.split('\n').map(l=>l.replace(re,'')).join('\n'); }
      case 'strip-end': { const c=$('.sp-stripend-char')?.value||' ';const re=new RegExp(`[${StringPipelineUtils.escapeRegex(c)}]+$`);return data.split('\n').map(l=>l.replace(re,'')).join('\n'); }
      case 'replace-once': { const f=$('.sp-ro-find')?.value||'',t=$('.sp-ro-to')?.value||'';return data.replace(f,t); }
      case 'replace-each': { const f=$('.sp-re-find')?.value.split('\n').filter(Boolean),t=$('.sp-re-to')?.value.split('\n').filter(Boolean);let r=data;for(let i=0;i<f.length;i++)if(t[i]!==undefined)r=r.replaceAll(f[i],t[i]);return r; }
      case 'overlay': { const s=$('.sp-ov-str')?.value||'',start=parseInt($('.sp-ov-start')?.value)||0,end=parseInt($('.sp-ov-end')?.value)||0;return data.split('\n').map(l=>l.slice(0,start)+s+l.slice(end)).join('\n'); }
      case 'rotate': { const n=parseInt($('.sp-rot-n')?.value)||3;return data.split('\n').map(l=>{const len=l.length;if(!len)return l;const offset=((n%len)+len)%len;return l.slice(len-offset)+l.slice(0,len-offset);}).join('\n'); }
      case 'reverse-delimited': { const s=$('.sp-rd-sep')?.value||'.';return data.split('\n').map(l=>l.split(s).reverse().join(s)).join('\n'); }
      case 'chomp': return data.split('\n').map(l=>l.replace(/\r?\n?$/,'')).join('\n');
      case 'chop': return data.split('\n').map(l=>l.slice(0,-1)).join('\n');
      case 'left': { const n=parseInt($('.sp-left-n')?.value)||3;return data.split('\n').map(l=>l.slice(0,n)).join('\n'); }
      case 'right': { const n=parseInt($('.sp-right-n')?.value)||3;return data.split('\n').map(l=>l.slice(-n)).join('\n'); }
      case 'mid': { const pos=parseInt($('.sp-mid-pos')?.value)||0,len=parseInt($('.sp-mid-len')?.value)||3;return data.split('\n').map(l=>l.slice(pos,pos+len)).join('\n'); }
      case 'substring-before': { const s=$('.sp-sb-sep')?.value||'';if(!s)return data;return data.split('\n').map(l=>{const i=l.indexOf(s);return i>=0?l.slice(0,i):l;}).join('\n'); }
      case 'substring-after': { const s=$('.sp-sa-sep')?.value||'';if(!s)return data;return data.split('\n').map(l=>{const i=l.indexOf(s);return i>=0?l.slice(i+s.length):l;}).join('\n'); }
      case 'substring-between': { const o=$('.sp-sb-open')?.value||'',c=$('.sp-sb-close')?.value||'';if(!o||!c)return data;return data.split('\n').map(l=>{const s=l.indexOf(o);if(s<0)return '';const e=l.indexOf(c,s+o.length);return e>=0?l.slice(s+o.length,e):'';}).join('\n'); }
      case 'unwrap': { const c=$('.sp-unwrap-c')?.value||'"';return data.split('\n').map(l=>{if(l.startsWith(c)&&l.endsWith(c)&&l.length>=2)return l.slice(c.length,-c.length);return l;}).join('\n'); }
      case 'default-if-blank': { const d=$('.sp-dib-def')?.value||'';return data.split('\n').map(l=>l.trim()?l:d).join('\n'); }
      case 'unqualify': { const s=$('.sp-unqual-sep')?.value||'.';return data.split('\n').map(l=>{const i=l.lastIndexOf(s);return i>=0?l.slice(i+s.length):l;}).join('\n'); }
      case 'simple-match': { const p=$('.sp-sm-pat')?.value||'*';const re=new RegExp('^'+p.replace(/\*/g,'.*').replace(/\?/g,'.')+'$');return data.split('\n').filter(l=>re.test(l)).join('\n'); }
      case 'contains-any': { const c=$('.sp-cany-chars')?.value||'';const set=new Set(c);return data.split('\n').filter(l=>l.split('').some(ch=>set.has(ch))).join('\n'); }
      case 'contains-none': { const c=$('.sp-cnone-chars')?.value||'';const set=new Set(c);return data.split('\n').filter(l=>!l.split('').some(ch=>set.has(ch))).join('\n'); }
      case 'contains-only': { const c=$('.sp-conly-chars')?.value||'';const set=new Set(c);return data.split('\n').filter(l=>l.split('').every(ch=>set.has(ch))).join('\n'); }
      case 'is-alpha': return data.split('\n').filter(l=>/^[A-Za-z]+$/.test(l)).join('\n');
      case 'is-numeric': return data.split('\n').filter(l=>/^\d+$/.test(l)).join('\n');
      case 'is-alphanumeric': return data.split('\n').filter(l=>/^[A-Za-z0-9]+$/.test(l)).join('\n');
      case 'is-all-lower': return data.split('\n').filter(l=>l===l.toLowerCase()&&/[a-z]/.test(l)).join('\n');
      case 'is-all-upper': return data.split('\n').filter(l=>l===l.toUpperCase()&&/[A-Z]/.test(l)).join('\n');
      case 'ordinal-index-of': { const sub=$('.sp-oi-sub')?.value||'',n=parseInt($('.sp-oi-n')?.value)||2;if(!sub)return data;return data.split('\n').map(l=>{let idx=-1;for(let i=0;i<n;i++){idx=l.indexOf(sub,idx+1);if(idx<0)break;}return `${l} | ${idx}`;}).join('\n'); }
      /* ===== 更多语言/库 ===== */
      case 'collapse-spaces': { const c=$('.sp-cs-replace')?.value||' ';return data.split('\n').map(l=>l.replace(/\s+/g,c)).join('\n'); }
      case 'split-lines': return data.split('\n').flatMap(l=>l.split(/\r?\n/)).join('\n');
      case 'translate': { const f=$('.sp-tr-from')?.value||'',t=$('.sp-tr-to')?.value||'';if(!f)return data;const map={};for(let i=0;i<f.length;i++)map[f[i]]=t[i]||'';return data.split('\n').map(l=>l.split('').map(c=>map[c]!==undefined?map[c]:c).join('')).join('\n'); }
      case 'remove-chars': { const c=$('.sp-rc-chars')?.value||'';const re=new RegExp(`[${StringPipelineUtils.escapeRegex(c)}]`,'g');return data.split('\n').map(l=>l.replace(re,'')).join('\n'); }
      case 'retain-chars': { const c=$('.sp-rt-chars')?.value||'';const set=new Set(c);return data.split('\n').map(l=>l.split('').filter(ch=>set.has(ch)).join('')).join('\n'); }
      case 'common-prefix': { const lines=data.split('\n').filter(l=>l.trim());if(!lines.length)return '';let p=lines[0];for(let i=1;i<lines.length;i++){while(lines[i].indexOf(p)!==0)p=p.slice(0,-1);}return p; }
      case 'common-suffix': { const lines=data.split('\n').filter(l=>l.trim());if(!lines.length)return '';let s=lines[0];for(let i=1;i<lines.length;i++){while(lines[i].indexOf(s)!==lines[i].length-s.length&&s.length>0)s=s.slice(1);}return s; }
      case 'insert': { const pos=parseInt($('.sp-ins-pos')?.value)||0,t=$('.sp-ins-text')?.value||'';return data.split('\n').map(l=>l.slice(0,pos)+t+l.slice(pos)).join('\n'); }
      case 'replace-by-pos': { const pos=parseInt($('.sp-rbp-pos')?.value)||0,len=parseInt($('.sp-rbp-len')?.value)||1,t=$('.sp-rbp-text')?.value||'';return data.split('\n').map(l=>l.slice(0,pos)+t+l.slice(pos+len)).join('\n'); }
      case 'start-case': return data.split('\n').map(l=>l.replace(/\b\w/g,c=>c.toUpperCase())).join('\n');
      case 'words': return data.split('\n').flatMap(l=>l.trim()?l.split(/\s+/):[]).join('\n');
      case 'escape-regex': return data.split('\n').map(l=>l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\n');
      case 'strip-tags': { const allow=$('.sp-strip-tags')?.value||'';if(allow){const tags=allow.split(',').map(t=>t.trim()).filter(Boolean);const re=new RegExp(`<\/?(${tags.join('|')})(\\s[^>]*)?>|<[^>]*>`,'gi');return data.replace(re,'');}return data.replace(/<[^>]*>/g,''); }
      case 'is-title-case': return data.split('\n').filter(l=>/^[A-Z]/.test(l)&&l===l.replace(/\b\w/g,c=>c.toUpperCase())).join('\n');
      case 'length': return data.split('\n').map(l=>`${l.length} | ${l}`).join('\n');
      case 'word-count': return data.split('\n').map(l=>{const c=l.trim()?l.split(/\s+/).length:0;return `${c} | ${l}`;}).join('\n');
      case 'format': { const fmt=$('.sp-fmt-tpl')?.value||'{0}';return data.split('\n').map((l,i)=>{const parts=l.split(/\s+/);return fmt.replace(/\{(\d+)\}/g,(_,n)=>parts[parseInt(n)]||'');}).join('\n'); }
      case 'substr': { const s=parseInt($('.sp-substr-start')?.value)||0,len=parseInt($('.sp-substr-len')?.value)||0;return data.split('\n').map(l=>len>0?l.substr(s,len):l.substr(s)).join('\n'); }
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
      if (t.includes('-')) { const [s,e]=t.split('-').map(Number); for(let i=s;i<=e;i++) cols.push(i); }
      else cols.push(Number(t));
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
          return c[part] !== undefined ? [c[part]] : [];
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
    // Simple MD5 implementation for browser compatibility
    const md5cycle = (x, k) => {
      let a=x[0],b=x[1],c=x[2],d=x[3];
      a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
      a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
      a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
      a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
      a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
      a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
      a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
      a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
      a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
      a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
      a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
      a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
      a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
      a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
      a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
      a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
      return [a,b,c,d].map((n,i)=>x[i]+n);
    };
    const cmn=(q,a,b,x,s,t)=>((a+q+x+t)<<s|(a+q+x+t)>>>(32-s))+b;
    const ff=(a,b,c,d,x,s,t)=>cmn((b&c)|((~b)&d),a,b,x,s,t);
    const gg=(a,b,c,d,x,s,t)=>cmn((b&d)|(c&(~d)),a,b,x,s,t);
    const hh=(a,b,c,d,x,s,t)=>cmn(b^c^d,a,b,x,s,t);
    const ii=(a,b,c,d,x,s,t)=>cmn(c^(b|(~d)),a,b,x,s,t);
    const str2binl = (s) => {
      const bin = []; let mask = (1<<8)-1;
      for(let i=0; i<s.length*8; i+=8) bin[i>>5] |= (s.charCodeAt(i/8) & mask) << (i%32);
      return bin;
    };
    const binl2hex = (bin) => {
      const hex = '0123456789abcdef';
      let str = '';
      for(let i=0; i<bin.length*4; i++) str += hex.charAt((bin[i>>2]>>((i%4)*8+4))&0xF) + hex.charAt((bin[i>>2]>>((i%4)*8))&0xF);
      return str;
    };
    const x = str2binl(unescape(encodeURIComponent(str)));
    const len = str.length*8;
    x[len>>5] |= 0x80 << (len%32);
    x[((len+64>>>9)<<4)+14] = len;
    let a=[1732584193,-271733879,-1732584194,271733878];
    for(let i=0; i<x.length; i+=16) a=md5cycle(a,x.slice(i,i+16));
    return binl2hex(a);
  }
};