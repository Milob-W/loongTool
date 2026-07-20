const EncodeTools = {
  init() {
    this.renderBase64();
    this.renderUrlEncode();
    this.renderHtmlEncode();
    this.renderHashTools();
    this.renderUuidGenerator();
    this.renderTimestamp();
  },

  /* ========== Base64 ========== */
  renderBase64() {
    document.getElementById('panel-base64').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="b64-input" class="large" placeholder="输入要编码或解码的文本..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="b64-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="EncodeTools.doBase64('encode')">编码 →</button>
            <button class="btn" onclick="EncodeTools.doBase64('decode')">解码 ←</button>
            <button class="btn" onclick="EncodeTools.doBase64('encode-uri')">编码(URL安全)</button>
          </div>
          <div class="form-row mt-2">
            <label>字符编码</label>
            <select id="b64-charset" style="width:120px">
              <option value="utf-8">UTF-8</option>
              <option value="ascii">ASCII</option>
            </select>
          </div>
          <div class="form-row">
            <label>上传文件编码</label>
            <input type="file" id="b64-file" accept="*/*" style="font-size:0.8125rem">
            <span class="hint" id="b64-file-name"></span>
          </div>
        </div>
      </div>
    `;
    document.getElementById('b64-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById('b64-file-name').textContent = file.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1] || ev.target.result;
        document.getElementById('b64-input').value = base64;
        this.doBase64('decode');
      };
      reader.readAsDataURL(file);
    });
  },

  doBase64(mode) {
    const input = document.getElementById('b64-input').value;
    if (!input) return this.showToast('请先输入文本');

    try {
      if (mode === 'encode') {
        document.getElementById('b64-output').value = btoa(unescape(encodeURIComponent(input)));
      } else if (mode === 'encode-uri') {
        document.getElementById('b64-output').value = btoa(unescape(encodeURIComponent(input)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      } else {
        try {
          document.getElementById('b64-output').value = decodeURIComponent(escape(atob(input)));
        } catch {
          document.getElementById('b64-output').value = atob(input);
        }
      }
    } catch (e) {
      this.showToast(`Base64 错误: ${e.message}`);
    }
  },

  /* ========== URL Encode/Decode ========== */
  renderUrlEncode() {
    document.getElementById('panel-url').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="url-input" class="large" placeholder="输入 URL 或文本..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="url-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="EncodeTools.doUrl('encode')">URL 编码</button>
            <button class="btn" onclick="EncodeTools.doUrl('decode')">URL 解码</button>
            <button class="btn" onclick="EncodeTools.doUrl('encode-component')">编码(Component)</button>
            <button class="btn" onclick="EncodeTools.doUrl('decode-component')">解码(Component)</button>
            <button class="btn" onclick="EncodeTools.doUrl('params')">提取参数</button>
          </div>
        </div>
      </div>
    `;
  },

  doUrl(mode) {
    const input = document.getElementById('url-input').value;
    if (!input) return this.showToast('请先输入文本');

    try {
      switch (mode) {
        case 'encode':
          document.getElementById('url-output').value = encodeURI(input);
          break;
        case 'decode':
          document.getElementById('url-output').value = decodeURI(input);
          break;
        case 'encode-component':
          document.getElementById('url-output').value = encodeURIComponent(input);
          break;
        case 'decode-component':
          document.getElementById('url-output').value = decodeURIComponent(input);
          break;
        case 'params':
          const qs = input.includes('?') ? input.split('?')[1] : input;
          const params = new URLSearchParams(qs);
          let result = '';
          for (const [k, v] of params) {
            result += `${k} = ${v}\n`;
          }
          document.getElementById('url-output').value = result || '无参数';
          break;
      }
    } catch (e) {
      this.showToast(`URL 处理错误: ${e.message}`);
    }
  },

  /* ========== HTML Encode/Decode ========== */
  renderHtmlEncode() {
    document.getElementById('panel-html').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="html-input" class="large" placeholder='输入 HTML 或文本，如: <script>alert("xss")</script>'></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="html-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="EncodeTools.doHtml('encode')">HTML 编码</button>
            <button class="btn" onclick="EncodeTools.doHtml('decode')">HTML 解码</button>
            <button class="btn" onclick="EncodeTools.doHtml('strip')">去除 HTML 标签</button>
          </div>
        </div>
      </div>
    `;
  },

  doHtml(mode) {
    const input = document.getElementById('html-input').value;
    if (!input) return this.showToast('请先输入文本');

    switch (mode) {
      case 'encode': {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(input));
        document.getElementById('html-output').value = div.innerHTML;
        break;
      }
      case 'decode': {
        const div = document.createElement('div');
        div.innerHTML = input;
        document.getElementById('html-output').value = div.textContent;
        break;
      }
      case 'strip':
        document.getElementById('html-output').value = input.replace(/<[^>]*>/g, '');
        break;
    }
  },

  /* ========== Hash Tools ========== */
  renderHashTools() {
    document.getElementById('panel-hash').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入文本</div>
          <div class="card-body">
            <textarea id="hash-input" class="large" placeholder="输入要计算哈希的文本..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">哈希结果</div>
          <div class="card-body" id="hash-results">
            <div class="empty-state">点击下方按钮计算哈希</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">算法</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="EncodeTools.computeHash()">计算哈希</button>
          </div>
          <div class="form-row mt-2">
            <label>算法</label>
            <label><input type="checkbox" id="hash-md5" checked> MD5</label>
            <label><input type="checkbox" id="hash-sha1"> SHA-1</label>
            <label><input type="checkbox" id="hash-sha256" checked> SHA-256</label>
            <label><input type="checkbox" id="hash-sha512"> SHA-512</label>
          </div>
        </div>
      </div>
    `;
  },

  async computeHash() {
    const input = document.getElementById('hash-input').value;
    if (!input) return this.showToast('请先输入文本');

    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const container = document.getElementById('hash-results');

    let html = '<table><thead><tr><th>算法</th><th>哈希值</th></tr></thead><tbody>';

    const algos = [
      {id: 'hash-md5', name: 'MD5', algo: 'MD5'},
      {id: 'hash-sha1', name: 'SHA-1', algo: 'SHA-1'},
      {id: 'hash-sha256', name: 'SHA-256', algo: 'SHA-256'},
      {id: 'hash-sha512', name: 'SHA-512', algo: 'SHA-512'},
    ];

    for (const {id, name, algo} of algos) {
      if (!document.getElementById(id).checked) continue;
      try {
        const hashBuffer = await crypto.subtle.digest(algo, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        html += `<tr><td style="font-weight:600">${name}</td><td style="font-family:monospace;font-size:0.75rem;word-break:break-all">${hashHex}</td></tr>`;
      } catch (e) {
        html += `<tr><td>${name}</td><td class="badge-danger" style="padding:2px 8px">不支持</td></tr>`;
      }
    }

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  /* ========== UUID Generator ========== */
  renderUuidGenerator() {
    document.getElementById('panel-uuid').innerHTML = `
      <div class="card">
        <div class="card-header">UUID / ULID 生成器</div>
        <div class="card-body">
          <div class="form-row">
            <label>生成数量</label>
            <input type="number" id="uuid-count" value="1" min="1" max="100" style="width:80px">
          </div>
          <div class="form-row">
            <label>格式</label>
            <label><input type="radio" name="uuid-format" value="v4" checked> UUID v4</label>
            <label><input type="radio" name="uuid-format" value="v4-upper"> UUID v4 (大写)</label>
            <label><input type="radio" name="uuid-format" value="v4-nodash"> UUID v4 (无连字符)</label>
            <label><input type="radio" name="uuid-format" value="ulid"> ULID</label>
            <label><input type="radio" name="uuid-format" value="nanoid"> NanoID (21位)</label>
            <label><input type="radio" name="uuid-format" value="cuid"> CUID</label>
          </div>
          <button class="btn btn-primary" onclick="EncodeTools.generateUuids()">生成</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">生成结果</div>
        <div class="card-body">
          <textarea id="uuid-output" class="large" readonly style="min-height:200px"></textarea>
          <div class="status-bar" id="uuid-status">0 个</div>
        </div>
      </div>
    `;
  },

  generateUuids() {
    const count = parseInt(document.getElementById('uuid-count').value) || 1;
    const format = document.querySelector('input[name="uuid-format"]:checked').value;
    const results = [];

    for (let i = 0; i < count; i++) {
      switch (format) {
        case 'v4':
          results.push(crypto.randomUUID());
          break;
        case 'v4-upper':
          results.push(crypto.randomUUID().toUpperCase());
          break;
        case 'v4-nodash':
          results.push(crypto.randomUUID().replace(/-/g, ''));
          break;
        case 'ulid': {
          const ts = Date.now().toString(36);
          const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
            .map(b => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[b % 32]).join('');
          results.push((ts + rand).toLowerCase());
          break;
        }
        case 'nanoid': {
          const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          const bytes = crypto.getRandomValues(new Uint8Array(21));
          results.push(Array.from(bytes).map(b => chars[b % 62]).join(''));
          break;
        }
        case 'cuid': {
          const ts = Date.now().toString(36);
          const rand = Math.random().toString(36).substring(2, 10);
          const counter = (i + 1).toString(36);
          results.push(`c${ts}${rand}${counter}`);
          break;
        }
      }
    }

    const output = document.getElementById('uuid-output');
    output.value = results.join('\n');
    document.getElementById('uuid-status').textContent = `${results.length} 个`;
  },

  /* ========== Timestamp ========== */
  renderTimestamp() {
    document.getElementById('panel-timestamp').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">Unix 时间戳 → 日期</div>
          <div class="card-body">
            <div class="form-row">
              <input type="text" id="ts-unix" placeholder="时间戳 (秒或毫秒)" style="width:100%">
            </div>
            <button class="btn btn-primary" onclick="EncodeTools.unixToDate()">转换</button>
            <div class="mt-2" id="ts-date-result" class="text-muted"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">日期 → Unix 时间戳</div>
          <div class="card-body">
            <div class="form-row">
              <input type="datetime-local" id="ts-datetime" style="width:100%">
            </div>
            <button class="btn btn-primary" onclick="EncodeTools.dateToUnix()">转换</button>
            <div class="mt-2" id="ts-unix-result" class="text-muted"></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">当前时间</div>
        <div class="card-body">
          <div class="grid-3 text-center">
            <div>
              <div class="text-xs text-muted">Unix (秒)</div>
              <div style="font-size:1.25rem;font-weight:700" id="ts-now-sec">${Math.floor(Date.now()/1000)}</div>
            </div>
            <div>
              <div class="text-xs text-muted">Unix (毫秒)</div>
              <div style="font-size:1.25rem;font-weight:700" id="ts-now-ms">${Date.now()}</div>
            </div>
            <div>
              <div class="text-xs text-muted">日期时间</div>
              <div style="font-size:1rem" id="ts-now-date">${new Date().toLocaleString()}</div>
            </div>
          </div>
          <div class="btn-group mt-2">
            <button class="btn btn-sm" onclick="EncodeTools.refreshNow()">刷新</button>
            <button class="btn btn-sm" onclick="EncodeTools.copyTimestamp('sec')">复制时间戳(秒)</button>
            <button class="btn btn-sm" onclick="EncodeTools.copyTimestamp('ms')">复制时间戳(毫秒)</button>
          </div>
        </div>
      </div>
    `;

    setInterval(() => {
      document.getElementById('ts-now-sec').textContent = Math.floor(Date.now()/1000);
      document.getElementById('ts-now-ms').textContent = Date.now();
      document.getElementById('ts-now-date').textContent = new Date().toLocaleString();
    }, 1000);
  },

  unixToDate() {
    const input = document.getElementById('ts-unix').value.trim();
    if (!input) return this.showToast('请输入时间戳');

    const ts = parseInt(input);
    if (isNaN(ts)) return this.showToast('无效的时间戳');

    const isMs = input.length > 10 || ts > 1e11;
    const date = new Date(isMs ? ts : ts * 1000);
    document.getElementById('ts-date-result').innerHTML = `
      <div style="font-size:1.125rem;font-weight:600">${date.toLocaleString()}</div>
      <div class="text-xs text-muted">${date.toISOString().replace('T', ' ').slice(0, 19)}</div>
      <div class="text-xs text-muted">${date.toUTCString()}</div>
    `;
  },

  dateToUnix() {
    const val = document.getElementById('ts-datetime').value;
    if (!val) return this.showToast('请选择日期时间');

    const date = new Date(val);
    document.getElementById('ts-unix-result').innerHTML = `
      <div>秒: <span style="font-weight:600">${Math.floor(date.getTime()/1000)}</span></div>
      <div>毫秒: <span style="font-weight:600">${date.getTime()}</span></div>
    `;
  },

  refreshNow() {
    document.getElementById('ts-now-sec').textContent = Math.floor(Date.now()/1000);
    document.getElementById('ts-now-ms').textContent = Date.now();
    document.getElementById('ts-now-date').textContent = new Date().toLocaleString();
  },

  copyTimestamp(mode) {
    const val = mode === 'sec' ? Math.floor(Date.now()/1000).toString() : Date.now().toString();
    navigator.clipboard.writeText(val).then(() => {
      this.showToast('已复制到剪贴板');
    });
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }
};
