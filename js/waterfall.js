const Waterfall = {
  history: [],
  data: '',

  /** 将当前数据导入工作台，激活按钮 */
  importData() {
    const input = document.getElementById('wf-input').value;
    if (!input.trim()) return showToast('请先输入数据');
    this.data = input;
    this.history = [];
    this.updateStatus();
    this.enableButtons(true);
    this.renderHistory();
    showToast('✅ 数据已导入，可以开始处理');
  },

  /** 启用/禁用操作按钮 */
  enableButtons(enabled) {
    const ids = ['btn-group', 'btn-transpose', 'btn-prefix', 'btn-suffix',
                 'btn-join', 'btn-sort', 'btn-dedup', 'btn-replace',
                 'btn-extract-col', 'btn-clear'];
    ids.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = !enabled;
    });
    document.getElementById('btn-undo').disabled = true;
  },

  /** 更新行数状态 */
  updateStatus() {
    const lines = this.data ? this.data.split('\n') : [];
    document.getElementById('wf-status').textContent = `${lines.length} 行`;
    document.getElementById('wf-input').value = this.data;
  },

  /** 获取自定义连接符 */
  getColDelim(selId) {
    const sel = document.getElementById(selId);
    const val = sel.value;
    if (val === 'custom') {
      return document.getElementById('wf-param-join-custom').value || ',';
    }
    return val === '\\t' ? '\t' : val;
  },

  /** 执行操作并记录历史 */
  execute(op, params, fn) {
    if (!this.data && op !== '导入') return showToast('请先导入数据');
    const input = this.data;

    try {
      const output = fn(input);
      if (output === null) return; // fn returned null = validation failed

      // 记录历史
      this.history.push({
        op,
        params,
        input,
        output,
        time: new Date().toLocaleTimeString(),
      });
      this.data = output;
      this.updateStatus();
      this.renderHistory();
      document.getElementById('btn-undo').disabled = false;

      // 自动滚动到底部
      const historyEl = document.getElementById('wf-history');
      historyEl.scrollTop = historyEl.scrollHeight;
    } catch (e) {
      showToast(`处理错误: ${e.message}`);
    }
  },

  /** 渲染历史记录 */
  renderHistory() {
    const container = document.getElementById('wf-history');
    const empty = document.getElementById('wf-history-empty');

    if (this.history.length === 0) {
      container.innerHTML = '';
      container.appendChild(createEmptyState());
      return;
    }

    container.innerHTML = this.history.map((h, i) => `
      <div class="wf-step-card">
        <div class="wf-step-header">
          <span class="step-label">步骤 ${i + 1}: ${h.op} ${h.params}</span>
          <span class="step-time">${h.time}</span>
        </div>
        <div class="wf-step-body">
          ${h.params ? `<div class="param-info">参数: ${h.params}</div>` : ''}
          <pre>${escapeHtml(h.output.length > 2000 ? h.output.slice(0, 2000) + '\n... (截断)' : h.output)}</pre>
          <div style="font-size:0.6875rem;color:var(--text-muted);margin-top:0.25rem">
            输出 ${h.output.split('\n').length} 行
          </div>
        </div>
      </div>
    `).join('');

    function createEmptyState() {
      const div = document.createElement('div');
      div.className = 'wf-history-empty';
      div.id = 'wf-history-empty';
      div.textContent = '👆 导入数据后，使用下方工具按钮开始处理。每一步都会在此显示历史记录。';
      return div;
    }
  },

  /** 撤销上一步 */
  undo() {
    if (this.history.length === 0) return showToast('没有可撤销的操作');

    const last = this.history.pop();
    this.data = last.input;
    this.updateStatus();
    this.renderHistory();

    if (this.history.length === 0) {
      document.getElementById('btn-undo').disabled = true;
    }
    showToast(`已撤销: ${last.op}`);
  },

  /** 清空全部 */
  clearAll() {
    if (this.history.length > 0 && !confirm('确认清空所有操作历史和数据？')) return;
    this.data = '';
    this.history = [];
    document.getElementById('wf-input').value = '';
    document.getElementById('wf-status').textContent = '0 行';
    this.enableButtons(false);
    document.getElementById('btn-undo').disabled = true;
    this.renderHistory();
    showToast('已清空');
  },

  /* ====== 各行操作 ====== */

  /** 按行分组 */
  doGroup() {
    const groupSize = parseInt(document.getElementById('wf-param-group-size').value) || 2;
    this.execute('按行分组', `每组 ${groupSize} 行`, (input) => {
      const lines = input.split('\n');
      const groups = [];
      for (let i = 0; i < lines.length; i += groupSize) {
        groups.push(lines.slice(i, i + groupSize).join('\t'));
      }
      return groups.join('\n');
    });
  },

  /** 行列转置 */
  doTranspose() {
    const delim = document.getElementById('wf-param-transpose-delim').value;
    const displayDelim = delim === '\t' ? 'Tab' : delim;
    this.execute('行列转置', `分隔符: ${displayDelim}`, (input) => {
      const lines = input.split('\n').filter(l => l.trim());
      if (!lines.length) { showToast('无有效数据'); return null; }
      const matrix = lines.map(l => l.split(delim));
      const maxCols = Math.max(...matrix.map(r => r.length), 0);
      const result = [];
      for (let col = 0; col < maxCols; col++) {
        result.push(matrix.map(row => (row[col] || '').trim()).join(delim));
      }
      return result.join('\n');
    });
  },

  /** 添加前缀 */
  doPrefix() {
    const prefix = document.getElementById('wf-param-prefix').value;
    if (!prefix) return showToast('请输入前缀文本');
    this.execute('添加前缀', prefix, (input) => {
      return input.split('\n').map(l => prefix + l).join('\n');
    });
  },

  /** 添加后缀 */
  doSuffix() {
    const suffix = document.getElementById('wf-param-suffix').value;
    if (!suffix) return showToast('请输入后缀文本');
    this.execute('添加后缀', suffix, (input) => {
      return input.split('\n').map(l => l + suffix).join('\n');
    });
  },

  /** 连接行 */
  doJoin() {
    const sep = this.getColDelim('wf-param-join-sep');
    const displaySep = sep === '\t' ? 'Tab' : sep;
    this.execute('连接行', `连接符: ${displaySep}`, (input) => {
      const lines = input.split('\n').filter(l => l.trim());
      if (!lines.length) { showToast('无有效数据'); return null; }
      return lines.join(sep);
    });
  },

  /** 排序 */
  doSort() {
    this.execute('排序', 'A-Z 升序', (input) => {
      const lines = input.split('\n');
      lines.sort((a, b) => a.localeCompare(b));
      return lines.join('\n');
    });
  },

  /** 去重 */
  doDedup() {
    this.execute('去重', '', (input) => {
      const lines = input.split('\n');
      const seen = new Set();
      const uniq = [];
      const dupCount = { total: 0 };
      for (const line of lines) {
        if (!seen.has(line)) {
          seen.add(line);
          uniq.push(line);
        } else {
          dupCount.total++;
        }
      }
      const result = uniq.join('\n');
      showToast(`去重完成，移除 ${dupCount.total} 条重复`);
      return result;
    });
  },

  /** 查找替换 */
  doReplace() {
    const find = document.getElementById('wf-param-find').value;
    const replace = document.getElementById('wf-param-replace').value;
    if (!find) return showToast('请输入查找内容');
    this.execute('替换', `${find} → ${replace}`, (input) => {
      try {
        const regex = new RegExp(find, 'gm');
        const count = (input.match(regex) || []).length;
        const result = input.replace(regex, replace);
        showToast(`替换完成，共 ${count} 处`);
        return result;
      } catch (e) {
        // 如果不是正则，按普通文本替换
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gm');
        const count = (input.match(regex) || []).length;
        return input.replace(regex, replace);
      }
    });
  },

  /** 提取列 */
  doExtractCol() {
    const colIdx = parseInt(document.getElementById('wf-param-col-idx').value) - 1;
    const delim = document.getElementById('wf-param-col-delim').value;
    if (colIdx < 0) return showToast('列号至少为 1');
    const displayDelim = delim === '\t' ? 'Tab' : delim;
    this.execute('提取列', `第 ${colIdx + 1} 列, 分隔符: ${displayDelim}`, (input) => {
      return input.split('\n').map(line => {
        const cells = line.split(delim);
        return (cells[colIdx] || '').trim();
      }).join('\n');
    });
  },
};

// Toast 通知（与主应用一致）
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
}

// HTML 转义
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 自定义连接符显示/隐藏
document.addEventListener('DOMContentLoaded', () => {
  const joinSep = document.getElementById('wf-param-join-sep');
  const joinCustom = document.getElementById('wf-param-join-custom');
  if (joinSep && joinCustom) {
    joinSep.addEventListener('change', () => {
      joinCustom.style.display = joinSep.value === 'custom' ? 'inline-block' : 'none';
    });
  }

  // 数据区实时更新
  document.getElementById('wf-input').addEventListener('input', function() {
    const lines = this.value.split('\n');
    document.getElementById('wf-status').textContent = `${lines.length} 行`;
  });
});
