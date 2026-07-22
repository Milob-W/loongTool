const CsvTools = {
  init() {
    this.renderCsvProcess();
  },

  renderCsvProcess() {
    document.getElementById('panel-csv-process').innerHTML = `
      <div class="card">
        <div class="card-header">输入 CSV 数据</div>
        <div class="card-body">
          <textarea id="csv-input" class="large" placeholder="每行输入数据，例如：&#10;name,age,city&#10;张三,30,北京&#10;李四,25,上海&#10;王五,35,广州"></textarea>
          <div class="status-bar" id="csv-status">0 行 × 0 列</div>
          <div class="btn-group mt-2">
            <input type="file" id="csv-file" accept=".csv,.tsv,.txt" style="display:none" onchange="CsvTools.loadFile(event)">
            <button class="btn btn-sm" onclick="document.getElementById('csv-file').click()">📂 上传文件</button>
            <button class="btn btn-sm" onclick="CsvTools.clearAll()">🗑️ 清空</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">基本设置</div>
          <div class="card-body">
            <div class="form-row">
              <label>分隔符</label>
              <select id="csv-delimiter">
                <option value=",">逗号 ,</option>
                <option value="\t">制表符 Tab</option>
                <option value="|">竖线 |</option>
                <option value=";">分号 ;</option>
                <option value="custom">自定义</option>
              </select>
              <input type="text" id="csv-delimiter-custom" placeholder="自定义" style="display:none;width:80px">
            </div>
            <div class="form-row">
              <label><input type="checkbox" id="csv-has-header" checked> 首行为表头</label>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">处理模式</div>
          <div class="card-body">
            <div class="form-row">
              <select id="csv-process-type" onchange="CsvTools.onTypeChange()" style="width:100%">
                <option value="row">📋 按行处理</option>
                <option value="column">📊 按列处理</option>
                <option value="find-replace">🔍 查找替换</option>
                <option value="regex">🧪 正则匹配/替换</option>
                <option value="clean">🧹 数据清洗</option>
                <option value="to-sql">🗃️ 转 SQL</option>
                <option value="to-json">📦 转 JSON</option>
                <option value="to-md">📝 转 Markdown</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div id="csv-opts-row" class="card mt-2">
        <div class="card-header">按行处理</div>
        <div class="card-body">
          <div class="form-row">
            <label>操作</label>
            <select id="csv-row-action" onchange="CsvTools.onRowActionChange()">
              <option value="filter">过滤行（关键词）</option>
              <option value="condition">条件筛选</option>
              <option value="sort">排序</option>
              <option value="deduplicate">去重</option>
              <option value="dedup-by-col">按列去重</option>
              <option value="reverse">反转</option>
              <option value="limit">限制行数</option>
              <option value="sample">随机抽样</option>
              <option value="add-row-num">添加行号</option>
            </select>
          </div>
          <div class="form-row" id="csv-filter-opts">
            <label>关键词</label>
            <input type="text" id="csv-filter-kw" placeholder="包含此关键词的行" style="flex:1">
            <label><input type="checkbox" id="csv-filter-exclude"> 排除</label>
          </div>
          <div class="form-row" id="csv-condition-opts" style="display:none">
            <select id="csv-cond-col" style="width:120px"><option value="0">第一列</option></select>
            <select id="csv-cond-op">
              <option value="contains">包含</option>
              <option value="not-contains">不包含</option>
              <option value="eq">等于</option>
              <option value="ne">不等于</option>
              <option value="gt">大于</option>
              <option value="gte">大于等于</option>
              <option value="lt">小于</option>
              <option value="lte">小于等于</option>
              <option value="starts-with">开头是</option>
              <option value="ends-with">结尾是</option>
              <option value="regex">匹配正则</option>
              <option value="empty">为空</option>
              <option value="not-empty">不为空</option>
            </select>
            <input type="text" id="csv-cond-val" placeholder="比较值" style="flex:1">
          </div>
          <div class="form-row" id="csv-sort-opts" style="display:none">
            <label>排序列</label>
            <select id="csv-sort-col" style="width:120px"><option value="0">第一列</option></select>
            <select id="csv-sort-order"><option value="asc">升序</option><option value="desc">降序</option></select>
            <label><input type="checkbox" id="csv-sort-num"> 数字排序</label>
          </div>
          <div class="form-row" id="csv-dedupcol-opts" style="display:none">
            <label>去重列</label>
            <select id="csv-dedup-col" style="width:120px"><option value="0">第一列</option></select>
            <label><input type="checkbox" id="csv-dedup-keep-first" checked> 保留首条</label>
          </div>
          <div class="form-row" id="csv-limit-opts" style="display:none">
            <label>最大行数</label>
            <input type="number" id="csv-limit-count" value="10" min="1">
          </div>
          <div class="form-row" id="csv-sample-opts" style="display:none">
            <label>抽样行数</label>
            <input type="number" id="csv-sample-count" value="5" min="1">
          </div>
        </div>
      </div>

      <div id="csv-opts-column" class="card mt-2" style="display:none">
        <div class="card-header">按列处理</div>
        <div class="card-body">
          <div class="form-row">
            <label>操作</label>
            <select id="csv-col-action" onchange="CsvTools.onColActionChange()">
              <option value="select">选择列</option>
              <option value="exclude">排除列</option>
              <option value="rename">重命名列</option>
              <option value="reorder">列重排序</option>
              <option value="merge">合并列</option>
              <option value="split">拆分列</option>
              <option value="insert">插入列</option>
              <option value="delete">删除列</option>
              <option value="swap">交换列</option>
              <option value="trim">去除首尾空格</option>
              <option value="upper">转大写</option>
              <option value="lower">转小写</option>
              <option value="fill-empty">填充空值</option>
            </select>
          </div>
          <div class="form-row" id="csv-col-select-opts">
            <label>列号</label>
            <input type="text" id="csv-col-select" placeholder="如: 1,2,3 或 1-3" style="flex:1">
            <span class="hint">列号从 1 开始</span>
          </div>
          <div class="form-row" id="csv-col-rename-opts" style="display:none">
            <label>新列名</label>
            <input type="text" id="csv-col-rename" placeholder="如: 姓名,年龄,城市" style="flex:1">
          </div>
          <div class="form-row" id="csv-col-reorder-opts" style="display:none">
            <label>列顺序</label>
            <input type="text" id="csv-col-reorder" placeholder="如: 3,1,2" style="flex:1">
          </div>
          <div class="form-row" id="csv-col-merge-opts" style="display:none">
            <label>合并列</label>
            <input type="text" id="csv-col-merge" placeholder="如: 1,2" style="flex:1">
            <label>分隔符</label>
            <input type="text" id="csv-col-merge-sep" value="-" style="width:60px">
          </div>
          <div class="form-row" id="csv-col-split-opts" style="display:none">
            <label>拆分列号</label>
            <input type="number" id="csv-col-split" value="1" min="1">
            <label>拆分符</label>
            <input type="text" id="csv-col-split-sep" value="-" style="width:60px">
          </div>
          <div class="form-row" id="csv-col-insert-opts" style="display:none">
            <label>插入位置</label>
            <input type="number" id="csv-col-insert-pos" value="1" min="1">
            <label>列名</label>
            <input type="text" id="csv-col-insert-name" placeholder="新列名">
            <label>默认值</label>
            <input type="text" id="csv-col-insert-val" value="" style="width:80px">
          </div>
          <div class="form-row" id="csv-col-delete-opts" style="display:none">
            <label>删除列</label>
            <input type="text" id="csv-col-delete" placeholder="如: 1,3" style="flex:1">
          </div>
          <div class="form-row" id="csv-col-swap-opts" style="display:none">
            <label>交换列</label>
            <input type="number" id="csv-col-swap-a" value="1" min="1" style="width:60px">
            <span>↔</span>
            <input type="number" id="csv-col-swap-b" value="2" min="1" style="width:60px">
          </div>
          <div class="form-row" id="csv-col-fillempty-opts" style="display:none">
            <label>填充列</label>
            <input type="text" id="csv-col-fill-target" placeholder="如: 1,2 或 all" style="flex:1">
            <label>填充值</label>
            <input type="text" id="csv-col-fill-val" value="N/A" style="width:80px">
          </div>
        </div>
      </div>

      <div id="csv-opts-findreplace" class="card mt-2" style="display:none">
        <div class="card-header">查找替换</div>
        <div class="card-body">
          <div class="form-row">
            <label>查找</label>
            <input type="text" id="csv-fr-find" placeholder="要查找的文本" style="flex:1">
          </div>
          <div class="form-row">
            <label>替换</label>
            <input type="text" id="csv-fr-replace" placeholder="替换为（留空则删除）" style="flex:1">
          </div>
          <div class="form-row">
            <label>范围</label>
            <select id="csv-fr-scope">
              <option value="all">全部列</option>
              <option value="col">指定列</option>
            </select>
            <input type="text" id="csv-fr-col" placeholder="列号" style="display:none;width:80px">
          </div>
          <div class="form-row">
            <label><input type="checkbox" id="csv-fr-case"> 区分大小写</label>
            <label><input type="checkbox" id="csv-fr-word"> 全字匹配</label>
          </div>
        </div>
      </div>

      <div id="csv-opts-regex" class="card mt-2" style="display:none">
        <div class="card-header">正则匹配/替换</div>
        <div class="card-body">
          <div class="form-row">
            <label>正则表达式</label>
            <input type="text" id="csv-regex-pattern" placeholder="如: \\d+|[a-zA-Z]+" style="flex:1;font-family:monospace">
          </div>
          <div class="form-row">
            <label>替换为</label>
            <input type="text" id="csv-regex-replace" placeholder="替换文本（支持 $1 $2）" style="flex:1;font-family:monospace">
          </div>
          <div class="form-row">
            <label>操作</label>
            <select id="csv-regex-action">
              <option value="replace">替换匹配内容</option>
              <option value="extract">提取匹配内容</option>
              <option value="extract-group">提取捕获组</option>
              <option value="filter-regex">保留匹配行</option>
              <option value="remove-regex">删除匹配行</option>
              <option value="highlight">高亮匹配（加[]）</option>
            </select>
          </div>
          <div class="form-row">
            <label>范围</label>
            <select id="csv-regex-scope">
              <option value="all">全部列</option>
              <option value="col">指定列</option>
            </select>
            <input type="text" id="csv-regex-col" placeholder="列号" style="display:none;width:80px">
          </div>
          <div class="form-row">
            <label>标志</label>
            <label><input type="checkbox" id="csv-regex-global" checked> 全局(g)</label>
            <label><input type="checkbox" id="csv-regex-multiline"> 多行(m)</label>
            <label><input type="checkbox" id="csv-regex-ignore"> 忽略大小写(i)</label>
          </div>
        </div>
      </div>

      <div id="csv-opts-clean" class="card mt-2" style="display:none">
        <div class="card-header">数据清洗</div>
        <div class="card-body">
          <div class="form-row">
            <label>清洗操作</label>
            <select id="csv-clean-action">
              <option value="trim-all">去除所有单元格首尾空格</option>
              <option value="remove-empty-rows">删除空行</option>
              <option value="remove-empty-cols">删除全空列</option>
              <option value="remove-dup-rows">删除重复行</option>
              <option value="remove-special">删除特殊字符</option>
              <option value="normalize-space">统一空白字符（多个空格合并为1个）</option>
              <option value="remove-html">去除 HTML 标签</option>
              <option value="remove-non-ascii">去除非 ASCII 字符</option>
              <option value="replace-nl">换行符替换为空格</option>
              <option value="remove-leading-zeros">去除前导零</option>
              <option value="title-case">首字母大写</option>
            </select>
          </div>
        </div>
      </div>

      <div id="csv-opts-sql" class="card mt-2" style="display:none">
        <div class="card-header">转 SQL</div>
        <div class="card-body">
          <div class="form-row">
            <label>表名</label>
            <input type="text" id="csv-sql-table" placeholder="table_name" style="flex:1">
          </div>
          <div class="form-row">
            <label>数据库</label>
            <select id="csv-sql-type">
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlserver">SQL Server</option>
              <option value="sqlite">SQLite</option>
              <option value="oracle">Oracle</option>
            </select>
          </div>
          <div class="form-row">
            <label><input type="checkbox" id="csv-sql-create"> 生成建表语句</label>
            <label><input type="checkbox" id="csv-sql-nullable"> 允许 NULL</label>
          </div>
          <div class="form-row">
            <label>INSERT 模式</label>
            <select id="csv-sql-insert-mode">
              <option value="single">单行 INSERT</option>
              <option value="batch">批量 INSERT</option>
            </select>
            <input type="number" id="csv-sql-batch-size" value="100" min="1" style="width:80px;display:none">
          </div>
        </div>
      </div>

      <div id="csv-opts-json" class="card mt-2" style="display:none">
        <div class="card-header">转 JSON</div>
        <div class="card-body">
          <div class="form-row">
            <label>JSON 格式</label>
            <select id="csv-json-format">
              <option value="array">对象数组（推荐）</option>
              <option value="nested">嵌套对象</option>
              <option value="key-value">键值对</option>
            </select>
          </div>
          <div class="form-row">
            <label>缩进</label>
            <select id="csv-json-indent">
              <option value="2">2 空格</option>
              <option value="4">4 空格</option>
              <option value="0">压缩</option>
            </select>
          </div>
        </div>
      </div>

      <div id="csv-opts-md" class="card mt-2" style="display:none">
        <div class="card-header">转 Markdown</div>
        <div class="card-body">
          <div class="form-row">
            <label>对齐方式</label>
            <select id="csv-md-align">
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card mt-2">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn" onclick="CsvTools.process()">🚀 执行处理</button>
            <button class="btn btn-sm" onclick="CsvTools.copyOutput()">📋 复制结果</button>
            <button class="btn btn-sm" onclick="CsvTools.downloadOutput()">💾 下载</button>
            <button class="btn btn-sm" onclick="CsvTools.undo()">↩️ 撤销</button>
            <button class="btn btn-sm" onclick="CsvTools.redo()">↪️ 重做</button>
          </div>
        </div>
      </div>

      <div class="card mt-2">
        <div class="card-header">输出结果</div>
        <div class="card-body">
          <textarea id="csv-output" class="large" readonly placeholder="处理结果将显示在这里..."></textarea>
          <div class="status-bar mt-2" id="csv-output-status"></div>
        </div>
      </div>

      <div class="card mt-2">
        <div class="card-header">预览表格</div>
        <div class="card-body">
          <div id="csv-preview" style="overflow-x:auto"></div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateStatus();
  },

  bindEvents() {
    const $ = id => document.getElementById(id);
    $('csv-delimiter').addEventListener('change', () => {
      $('csv-delimiter-custom').style.display = $('csv-delimiter').value === 'custom' ? 'inline-block' : 'none';
    });
    $('csv-row-action').addEventListener('change', () => this.onRowActionChange());
    $('csv-col-action').addEventListener('change', () => this.onColActionChange());
    $('csv-fr-scope').addEventListener('change', () => {
      $('csv-fr-col').style.display = $('csv-fr-scope').value === 'col' ? 'inline-block' : 'none';
    });
    $('csv-regex-scope').addEventListener('change', () => {
      $('csv-regex-col').style.display = $('csv-regex-scope').value === 'col' ? 'inline-block' : 'none';
    });
    $('csv-sql-insert-mode').addEventListener('change', () => {
      $('csv-sql-batch-size').style.display = $('csv-sql-insert-mode').value === 'batch' ? 'inline-block' : 'none';
    });
    $('csv-input').addEventListener('input', () => this.updateStatus());
  },

  /* ========== 状态管理 ========== */
  history: [],
  historyIdx: -1,

  pushHistory(csvText) {
    this.history = this.history.slice(0, this.historyIdx + 1);
    this.history.push(csvText);
    this.historyIdx = this.history.length - 1;
  },

  undo() {
    if (this.historyIdx > 0) {
      this.historyIdx--;
      document.getElementById('csv-input').value = this.history[this.historyIdx];
      this.updateStatus();
      showToast('已撤销');
    }
  },

  redo() {
    if (this.historyIdx < this.history.length - 1) {
      this.historyIdx++;
      document.getElementById('csv-input').value = this.history[this.historyIdx];
      this.updateStatus();
      showToast('已重做');
    }
  },

  updateStatus() {
    const input = document.getElementById('csv-input').value.trim();
    const lines = input ? input.split('\n').filter(l => l.trim()) : [];
    let cols = 0;
    if (lines.length > 0) {
      const d = this.getDelimiter();
      cols = lines[0].split(d).length;
    }
    document.getElementById('csv-status').textContent = `${lines.length} 行 × ${cols} 列`;
  },

  getDelimiter() {
    let d = document.getElementById('csv-delimiter').value;
    if (d === 'custom') d = document.getElementById('csv-delimiter-custom').value || ',';
    return d;
  },

  /* ========== UI 切换 ========== */
  onTypeChange() {
    const type = document.getElementById('csv-process-type').value;
    ['row','column','find-replace','regex','clean','to-sql','to-json','to-md'].forEach(t => {
      const el = document.getElementById('csv-opts-' + t.replace('-',''));
      if (el) el.style.display = t === type ? 'block' : 'none';
    });
    const map = {
      'row': 'csv-opts-row', 'column': 'csv-opts-column',
      'find-replace': 'csv-opts-findreplace', 'regex': 'csv-opts-regex',
      'clean': 'csv-opts-clean', 'to-sql': 'csv-opts-sql',
      'to-json': 'csv-opts-json', 'to-md': 'csv-opts-md'
    };
    Object.keys(map).forEach(k => {
      const el = document.getElementById(map[k]);
      if (el) el.style.display = k === type ? 'block' : 'none';
    });
  },

  onRowActionChange() {
    const a = document.getElementById('csv-row-action').value;
    const map = {
      filter: 'csv-filter-opts', condition: 'csv-condition-opts',
      sort: 'csv-sort-opts', 'dedup-by-col': 'csv-dedupcol-opts',
      limit: 'csv-limit-opts', sample: 'csv-sample-opts'
    };
    Object.keys(map).forEach(k => {
      const el = document.getElementById(map[k]);
      if (el) el.style.display = k === a ? 'flex' : 'none';
    });
    this.updateColumnSelects();
  },

  onColActionChange() {
    const a = document.getElementById('csv-col-action').value;
    const map = {
      select: 'csv-col-select-opts', exclude: 'csv-col-select-opts',
      rename: 'csv-col-rename-opts', reorder: 'csv-col-reorder-opts',
      merge: 'csv-col-merge-opts', split: 'csv-col-split-opts',
      insert: 'csv-col-insert-opts', delete: 'csv-col-delete-opts',
      swap: 'csv-col-swap-opts', 'fill-empty': 'csv-col-fillempty-opts'
    };
    Object.keys(map).forEach(k => {
      const el = document.getElementById(map[k]);
      if (el) el.style.display = k === a ? 'flex' : 'none';
    });
  },

  updateColumnSelects() {
    const input = document.getElementById('csv-input').value.trim();
    if (!input) return;
    const d = this.getDelimiter();
    const hasHeader = document.getElementById('csv-has-header').checked;
    const lines = input.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    const headers = hasHeader ? lines[0].split(d).map(s => s.trim()) : [];
    const cols = hasHeader ? headers : lines[0].split(d).map((_, i) => `列${i+1}`);
    const opts = cols.map((c, i) => `<option value="${i}">${i+1}. ${c}</option>`).join('');
    ['csv-sort-col','csv-dedup-col'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = opts;
    });
  },

  /* ========== 文件操作 ========== */
  loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('csv-input').value = e.target.result;
      this.pushHistory(e.target.result);
      this.updateStatus();
    };
    reader.readAsText(file);
  },

  clearAll() {
    document.getElementById('csv-input').value = '';
    document.getElementById('csv-output').value = '';
    document.getElementById('csv-preview').innerHTML = '';
    document.getElementById('csv-output-status').textContent = '';
    this.updateStatus();
  },

  /* ========== 解析 CSV ========== */
  parseCsv(text, delimiter, hasHeader) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return { headers: [], data: [] };
    const parseRow = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === delimiter && !inQuotes) { result.push(current); current = ''; }
        else { current += ch; }
      }
      result.push(current);
      return result;
    };
    const headers = hasHeader ? parseRow(lines[0]) : [];
    const data = [];
    for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
      if (lines[i].trim()) data.push(parseRow(lines[i]));
    }
    return { headers, data };
  },

  toCsv(headers, data, delimiter) {
    const lines = [];
    if (headers.length > 0) lines.push(headers.join(delimiter));
    data.forEach(row => lines.push(row.join(delimiter)));
    return lines.join('\n');
  },

  parseColumns(str) {
    if (!str) return [];
    const cols = [];
    str.split(',').forEach(p => {
      if (p.includes('-')) {
        const [a, b] = p.split('-').map(Number);
        for (let i = a; i <= b; i++) cols.push(i);
      } else { cols.push(parseInt(p)); }
    });
    return [...new Set(cols)].sort((a, b) => a - b);
  },

  /* ========== 主处理入口 ========== */
  process() {
    const input = document.getElementById('csv-input').value.trim();
    if (!input) { showToast('请输入数据'); return; }
    const d = this.getDelimiter();
    const hasHeader = document.getElementById('csv-has-header').checked;
    const { headers, data } = this.parseCsv(input, d, hasHeader);
    if (data.length === 0) { showToast('无有效数据'); return; }
    const type = document.getElementById('csv-process-type').value;
    let result = '';
    switch (type) {
      case 'row': result = this.procRows(data, headers, d, hasHeader); break;
      case 'column': result = this.procCols(data, headers, d, hasHeader); break;
      case 'find-replace': result = this.procFindReplace(data, headers, d, hasHeader); break;
      case 'regex': result = this.procRegex(data, headers, d, hasHeader); break;
      case 'clean': result = this.procClean(data, headers, d, hasHeader); break;
      case 'to-sql': result = this.procSql(data, headers); break;
      case 'to-json': result = this.procJson(data, headers); break;
      case 'to-md': result = this.procMarkdown(data, headers); break;
    }
    document.getElementById('csv-output').value = result;
    this.pushHistory(result);
    this.updatePreview(result, d, hasHeader);
    this.updateOutputStatus(result);
  },

  updateOutputStatus(result) {
    const lines = result ? result.split('\n').filter(l => l.trim()) : [];
    document.getElementById('csv-output-status').textContent = `结果: ${lines.length} 行`;
  },

  /* ========== 按行处理 ========== */
  procRows(data, headers, d, hasHeader) {
    const action = document.getElementById('csv-row-action').value;
    let result = [...data];
    const $ = id => document.getElementById(id);
    switch (action) {
      case 'filter': {
        const kw = $('csv-filter-kw').value.toLowerCase();
        const excl = $('csv-filter-exclude').checked;
        result = result.filter(row => {
          const s = row.join(d).toLowerCase();
          return excl ? !s.includes(kw) : s.includes(kw);
        });
        break;
      }
      case 'condition': {
        const col = parseInt($('csv-cond-col').value);
        const op = $('csv-cond-op').value;
        const val = $('csv-cond-val').value;
        result = result.filter(row => {
          const cell = (row[col] || '').trim();
          const num = parseFloat(cell);
          const valNum = parseFloat(val);
          switch (op) {
            case 'contains': return cell.toLowerCase().includes(val.toLowerCase());
            case 'not-contains': return !cell.toLowerCase().includes(val.toLowerCase());
            case 'eq': return cell === val;
            case 'ne': return cell !== val;
            case 'gt': return !isNaN(num) && !isNaN(valNum) && num > valNum;
            case 'gte': return !isNaN(num) && !isNaN(valNum) && num >= valNum;
            case 'lt': return !isNaN(num) && !isNaN(valNum) && num < valNum;
            case 'lte': return !isNaN(num) && !isNaN(valNum) && num <= valNum;
            case 'starts-with': return cell.toLowerCase().startsWith(val.toLowerCase());
            case 'ends-with': return cell.toLowerCase().endsWith(val.toLowerCase());
            case 'regex': try { return new RegExp(val).test(cell); } catch (e) { return false; }
            case 'empty': return cell === '';
            case 'not-empty': return cell !== '';
            default: return true;
          }
        });
        break;
      }
      case 'sort': {
        const col = parseInt($('csv-sort-col').value);
        const order = $('csv-sort-order').value;
        const isNum = $('csv-sort-num').checked;
        result.sort((a, b) => {
          const av = (a[col] || '').trim(), bv = (b[col] || '').trim();
          if (isNum) {
            const an = parseFloat(av), bn = parseFloat(bv);
            if (!isNaN(an) && !isNaN(bn)) return order === 'asc' ? an - bn : bn - an;
          }
          return order === 'asc' ? av.localeCompare(bv, 'zh') : bv.localeCompare(av, 'zh');
        });
        break;
      }
      case 'deduplicate': {
        const seen = new Set();
        result = result.filter(row => { const k = row.join(d); if (seen.has(k)) return false; seen.add(k); return true; });
        break;
      }
      case 'dedup-by-col': {
        const col = parseInt($('csv-dedup-col').value);
        const keepFirst = $('csv-dedup-keep-first').checked;
        const seen = new Set();
        result = result.filter(row => {
          const k = row[col] || '';
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        break;
      }
      case 'reverse': result.reverse(); break;
      case 'limit': {
        const n = parseInt($('csv-limit-count').value) || 10;
        result = result.slice(0, n);
        break;
      }
      case 'sample': {
        const n = parseInt($('csv-sample-count').value) || 5;
        const shuffled = [...result].sort(() => Math.random() - 0.5);
        result = shuffled.slice(0, Math.min(n, result.length));
        break;
      }
      case 'add-row-num': {
        result = result.map((row, i) => [String(i + 1), ...row]);
        if (headers.length > 0) headers.unshift('行号');
        break;
      }
    }
    return this.toCsv(headers, result, d);
  },

  /* ========== 按列处理 ========== */
  procCols(data, headers, d, hasHeader) {
    const action = document.getElementById('csv-col-action').value;
    let result = [...data];
    let h = [...headers];
    const $ = id => document.getElementById(id);
    switch (action) {
      case 'select': {
        const cols = this.parseColumns($('csv-col-select').value);
        result = result.map(row => cols.map(i => row[i-1] || ''));
        h = cols.map(i => headers[i-1] || `列${i}`);
        break;
      }
      case 'exclude': {
        const cols = this.parseColumns($('csv-col-select').value);
        result = result.map(row => row.filter((_, i) => !cols.includes(i+1)));
        h = headers.filter((_, i) => !cols.includes(i+1));
        break;
      }
      case 'rename': {
        const names = $('csv-col-rename').value.split(',').map(s => s.trim());
        h = names;
        break;
      }
      case 'reorder': {
        const order = this.parseColumns($('csv-col-reorder').value);
        result = result.map(row => order.map(i => row[i-1] || ''));
        h = order.map(i => headers[i-1] || `列${i}`);
        break;
      }
      case 'merge': {
        const cols = this.parseColumns($('csv-col-merge').value);
        const sep = $('csv-col-merge-sep').value;
        result = result.map(row => {
          const merged = cols.map(i => row[i-1] || '').join(sep);
          return [merged, ...row.filter((_, i) => !cols.includes(i+1))];
        });
        h = [headers[cols[0]-1] + '_合并', ...headers.filter((_, i) => !cols.includes(i+1))];
        break;
      }
      case 'split': {
        const col = parseInt($('csv-col-split').value) || 1;
        const sep = $('csv-col-split-sep').value || '-';
        const maxParts = Math.max(...result.map(row => (row[col-1] || '').split(sep).length));
        result = result.map(row => {
          const parts = (row[col-1] || '').split(sep);
          while (parts.length < maxParts) parts.push('');
          return [...parts, ...row.filter((_, i) => i !== col-1)];
        });
        h = [];
        for (let i = 1; i <= maxParts; i++) h.push((headers[col-1] || `列${col}`) + '_' + i);
        headers.filter((_, i) => i !== col-1).forEach(name => h.push(name));
        break;
      }
      case 'insert': {
        const pos = parseInt($('csv-col-insert-pos').value) || 1;
        const name = $('csv-col-insert-name').value || '新列';
        const val = $('csv-col-insert-val').value || '';
        result = result.map(row => {
          const r = [...row];
          r.splice(pos - 1, 0, val);
          return r;
        });
        h.splice(pos - 1, 0, name);
        break;
      }
      case 'delete': {
        const cols = this.parseColumns($('csv-col-delete').value);
        result = result.map(row => row.filter((_, i) => !cols.includes(i+1)));
        h = headers.filter((_, i) => !cols.includes(i+1));
        break;
      }
      case 'swap': {
        const a = parseInt($('csv-col-swap-a').value) - 1;
        const b = parseInt($('csv-col-swap-b').value) - 1;
        result = result.map(row => {
          const r = [...row];
          [r[a], r[b]] = [r[b], r[a]];
          return r;
        });
        [h[a], h[b]] = [h[b], h[a]];
        break;
      }
      case 'trim':
        result = result.map(row => row.map(c => c.trim()));
        break;
      case 'upper':
        result = result.map(row => row.map(c => c.toUpperCase()));
        break;
      case 'lower':
        result = result.map(row => row.map(c => c.toLowerCase()));
        break;
      case 'fill-empty': {
        const target = $('csv-col-fill-target').value.trim();
        const fillVal = $('csv-col-fill-val').value;
        if (target === 'all') {
          result = result.map(row => row.map(c => c === '' ? fillVal : c));
        } else {
          const cols = this.parseColumns(target);
          result = result.map(row => row.map((c, i) => cols.includes(i+1) && c === '' ? fillVal : c));
        }
        break;
      }
    }
    return this.toCsv(h, result, d);
  },

  /* ========== 查找替换 ========== */
  procFindReplace(data, headers, d, hasHeader) {
    const find = document.getElementById('csv-fr-find').value;
    const replace = document.getElementById('csv-fr-replace').value;
    const scope = document.getElementById('csv-fr-scope').value;
    const col = parseInt(document.getElementById('csv-fr-col').value) - 1;
    const ignoreCase = !document.getElementById('csv-fr-case').checked;
    const wholeWord = document.getElementById('csv-fr-word').checked;
    let pattern = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    const flags = ignoreCase ? 'gi' : 'g';
    const regex = new RegExp(pattern, flags);
    const result = data.map(row => {
      return row.map((cell, i) => {
        if (scope === 'col' && i !== col) return cell;
        return cell.replace(regex, replace);
      });
    });
    return this.toCsv(headers, result, d);
  },

  /* ========== 正则处理 ========== */
  procRegex(data, headers, d, hasHeader) {
    const pattern = document.getElementById('csv-regex-pattern').value;
    const replace = document.getElementById('csv-regex-replace').value;
    const action = document.getElementById('csv-regex-action').value;
    const scope = document.getElementById('csv-regex-scope').value;
    const col = parseInt(document.getElementById('csv-regex-col').value) - 1;
    const g = document.getElementById('csv-regex-global').checked;
    const m = document.getElementById('csv-regex-multiline').checked;
    const i = document.getElementById('csv-regex-ignore').checked;
    let flags = (g ? 'g' : '') + (m ? 'm' : '') + (i ? 'i' : '');
    let regex;
    try { regex = new RegExp(pattern, flags); } catch (e) { showToast('正则表达式错误: ' + e.message); return ''; }

    const applyToCell = (cell) => {
      const re = new RegExp(pattern, flags);
      switch (action) {
        case 'replace': return cell.replace(re, replace);
        case 'extract': {
          const matches = cell.match(re);
          return matches ? matches.join(', ') : '';
        }
        case 'extract-group': {
          const matches = [];
          let match;
          const re2 = new RegExp(pattern, flags);
          while ((match = re2.exec(cell)) !== null) {
            matches.push(match.slice(1).join(', '));
          }
          return matches.join(', ');
        }
        case 'highlight': return cell.replace(re, function(m) { return '[' + m + ']'; });
        default: return cell;
      }
    };

    if (action === 'filter-regex' || action === 'remove-regex') {
      const keep = action === 'filter-regex';
      const result = data.filter(row => {
        const text = scope === 'col' ? (row[col] || '') : row.join(d);
        return keep === regex.test(text);
      });
      return this.toCsv(headers, result, d);
    }

    const result = data.map(row => {
      return row.map((cell, i) => {
        if (scope === 'col' && i !== col) return cell;
        return applyToCell(cell);
      });
    });
    return this.toCsv(headers, result, d);
  },

  /* ========== 数据清洗 ========== */
  procClean(data, headers, d, hasHeader) {
    const action = document.getElementById('csv-clean-action').value;
    let result = [...data];
    let h = [...headers];
    switch (action) {
      case 'trim-all':
        result = result.map(row => row.map(c => c.trim()));
        break;
      case 'remove-empty-rows':
        result = result.filter(row => row.some(c => c.trim() !== ''));
        break;
      case 'remove-empty-cols': {
        const colCount = h.length || (result[0] ? result[0].length : 0);
        const keepIdx = [];
        for (let i = 0; i < colCount; i++) {
          if (result.some(row => (row[i] || '').trim() !== '')) keepIdx.push(i);
        }
        result = result.map(row => keepIdx.map(i => row[i] || ''));
        h = keepIdx.map(i => h[i] || `列${i+1}`);
        break;
      }
      case 'remove-dup-rows': {
        const seen = new Set();
        result = result.filter(row => { const k = row.join(d); if (seen.has(k)) return false; seen.add(k); return true; });
        break;
      }
      case 'remove-special':
        result = result.map(row => row.map(c => c.replace(/[^\w\s\u4e00-\u9fff.,\-@#%&*()]/g, '')));
        break;
      case 'normalize-space':
        result = result.map(row => row.map(c => c.replace(/\s+/g, ' ').trim()));
        break;
      case 'remove-html':
        result = result.map(row => row.map(c => c.replace(/<[^>]+>/g, '')));
        break;
      case 'remove-non-ascii':
        result = result.map(row => row.map(c => c.replace(/[^\x00-\x7F\u4e00-\u9fff]/g, '')));
        break;
      case 'replace-nl':
        result = result.map(row => row.map(c => c.replace(/[\r\n]+/g, ' ')));
        break;
      case 'remove-leading-zeros':
        result = result.map(row => row.map(c => c.replace(/^0+(?=\d)/, '')));
        break;
      case 'title-case':
        result = result.map(row => row.map(c => c.replace(/\b\w/g, ch => ch.toUpperCase())));
        break;
    }
    return this.toCsv(h, result, d);
  },

  /* ========== 转 SQL ========== */
  procSql(data, headers) {
    const tableName = document.getElementById('csv-sql-table').value || 'table_name';
    const dbType = document.getElementById('csv-sql-type').value;
    const createTable = document.getElementById('csv-sql-create').checked;
    const nullable = document.getElementById('csv-sql-nullable').checked;
    const insertMode = document.getElementById('csv-sql-insert-mode').value;
    const batchSize = parseInt(document.getElementById('csv-sql-batch-size').value) || 100;
    const lines = [];
    if (createTable && headers.length > 0) {
      lines.push(this.genCreateTable(tableName, headers, data, dbType, nullable));
      lines.push('');
    }
    if (insertMode === 'batch') {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const vals = batch.map(row => `(${this.sqlValues(row, dbType)})`).join(',\n  ');
        lines.push(`INSERT INTO ${tableName} (${headers.join(', ')}) VALUES\n  ${vals};`);
      }
    } else {
      data.forEach(row => {
        lines.push(`INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${this.sqlValues(row, dbType)});`);
      });
    }
    return lines.join('\n');
  },

  sqlValues(row, dbType) {
    return row.map(val => {
      if (val === '' || val === null || val === undefined) return 'NULL';
      const num = parseFloat(val);
      if (!isNaN(num) && val.trim() === num.toString()) return val;
      const escaped = val.replace(/'/g, "''");
      return `'${escaped}'`;
    }).join(', ');
  },

  genCreateTable(name, headers, data, dbType, nullable) {
    const nullStr = nullable ? '' : ' NOT NULL';
    const columns = headers.map((h, idx) => {
      let type = `VARCHAR(255)${nullStr}`;
      const samples = data.slice(0, 100).map(r => r[idx]).filter(v => v);
      if (samples.length > 0 && samples.every(v => /^-?\d+$/.test(v))) type = `INT${nullStr}`;
      else if (samples.length > 0 && samples.every(v => /^-?\d+\.\d+$/.test(v))) type = `DECIMAL(10,2)${nullStr}`;
      else if (samples.some(v => /^\d{4}-\d{2}-\d{2}/.test(v))) type = `VARCHAR(50)${nullStr}`;
      return `  ${h} ${type}`;
    });
    const pk = dbType === 'oracle' ? `\n  CONSTRAINT pk_${name} PRIMARY KEY (${headers[0]})` : '';
    return `CREATE TABLE ${name} (\n${columns.join(',\n')}${pk}\n);`;
  },

  /* ========== 转 JSON ========== */
  procJson(data, headers) {
    const format = document.getElementById('csv-json-format').value;
    const indent = parseInt(document.getElementById('csv-json-indent').value);
    let jsonData;
    if (format === 'array') {
      jsonData = data.map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h || `col${i+1}`] = row[i] || ''; });
        return obj;
      });
    } else if (format === 'nested') {
      jsonData = {};
      data.forEach((row, idx) => {
        const key = row[0] || `row${idx}`;
        const obj = {};
        headers.forEach((h, i) => { if (i > 0) obj[h || `col${i+1}`] = row[i] || ''; });
        jsonData[key] = obj;
      });
    } else {
      jsonData = {};
      headers.forEach((h, i) => {
        jsonData[h || `col${i+1}`] = data.map(row => row[i] || '');
      });
    }
    return JSON.stringify(jsonData, null, indent);
  },

  /* ========== 转 Markdown ========== */
  procMarkdown(data, headers) {
    const align = document.getElementById('csv-md-align').value;
    const pad = { left: ':--', center: ':-:', right: '--:' };
    const lines = [];
    lines.push('| ' + headers.join(' | ') + ' |');
    lines.push('| ' + headers.map(() => pad[align]).join(' | ') + ' |');
    data.forEach(row => {
      lines.push('| ' + row.join(' | ') + ' |');
    });
    return lines.join('\n');
  },

  /* ========== 预览 ========== */
  updatePreview(result, delimiter, hasHeader) {
    const preview = document.getElementById('csv-preview');
    if (!result) { preview.innerHTML = ''; return; }
    const { headers, data } = this.parseCsv(result, delimiter, hasHeader);
    if (data.length === 0) { preview.innerHTML = '<p>无数据</p>'; return; }
    let html = '<table class="preview-table"><thead><tr>';
    const cols = headers.length > 0 ? headers : data[0].map((_, i) => `列${i+1}`);
    cols.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    data.forEach(row => {
      html += '<tr>';
      row.forEach(cell => html += `<td>${cell}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    preview.innerHTML = html;
  },

  /* ========== 输出操作 ========== */
  copyOutput() {
    const output = document.getElementById('csv-output');
    output.select();
    document.execCommand('copy');
    showToast('已复制到剪贴板');
  },

  downloadOutput() {
    const output = document.getElementById('csv-output').value;
    if (!output) { showToast('无内容可下载'); return; }
    const type = document.getElementById('csv-process-type').value;
    const ext = { 'to-sql': 'sql', 'to-json': 'json', 'to-md': 'md' }[type] || 'csv';
    const mime = { 'to-json': 'application/json', 'to-md': 'text/markdown', 'to-sql': 'text/plain' }[type] || 'text/csv';
    const blob = new Blob([output], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  },

};