const JsonTools = {
  init() {
    this.renderJsonFormatter();
    this.renderJsonToYaml();
  },

  renderJsonFormatter() {
    document.getElementById('panel-json').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入 JSON</div>
          <div class="card-body">
            <textarea id="jf-input" class="large" placeholder='{"name":"张三","age":30}'></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header relative">输出</div>
          <div class="card-body relative">
            <textarea id="jf-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="JsonTools.formatJson()">格式化</button>
            <button class="btn" onclick="JsonTools.compressJson()">压缩</button>
            <button class="btn" onclick="JsonTools.validateJson()">验证</button>
            <button class="btn" onclick="JsonTools.escapeJson()">转义</button>
            <button class="btn" onclick="JsonTools.unescapeJson()">反转义</button>
            <button class="btn" onclick="JsonTools.jsonToCsv()">转 CSV</button>
          </div>
          <div class="form-row mt-2">
            <label>缩进</label>
            <select id="jf-indent" style="width:80px">
              <option value="2">2 空格</option>
              <option value="4" selected>4 空格</option>
              <option value="tab">Tab</option>
            </select>
          </div>
        </div>
      </div>
      <div class="card" id="jf-tree" style="display:none">
        <div class="card-header">JSON 结构树</div>
        <div class="card-body" id="jf-tree-body"></div>
      </div>
    `;
  },

  getJson() {
    const input = document.getElementById('jf-input').value;
    try {
      return JSON.parse(input);
    } catch (e) {
      this.showToast(`JSON 解析错误: ${e.message}`);
      return null;
    }
  },

  getIndent() {
    const sel = document.getElementById('jf-indent').value;
    if (sel === 'tab') return '\t';
    return parseInt(sel);
  },

  formatJson() {
    const data = this.getJson();
    if (data === null) return;
    document.getElementById('jf-output').value = JSON.stringify(data, null, this.getIndent());
  },

  compressJson() {
    const data = this.getJson();
    if (data === null) return;
    document.getElementById('jf-output').value = JSON.stringify(data);
  },

  validateJson() {
    const input = document.getElementById('jf-input').value;
    try {
      JSON.parse(input);
      this.showToast('✅ JSON 格式正确');
    } catch (e) {
      this.showToast(`❌ JSON 格式错误: ${e.message}`);
    }
  },

  escapeJson() {
    const input = document.getElementById('jf-input').value;
    document.getElementById('jf-output').value = JSON.stringify(input);
  },

  unescapeJson() {
    const input = document.getElementById('jf-input').value.trim();
    try {
      document.getElementById('jf-output').value = JSON.parse(input);
    } catch (e) {
      this.showToast(`反转义失败: ${e.message}`);
    }
  },

  jsonToCsv() {
    const data = this.getJson();
    if (data === null) return;

    let arr = Array.isArray(data) ? data : [data];
    if (!arr.length || typeof arr[0] !== 'object') {
      return this.showToast('JSON 必须是一个对象数组才能转换为 CSV');
    }

    const headers = [...new Set(arr.flatMap(Object.keys))];
    const csv = [
      headers.join(','),
      ...arr.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      )
    ].join('\n');

    document.getElementById('jf-output').value = csv;
  },

  /* ========== JSON ↔ YAML ========== */
  renderJsonToYaml() {
    document.getElementById('panel-json-yaml').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="jy-input" class="large" placeholder='{"name":"张三","age":30,"city":"北京"}'></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="jy-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="JsonTools.json2yaml()">JSON → YAML</button>
            <button class="btn" onclick="JsonTools.yaml2json()">YAML → JSON</button>
          </div>
        </div>
      </div>
    `;
  },

  json2yaml() {
    const input = document.getElementById('jy-input').value;
    try {
      const obj = JSON.parse(input);
      const yaml = this.toYaml(obj);
      document.getElementById('jy-output').value = yaml;
    } catch (e) {
      this.showToast(`JSON 解析错误: ${e.message}`);
    }
  },

  yaml2json() {
    const input = document.getElementById('jy-input').value;
    try {
      const obj = this.fromYaml(input);
      document.getElementById('jy-output').value = JSON.stringify(obj, null, 2);
    } catch (e) {
      this.showToast(`YAML 解析错误: ${e.message}`);
    }
  },

  toYaml(obj, indent = 0) {
    const pad = '  '.repeat(indent);
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'string') {
      const needsQuotes = /[:\[\]{}|>&!*?#%@`,\n]/.test(obj) || obj === '' || obj === 'true' || obj === 'false' || obj === 'null';
      return needsQuotes ? `"${obj.replace(/"/g, '\\"')}"` : obj;
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return '\n' + obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          return pad + '- ' + this.toYaml(item, indent + 1).trimStart();
        }
        return pad + '- ' + this.toYaml(item, indent + 1).trim();
      }).join('\n');
    }
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      return '\n' + keys.map(key => {
        const val = this.toYaml(obj[key], indent + 1).trimStart();
        const needsQuotes = /[:#{}[\],]/.test(key);
        const k = needsQuotes ? `"${key}"` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          return pad + k + ':' + val;
        }
        if (val.startsWith('\n')) {
          return pad + k + ':' + val;
        }
        return pad + k + ': ' + val;
      }).join('\n');
    }
    return String(obj);
  },

  fromYaml(text) {
    const lines = text.split('\n');
    const result = {};
    const stack = [{obj: result, indent: -1}];

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue;

      const indent = line.search(/\S/);
      const content = line.trim();

      const isArray = content.startsWith('- ');
      const keyVal = isArray ? content.slice(2) : content;
      const colonIdx = keyVal.indexOf(': ');

      if (isArray) {
        while (stack.length > 1 && stack[stack.length-1].indent >= indent) stack.pop();
        let parent = stack[stack.length-1].obj;
        if (!Array.isArray(parent)) {
          parent = [];
          if (stack.length === 1) {
            Object.assign(result, {__arr: parent});
          }
        }
        if (colonIdx > 0) {
          const k = keyVal.slice(0, colonIdx);
          const v = keyVal.slice(colonIdx + 2);
          const item = {[k]: this.parseYamlValue(v)};
          parent.push(item);
          if (typeof item[k] === 'object' && item[k] !== null) {
            stack.push({obj: item[k], indent});
          }
        } else {
          parent.push(this.parseYamlValue(keyVal));
        }
      } else if (colonIdx > 0) {
        const k = keyVal.slice(0, colonIdx);
        const v = keyVal.slice(colonIdx + 2);
        while (stack.length > 1 && stack[stack.length-1].indent >= indent) stack.pop();
        stack[stack.length-1].obj[k] = this.parseYamlValue(v);
        if (typeof stack[stack.length-1].obj[k] === 'object' && stack[stack.length-1].obj[k] !== null) {
          stack.push({obj: stack[stack.length-1].obj[k], indent});
        }
      }
    }

    if (result.__arr) return result.__arr;
    return result;
  },

  parseYamlValue(val) {
    if (val === 'null' || val === '~') return null;
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (/^\d+$/.test(val)) return parseInt(val);
    if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
    const strVal = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    return strVal;
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }
};
