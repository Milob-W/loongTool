const MoreTools = {
  init() {
    this.renderAsciiArt();
    this.renderMorse();
    this.renderLevenshtein();
    this.renderPassword();
    this.renderBaseConvert();
    this.renderStringEscape();
    this.renderRot();
    this.renderWordFreq();
    this.renderRomanNumeral();
    this.renderTextRepeat();
    this.renderCssUnits();
    this.renderColorConvert();
  },

  /* ========== 1. ASCII Art ========== */
  renderAsciiArt() {
    document.getElementById('panel-ascii-art').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入文字</div>
          <div class="card-body">
            <input type="text" id="aa-input" value="Hello" style="width:100%;font-size:1.125rem;padding:0.75rem;font-family:monospace">
            <div class="form-row mt-2">
              <label>字体</label>
              <select id="aa-font">
                <option value="block">Block (方块)</option>
                <option value="simple">Simple (简单)</option>
                <option value="bubble">Bubble (泡泡)</option>
              </select>
            </div>
            <button class="btn btn-primary mt-2" onclick="MoreTools.doAsciiArt()">生成 ASCII Art</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header">结果</div>
          <div class="card-body relative">
            <pre class="code-block light" id="aa-output" style="min-height:200px;font-size:10px;line-height:1.1">Waiting...</pre>
            <button class="btn btn-sm" style="position:absolute;top:0.5rem;right:0.5rem;background:var(--bg);color:var(--text)" onclick="MoreTools.copyAsciiArt()">复制</button>
          </div>
        </div>
      </div>
    `;
  },

  doAsciiArt() {
    const text = document.getElementById('aa-input').value.toUpperCase();
    const font = document.getElementById('aa-font').value;
    if (!text) return showToast('请输入文字');

    const fonts = {
      block: {
        A: [' ███  ','██ ██ ','█████ ','██ ██ ','██ ██ '],
        B: ['████  ','██ ██ ','████  ','██ ██ ','████  '],
        C: [' ███  ','██    ','██    ','██    ',' ███  '],
        D: ['████  ','██ ██ ','██ ██ ','██ ██ ','████  '],
        E: ['█████ ','██    ','████  ','██    ','█████ '],
        F: ['█████ ','██    ','████  ','██    ','██    '],
        G: [' ███  ','██    ','██ ██ ','██ ██ ',' ████ '],
        H: ['██ ██ ','██ ██ ','█████ ','██ ██ ','██ ██ '],
        I: ['█████ ','  █   ','  █   ','  █   ','█████ '],
        J: [' ████ ','   █  ','   █  ','██ █  ',' ██   '],
        K: ['██ █  ','██ █  ','███   ','██ █  ','██ █  '],
        L: ['██    ','██    ','██    ','██    ','█████ '],
        M: ['██ ██ ','█████ ','██ ██ ','██ ██ ','██ ██ '],
        N: ['██ ██ ','█████ ','█████ ','██ ██ ','██ ██ '],
        O: [' ███  ','██ ██ ','██ ██ ','██ ██ ',' ███  '],
        P: ['████  ','██ ██ ','████  ','██    ','██    '],
        Q: [' ███  ','██ ██ ','██ ██ ','██ ██ ',' ████ '],
        R: ['████  ','██ ██ ','████  ','██ █  ','██ █  '],
        S: [' ████ ','██    ',' ███  ','   ██ ','████  '],
        T: ['█████ ','  █   ','  █   ','  █   ','  █   '],
        U: ['██ ██ ','██ ██ ','██ ██ ','██ ██ ',' ███  '],
        V: ['██ ██ ','██ ██ ','██ ██ ',' ███  ','  █   '],
        W: ['██ ██ ','██ ██ ','██ ██ ','█████ ','██ ██ '],
        X: ['██ ██ ','██ ██ ',' ███  ','██ ██ ','██ ██ '],
        Y: ['██ ██ ','██ ██ ',' ███  ','  █   ','  █   '],
        Z: ['█████ ','   ██ ','  █   ',' ██   ','█████ '],
        ' ': ['     ','     ','     ','     ','     '],
        '0': [' ███  ','██ ██ ','██ ██ ','██ ██ ',' ███  '],
        '1': ['  █   ',' ██   ','  █   ','  █   ','█████ '],
        '2': [' ███  ','██ ██ ','  ██  ',' ██   ','█████ '],
        '3': [' ███  ','██ ██ ','  ██  ','██ ██ ',' ███  '],
        '4': ['██ █  ','██ █  ','█████ ','  █   ','  █   '],
        '5': ['█████ ','██    ','████  ','   ██ ','████  '],
        '6': [' ███  ','██    ','████  ','██ ██ ',' ███  '],
        '7': ['█████ ','   █  ','  █   ',' █    ','██    '],
        '8': [' ███  ','██ ██ ',' ███  ','██ ██ ',' ███  '],
        '9': [' ███  ','██ ██ ',' ████ ','   ██ ',' ███  '],
        '.': ['     ','     ','     ','     ','  █  '],
        '!': ['  █  ','  █  ','  █  ','     ','  █  '],
        '?': [' ███  ','██ ██ ','  ██  ','      ','  █  '],
      },
      simple: {
        A: [' AA ','A  A','AAAA','A  A','A  A'],
        B: ['BBB ','B  B','BBB ','B  B','BBB '],
        C: [' CC ','C   ','C   ','C   ',' CC '],
        D: ['DDD ','D  D','D  D','D  D','DDD '],
        E: ['EEEE','E   ','EEE ','E   ','EEEE'],
        F: ['FFFF','F   ','FFF ','F   ','F   '],
        G: [' GG ','G   ','G GG','G  G',' GG '],
        H: ['H  H','H  H','HHHH','H  H','H  H'],
        I: ['III',' I ',' I ',' I ','III'],
        J: ['  JJ','  J ','  J ','J J',' JJ '],
        K: ['K  K','K K ','KK  ','K K ','K  K'],
        L: ['L   ','L   ','L   ','L   ','LLLL'],
        M: ['M  M','MM MM','M M M','M   M','M   M'],
        N: ['N  N','NN N','N NN','N  N','N  N'],
        O: [' OO ','O  O','O  O','O  O',' OO '],
        P: ['PPP ','P  P','PPP ','P   ','P   '],
        Q: [' QQQ ','Q   Q','Q  QQ','Q   Q',' QQQQ'],
        R: ['RRR ','R  R','RRR ','R R ','R  R'],
        S: [' SSS','S   ',' SS ','   S','SSS '],
        T: ['TTTT',' T  ',' T  ',' T  ',' T  '],
        U: ['U  U','U  U','U  U','U  U',' UU '],
        V: ['V  V','V  V','V  V',' VV ',' VV '],
        W: ['V   V','V   V','V V V','V V V',' V V '],
        X: ['X  X','X  X',' XX ','X  X','X  X'],
        Y: ['Y  Y','Y  Y',' YY ',' Y  ',' Y  '],
        Z: ['ZZZZ','  Z ',' Z  ','Z   ','ZZZZ'],
        ' ': ['   ','   ','   ','   ','   '],
        '0': [' OO ','O  O','O  O','O  O',' OO '],
        '1': [' 1  ',' 11 ','  1 ','  1 ',' 111'],
        '2': [' 22 ','2  2','  22',' 22 ','2222'],
        '3': [' 33 ','3  3','  33','3  3',' 33 '],
        '4': ['4 4 ','4 4 ','4444','  4 ','  4 '],
        '5': ['5555','5   ','555 ','   5','555 '],
        '6': [' 66 ','6   ','666 ','6  6',' 66 '],
        '7': ['7777','   7','  7 ',' 7  ','7   '],
        '8': [' 88 ','8  8',' 88 ','8  8',' 88 '],
        '9': [' 99 ','9  9',' 999','   9',' 99 '],
        '.': ['   ','   ','   ','   ',' . '],
        '!': [' ! ',' ! ',' ! ','   ',' ! '],
        '?': [' ?? ','?   ?','  ?? ','    ',' ?  '],
      },
      bubble: {
        A: [' ╭───╮ ',' │ A │ ',' ╰───╯ '],
        B: [' ╭───╮ ',' │ B │ ',' ╰───╯ '],
        C: [' ╭───╮ ',' │ C │ ',' ╰───╯ '],
        D: [' ╭───╮ ',' │ D │ ',' ╰───╯ '],
        E: [' ╭───╮ ',' │ E │ ',' ╰───╯ '],
        F: [' ╭───╮ ',' │ F │ ',' ╰───╯ '],
        G: [' ╭───╮ ',' │ G │ ',' ╰───╯ '],
        H: [' ╭───╮ ',' │ H │ ',' ╰───╯ '],
        I: [' ╭───╮ ',' │ I │ ',' ╰───╯ '],
        J: [' ╭───╮ ',' │ J │ ',' ╰───╯ '],
        K: [' ╭───╮ ',' │ K │ ',' ╰───╯ '],
        L: [' ╭───╮ ',' │ L │ ',' ╰───╯ '],
        M: [' ╭───╮ ',' │ M │ ',' ╰───╯ '],
        N: [' ╭───╮ ',' │ N │ ',' ╰───╯ '],
        O: [' ╭───╮ ',' │ O │ ',' ╰───╯ '],
        P: [' ╭───╮ ',' │ P │ ',' ╰───╯ '],
        Q: [' ╭───╮ ',' │ Q │ ',' ╰───╯ '],
        R: [' ╭───╮ ',' │ R │ ',' ╰───╯ '],
        S: [' ╭───╮ ',' │ S │ ',' ╰───╯ '],
        T: [' ╭───╮ ',' │ T │ ',' ╰───╯ '],
        U: [' ╭───╮ ',' │ U │ ',' ╰───╯ '],
        V: [' ╭───╮ ',' │ V │ ',' ╰───╯ '],
        W: [' ╭───╮ ',' │ W │ ',' ╰───╯ '],
        X: [' ╭───╮ ',' │ X │ ',' ╰───╯ '],
        Y: [' ╭───╮ ',' │ Y │ ',' ╰───╯ '],
        Z: [' ╭───╮ ',' │ Z │ ',' ╰───╯ '],
        ' ': ['     ','     ','     '],
        '0': [' ╭───╮ ',' │ 0 │ ',' ╰───╯ '],
        '1': [' ╭───╮ ',' │ 1 │ ',' ╰───╯ '],
        '2': [' ╭───╮ ',' │ 2 │ ',' ╰───╯ '],
        '3': [' ╭───╮ ',' │ 3 │ ',' ╰───╯ '],
        '4': [' ╭───╮ ',' │ 4 │ ',' ╰───╯ '],
        '5': [' ╭───╮ ',' │ 5 │ ',' ╰───╯ '],
        '6': [' ╭───╮ ',' │ 6 │ ',' ╰───╯ '],
        '7': [' ╭───╮ ',' │ 7 │ ',' ╰───╯ '],
        '8': [' ╭───╮ ',' │ 8 │ ',' ╰───╯ '],
        '9': [' ╭───╮ ',' │ 9 │ ',' ╰───╯ '],
        '.': [' ╭───╮ ',' │ . │ ',' ╰───╯ '],
        '!': [' ╭───╮ ',' │ ! │ ',' ╰───╯ '],
        '?': [' ╭───╮ ',' │ ? │ ',' ╰───╯ '],
      }
    };

    const glyphs = fonts[font];
    if (!glyphs) return showToast('不支持的字体');

    const height = glyphs['A'] ? glyphs['A'].length : 3;
    let result = '';
    for (let row = 0; row < height; row++) {
      let line = '';
      for (const ch of text) {
        const glyph = glyphs[ch] || glyphs[' '];
        line += (glyph && glyph[row]) ? glyph[row] : glyphs[' '][row] || ' '.repeat(5);
      }
      if (font === 'bubble') result += line.replace(/─+/g, '─'.repeat(Math.max(3, text.length * 5 - 2))) + '\n';
      else result += line + '\n';
    }
    document.getElementById('aa-output').textContent = result;
  },

  copyAsciiArt() {
    const text = document.getElementById('aa-output').textContent;
    navigator.clipboard.writeText(text).then(() => showToast('已复制'));
  },

  /* ========== 2. Morse Code ========== */
  renderMorse() {
    document.getElementById('panel-morse').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="mc-input" class="large" placeholder="文字或莫尔斯电码..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="mc-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="MoreTools.doMorse('encode')">文字 → 莫尔斯码</button>
            <button class="btn" onclick="MoreTools.doMorse('decode')">莫尔斯码 → 文字</button>
            <button class="btn" onclick="MoreTools.doMorse('play')">🔊 播放</button>
          </div>
        </div>
      </div>
    `;
  },

  doMorse(mode) {
    const input = document.getElementById('mc-input').value.trim();
    if (!input) return showToast('请输入内容');

    const morseMap = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
      'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
      'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
      'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
      'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
      'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
      '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
      '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
      "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.',
      ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
      '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
      '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
    };
    const revMap = {};
    for (const [k, v] of Object.entries(morseMap)) revMap[v] = k;

    if (mode === 'encode') {
      const result = input.toUpperCase().split('').map(ch => morseMap[ch] || ch).join(' ');
      document.getElementById('mc-output').value = result;
    } else if (mode === 'decode') {
      const result = input.split(' ').map(code => revMap[code] || code).join('');
      document.getElementById('mc-output').value = result;
    } else if (mode === 'play') {
      const morse = input.toUpperCase().split('').map(ch => morseMap[ch] || '').filter(Boolean).join(' ');
      this.playMorse(morse);
    }
  },

  playMorse(morse) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const dot = 0.08;
      const dash = dot * 3;
      const gap = dot;
      const charGap = dot * 2;

      let time = 0;
      for (const ch of morse) {
        if (ch === '.') {
          this.playTone(ctx, time, dot);
          time += dot + gap;
        } else if (ch === '-') {
          this.playTone(ctx, time, dash);
          time += dash + gap;
        } else if (ch === ' ') {
          time += charGap;
        } else if (ch === '/') {
          time += dot * 4;
        }
      }
    } catch (e) {
      showToast('浏览器不支持音频播放');
    }
  },

  playTone(ctx, startTime, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 700;
    gain.gain.value = 0.3;
    osc.start(startTime);
    osc.stop(startTime + duration);
  },

  /* ========== 3. Levenshtein Distance ========== */
  renderLevenshtein() {
    document.getElementById('panel-levenshtein').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <div class="form-row"><label>字符串 A</label><input type="text" id="lev-a" value="kitten" style="width:100%;font-family:monospace"></div>
            <div class="form-row"><label>字符串 B</label><input type="text" id="lev-b" value="sitting" style="width:100%;font-family:monospace"></div>
            <button class="btn btn-primary" onclick="MoreTools.doLevenshtein()">计算编辑距离</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header">结果</div>
          <div class="card-body" id="lev-result">
            <div class="empty-state">点击按钮计算</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">其他字符串相似度</div>
        <div class="card-body">
          <div class="grid-3" id="lev-more">
            <button class="btn" onclick="MoreTools.doSimilarity('hamming')">汉明距离</button>
            <button class="btn" onclick="MoreTools.doSimilarity('jaccard')">Jaccard 相似度</button>
            <button class="btn" onclick="MoreTools.doSimilarity('cosine')">Cosine 相似度</button>
          </div>
          <div class="mt-2" id="lev-sim-result"></div>
        </div>
      </div>
    `;
  },

  doLevenshtein() {
    const a = document.getElementById('lev-a').value;
    const b = document.getElementById('lev-b').value;

    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1;

    const dist = dp[m][n];
    const maxLen = Math.max(m, n);
    const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;

    document.getElementById('lev-result').innerHTML = `
      <table>
        <tr><td>编辑距离</td><td style="font-size:1.5rem;font-weight:700;color:var(--accent)">${dist}</td></tr>
        <tr><td>相似度</td><td style="font-weight:600">${(similarity * 100).toFixed(1)}%</td></tr>
        <tr><td>操作</td><td>${a.length === 0 && b.length === 0 ? '无' : 
          dist === 0 ? '完全相同' : 
          `需要 ${dist} 次编辑 (插入/删除/替换)`}</td></tr>
      </table>
      ${m <= 8 && n <= 8 ? `<div class="mt-2 text-xs text-muted">DP 矩阵:
<pre style="font-size:10px">${dp.map(r => r.map(v => String(v).padStart(3)).join(' ')).join('\n')}</pre></div>` : ''}
    `;
  },

  doSimilarity(mode) {
    const a = document.getElementById('lev-a').value;
    const b = document.getElementById('lev-b').value;

    let result;
    if (mode === 'hamming') {
      const maxLen = Math.max(a.length, b.length);
      let dist = 0;
      for (let i = 0; i < maxLen; i++) {
        if ((a[i] || '') !== (b[i] || '')) dist++;
      }
      result = `汉明距离: ${dist} (差异位 ${(dist / maxLen * 100).toFixed(1)}%)`;
    } else if (mode === 'jaccard') {
      const setA = new Set(a.toLowerCase().split(''));
      const setB = new Set(b.toLowerCase().split(''));
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      const sim = union.size === 0 ? 1 : intersection.size / union.size;
      result = `Jaccard 相似度: ${(sim * 100).toFixed(1)}% (交集 ${intersection.size}, 并集 ${union.size})`;
    } else if (mode === 'cosine') {
      const freqA = {}, freqB = {};
      for (const ch of a.toLowerCase()) freqA[ch] = (freqA[ch] || 0) + 1;
      for (const ch of b.toLowerCase()) freqB[ch] = (freqB[ch] || 0) + 1;
      const allChars = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
      let dot = 0, normA = 0, normB = 0;
      for (const ch of allChars) {
        dot += (freqA[ch] || 0) * (freqB[ch] || 0);
        normA += (freqA[ch] || 0) ** 2;
        normB += (freqB[ch] || 0) ** 2;
      }
      const sim = Math.sqrt(normA) * Math.sqrt(normB) === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
      result = `Cosine 相似度: ${(sim * 100).toFixed(1)}%`;
    }
    document.getElementById('lev-sim-result').innerHTML = `<div class="badge badge-info" style="font-size:0.875rem;padding:0.5rem">${result}</div>`;
  },

  /* ========== 4. Password Strength + Generator ========== */
  renderPassword() {
    document.getElementById('panel-password').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">密码强度检测</div>
          <div class="card-body">
            <input type="password" id="pw-input" placeholder="输入密码..." style="width:100%" oninput="MoreTools.checkPassword()">
            <div class="mt-2" id="pw-strength">
              <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                <div id="pw-bar" style="height:100%;width:0%;background:var(--red);transition:all 0.3s"></div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span id="pw-label" class="badge badge-danger">太弱</span>
                <span id="pw-time" class="text-xs text-muted"></span>
              </div>
            </div>
            <div class="mt-2" id="pw-details"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">密码生成器</div>
          <div class="card-body">
            <div class="form-row"><label>长度</label><input type="number" id="pw-gen-len" value="16" min="4" max="128" style="width:80px"></div>
            <div class="form-row">
              <label>包含</label>
              <label><input type="checkbox" id="pw-gen-upper" checked> A-Z</label>
              <label><input type="checkbox" id="pw-gen-lower" checked> a-z</label>
              <label><input type="checkbox" id="pw-gen-digit" checked> 0-9</label>
              <label><input type="checkbox" id="pw-gen-symbol" checked> !@#$</label>
            </div>
            <button class="btn btn-primary" onclick="MoreTools.generatePassword()">生成密码</button>
            <div class="mt-2"><input type="text" id="pw-gen-result" readonly style="width:100%;font-family:monospace;text-align:center;font-size:1.125rem"></div>
          </div>
        </div>
      </div>
    `;
  },

  checkPassword() {
    const pw = document.getElementById('pw-input').value;
    const bar = document.getElementById('pw-bar');
    const label = document.getElementById('pw-label');
    const time = document.getElementById('pw-time');
    const details = document.getElementById('pw-details');

    if (!pw) {
      bar.style.width = '0%';
      label.textContent = '未输入';
      label.className = 'badge';
      time.textContent = '';
      details.innerHTML = '';
      return;
    }

    let score = 0;
    const checks = [];

    if (pw.length >= 8) { score += 15; checks.push(['长度 ≥8', true]); } else checks.push(['长度 ≥8', false]);
    if (pw.length >= 12) { score += 10; checks.push(['长度 ≥12', true]); } else if (pw.length < 12 && pw.length >= 8) checks.push(['长度 ≥12', false]);

    if (/[a-z]/.test(pw)) { score += 15; checks.push(['小写字母', true]); } else checks.push(['小写字母', false]);
    if (/[A-Z]/.test(pw)) { score += 15; checks.push(['大写字母', true]); } else checks.push(['大写字母', false]);
    if (/[0-9]/.test(pw)) { score += 15; checks.push(['数字', true]); } else checks.push(['数字', false]);
    if (/[^a-zA-Z0-9]/.test(pw)) { score += 20; checks.push(['特殊字符', true]); } else checks.push(['特殊字符', false]);

    const uniqueChars = new Set(pw).size;
    score += Math.min(10, uniqueChars * 2);

    const entropy = pw.length * Math.log2(Math.min(95, uniqueChars * 4 || 1));

    score = Math.min(100, score);

    let level, color;
    if (score < 30) { level = '太弱'; color = 'var(--red)'; label.className = 'badge badge-danger'; }
    else if (score < 50) { level = '较弱'; color = '#d97757'; label.className = 'badge'; label.style.background = '#fdf0ea'; label.style.color = '#d97757'; }
    else if (score < 70) { level = '一般'; color = '#d4a017'; label.className = 'badge'; label.style.background = '#fff8e1'; label.style.color = '#d4a017'; }
    else if (score < 90) { level = '强'; color = 'var(--green)'; label.className = 'badge badge-success'; }
    else { level = '非常强'; color = '#2a7a2a'; label.className = 'badge badge-success'; }

    bar.style.width = score + '%';
    bar.style.background = color;
    label.textContent = level;

    const crackTime = entropy < 28 ? '瞬间' :
      entropy < 36 ? '几秒' :
      entropy < 44 ? '几分钟' :
      entropy < 52 ? '几小时' :
      entropy < 60 ? '几天' :
      entropy < 68 ? '几个月' :
      entropy < 76 ? '几年' :
      entropy < 84 ? '几十年' :
      '几个世纪';
    time.textContent = `破解时间: ${crackTime} (熵: ${entropy.toFixed(0)} bits)`;

    details.innerHTML = `<div class="grid-3" style="margin-top:4px">${
      checks.map(([name, ok]) =>
        `<span class="text-xs" style="color:${ok ? 'var(--green)' : 'var(--text-muted)'}">${ok ? '✅' : '❌'} ${name}</span>`
      ).join('')
    }</div>`;
  },

  generatePassword() {
    const len = parseInt(document.getElementById('pw-gen-len').value) || 16;
    const upper = document.getElementById('pw-gen-upper').checked;
    const lower = document.getElementById('pw-gen-lower').checked;
    const digit = document.getElementById('pw-gen-digit').checked;
    const symbol = document.getElementById('pw-gen-symbol').checked;

    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (digit) chars += '0123456789';
    if (symbol) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) { showToast('至少选择一种字符类型'); return; }

    const array = new Uint32Array(len);
    crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars[array[i] % chars.length];
    }

    document.getElementById('pw-gen-result').value = result;
  },

  /* ========== 5. Number Base Convert ========== */
  renderBaseConvert() {
    document.getElementById('panel-base-convert').innerHTML = `
      <div class="card">
        <div class="card-header">进制转换器 (支持 2~36 进制)</div>
        <div class="card-body">
          <div class="grid-2">
            <div>
              <div class="form-row"><label>输入值</label><input type="text" id="bc-input" value="255" style="width:100%;font-family:monospace"></div>
              <div class="form-row"><label>输入进制</label>
                <select id="bc-from">
                  ${[2,8,10,16].map(b => `<option value="${b}" ${b===10?'selected':''}>${b} 进制</option>`).join('')}
                  <option value="custom">自定义</option>
                </select>
                <input type="number" id="bc-from-custom" min="2" max="36" value="10" style="width:80px;display:none">
              </div>
              <button class="btn btn-primary" onclick="MoreTools.doBaseConvert()">转换</button>
            </div>
            <div>
              <div class="form-row">
                <label style="min-width:auto">输出进制</label>
                ${[2,8,10,16].map(b =>
                  `<label style="margin-right:8px"><input type="radio" name="bc-to" value="${b}" ${b===2?'checked':''}> ${b}</label>`
                ).join('')}
                <label><input type="radio" name="bc-to" value="custom"> 自定义</label>
              </div>
              <div id="bc-to-custom-wrap" style="display:none">
                <input type="number" id="bc-to-custom" min="2" max="36" value="8" style="width:80px">
              </div>
              <button class="btn btn-green" onclick="MoreTools.copyAllBases()">复制全部进制</button>
            </div>
          </div>
          <div class="mt-2" id="bc-results"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">全部进制一览</div>
        <div class="card-body" id="bc-all">
          <div class="empty-state">输入数值后点击转换</div>
        </div>
      </div>
    `;

    document.getElementById('bc-from').addEventListener('change', () => {
      const c = document.getElementById('bc-from-custom');
      c.style.display = document.getElementById('bc-from').value === 'custom' ? 'inline-block' : 'none';
    });
    document.querySelectorAll('input[name="bc-to"]').forEach(el => {
      el.addEventListener('change', () => {
        document.getElementById('bc-to-custom-wrap').style.display =
          document.querySelector('input[name="bc-to"]:checked').value === 'custom' ? 'inline-block' : 'none';
      });
    });
  },

  doBaseConvert() {
    const input = document.getElementById('bc-input').value.trim();
    let fromBase = parseInt(document.getElementById('bc-from').value);
    if (fromBase === -1 || isNaN(fromBase)) fromBase = parseInt(document.getElementById('bc-from-custom').value) || 10;

    const toRadio = document.querySelector('input[name="bc-to"]:checked');
    let toBase = parseInt(toRadio ? toRadio.value : '2');
    if (toBase === -1 || isNaN(toBase)) toBase = parseInt(document.getElementById('bc-to-custom').value) || 2;

    if (!input) return showToast('请输入数值');
    if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) return showToast('进制范围 2~36');

    try {
      const dec = parseInt(input, fromBase);
      if (isNaN(dec)) return showToast('无效的数值');

      const result = dec.toString(toBase).toUpperCase();
      const digits = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

      document.getElementById('bc-results').innerHTML = `
        <table>
          <tr><td>十进制</td><td style="font-family:monospace;font-size:1.25rem">${dec.toLocaleString()}</td></tr>
          <tr><td>二进制 (2)</td><td style="font-family:monospace">${dec.toString(2)}</td></tr>
          <tr><td>八进制 (8)</td><td style="font-family:monospace">${dec.toString(8)}</td></tr>
          <tr><td>十进制 (10)</td><td style="font-family:monospace">${dec.toString(10)}</td></tr>
          <tr><td>十六进制 (16)</td><td style="font-family:monospace">0x${dec.toString(16).toUpperCase()}</td></tr>
          <tr><td>${toBase} 进制</td><td style="font-family:monospace;font-size:1.25rem;font-weight:700;color:var(--accent)">${result}</td></tr>
        </table>
      `;

      let allHtml = '<table><thead><tr><th>进制</th><th>表示</th></tr></thead><tbody>';
      for (let b = 2; b <= 36; b++) {
        try {
          allHtml += `<tr><td>${b} 进制</td><td style="font-family:monospace">${dec.toString(b).toUpperCase()}</td></tr>`;
        } catch { }
      }
      allHtml += '</tbody></table>';
      document.getElementById('bc-all').innerHTML = allHtml;

    } catch (e) {
      showToast(`转换错误: ${e.message}`);
    }
  },

  copyAllBases() {
    const text = document.getElementById('bc-all').textContent;
    navigator.clipboard.writeText(text).then(() => showToast('已复制'));
  },

  /* ========== 6. String Escape ========== */
  renderStringEscape() {
    document.getElementById('panel-string-escape').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="se-input" class="large" placeholder="输入要转义的文本..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="se-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">语言 / 模式</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="MoreTools.doStringEscape('java')">Java 转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('js')">JavaScript 转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('python')">Python 转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('sql')">SQL 转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('html')">HTML 转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('url')">URL 转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('json')">JSON 转义</button>
          </div>
          <div class="btn-group mt-2">
            <button class="btn" onclick="MoreTools.doStringEscape('java-d')">Java 反转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('js-d')">JavaScript 反转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('python-d')">Python 反转义</button>
            <button class="btn" onclick="MoreTools.doStringEscape('html-d')">HTML 反转义</button>
          </div>
        </div>
      </div>
    `;
  },

  doStringEscape(mode) {
    const input = document.getElementById('se-input').value;
    if (!input) return showToast('请输入文本');

    let result;
    const escapeMap = {
      '\n': '\\n', '\r': '\\r', '\t': '\\t', '"': '\\"', "'": "\\'", '\\': '\\\\',
    };

    switch (mode) {
      case 'java':
      case 'js':
      case 'json':
        result = input.replace(/[\n\r\t"'\\\b\f]/g, ch => escapeMap[ch] || '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
        break;
      case 'python':
        result = input.replace(/[\n\r\t"'\\]/g, ch => escapeMap[ch] || ch);
        break;
      case 'sql':
        result = input.replace(/'/g, "''").replace(/\\/g, '\\\\');
        break;
      case 'html':
        result = input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        break;
      case 'url':
        result = encodeURIComponent(input);
        break;
      case 'java-d':
        result = input.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        break;
      case 'js-d':
        result = input.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        break;
      case 'python-d':
        result = input.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        break;
      case 'html-d':
        result = input.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
        break;
    }
    document.getElementById('se-output').value = result;
  },

  /* ========== 7. ROT13 / ROT47 ========== */
  renderRot() {
    document.getElementById('panel-rot').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">输入</div>
          <div class="card-body">
            <textarea id="rot-input" class="large" placeholder="输入要加密/解密的文本..."></textarea>
          </div>
        </div>
        <div class="card">
          <div class="card-header">输出</div>
          <div class="card-body relative">
            <textarea id="rot-output" class="large" readonly></textarea>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">操作</div>
        <div class="card-body">
          <div class="btn-group">
            <button class="btn btn-primary" onclick="MoreTools.doRot('rot13')">ROT13 (字母)</button>
            <button class="btn" onclick="MoreTools.doRot('rot47')">ROT47 (可打印字符)</button>
            <button class="btn" onclick="MoreTools.doRot('rot5')">ROT5 (数字)</button>
            <button class="btn" onclick="MoreTools.doRot('rot18')">ROT18 (ROT5+ROT13)</button>
            <button class="btn" onclick="MoreTools.doRot('caesar3')">凯撒 ROT3</button>
            <button class="btn" onclick="MoreTools.doRot('caesar-3')">凯撒 ROT-3</button>
          </div>
          <div class="form-row mt-2">
            <label>自定义 ROT</label>
            <input type="number" id="rot-custom" value="13" min="1" max="25" style="width:80px">
            <button class="btn btn-sm" onclick="MoreTools.doRot('custom')">应用</button>
          </div>
        </div>
      </div>
    `;
  },

  doRot(mode) {
    const input = document.getElementById('rot-input').value;
    if (!input) return showToast('请输入文本');

    let result;
    const rot = (str, n) => str.replace(/[a-zA-Z]/g, c => {
      const base = c >= 'a' ? 97 : 65;
      return String.fromCharCode((c.charCodeAt(0) - base + n) % 26 + base);
    });

    switch (mode) {
      case 'rot13':
        result = rot(input, 13);
        break;
      case 'rot47':
        result = input.replace(/[\x21-\x7e]/g, c =>
          String.fromCharCode(33 + (c.charCodeAt(0) - 33 + 47) % 94)
        );
        break;
      case 'rot5':
        result = input.replace(/[0-9]/g, c =>
          String.fromCharCode(48 + (c.charCodeAt(0) - 48 + 5) % 10)
        );
        break;
      case 'rot18':
        result = input.replace(/[a-zA-Z]/g, c => {
          const base = c >= 'a' ? 97 : 65;
          return String.fromCharCode((c.charCodeAt(0) - base + 18) % 26 + base);
        }).replace(/[0-9]/g, c =>
          String.fromCharCode(48 + (c.charCodeAt(0) - 48 + 5) % 10)
        );
        break;
      case 'caesar3':
        result = rot(input, 3);
        break;
      case 'caesar-3':
        result = rot(input, 23);
        break;
      case 'custom':
        const n = parseInt(document.getElementById('rot-custom').value) || 13;
        result = rot(input, n);
        break;
    }
    document.getElementById('rot-output').value = result;
  },

  /* ========== 8. Word Frequency ========== */
  renderWordFreq() {
    document.getElementById('panel-wordfreq').innerHTML = `
      <div class="card">
        <div class="card-header">输入文本</div>
        <div class="card-body">
          <textarea id="wf-input" class="large" placeholder="粘贴文本进行统计分析..."></textarea>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">基础统计</div>
          <div class="card-body" id="wf-basic">
            <div class="empty-state">输入文本后点击分析</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">词频统计 (Top 20)</div>
          <div class="card-body" id="wf-freq">
            <div class="empty-state">等待分析...</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">字符分布</div>
        <div class="card-body" id="wf-chars">
          <div class="empty-state">等待分析...</div>
        </div>
        <div class="card-body">
          <button class="btn btn-primary" onclick="MoreTools.doWordFreq()">分析文本</button>
        </div>
      </div>
    `;
  },

  doWordFreq() {
    const input = document.getElementById('wf-input').value;
    if (!input) return showToast('请输入文本');

    const chars = input.length;
    const charsNoSpace = input.replace(/\s/g, '').length;
    const words = input.split(/[\s\n]+/).filter(Boolean);
    const lines = input.split('\n');
    const sentences = input.split(/[。！？.!?]+/).filter(Boolean);
    const paragraphs = input.split(/\n\s*\n/).filter(Boolean);

    const wordCount = words.length;
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, ''))).size;

    const avgWordLen = wordCount > 0 ? (charsNoSpace / wordCount).toFixed(1) : 0;
    const avgSentLen = sentences.length > 0 ? (wordCount / sentences.length).toFixed(1) : 0;

    const freq = {};
    for (const w of words) {
      const clean = w.toLowerCase().replace(/[^\w]/g, '');
      if (clean) freq[clean] = (freq[clean] || 0) + 1;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);

    const charFreq = {};
    for (const ch of input.replace(/\s/g, '')) {
      charFreq[ch] = (charFreq[ch] || 0) + 1;
    }
    const charSorted = Object.entries(charFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);

    document.getElementById('wf-basic').innerHTML = `
      <table>
        <tr><td>总字符数</td><td style="font-weight:600">${chars.toLocaleString()}</td></tr>
        <tr><td>非空字符数</td><td style="font-weight:600">${charsNoSpace.toLocaleString()}</td></tr>
        <tr><td>单词数</td><td style="font-weight:600">${wordCount.toLocaleString()}</td></tr>
        <tr><td>唯一单词数</td><td style="font-weight:600">${uniqueWords.toLocaleString()}</td></tr>
        <tr><td>行数</td><td style="font-weight:600">${lines.length.toLocaleString()}</td></tr>
        <tr><td>句子数</td><td style="font-weight:600">${sentences.length.toLocaleString()}</td></tr>
        <tr><td>段落数</td><td style="font-weight:600">${paragraphs.length}</td></tr>
        <tr><td>平均词长</td><td style="font-weight:600">${avgWordLen} 字符</td></tr>
        <tr><td>平均句长</td><td style="font-weight:600">${avgSentLen} 词</td></tr>
      </table>
    `;

    const maxFreq = sorted.length > 0 ? sorted[0][1] : 1;
    const freqBar = (count, max) => Math.round(count / max * 100);

    document.getElementById('wf-freq').innerHTML = sorted.length === 0 ? '无单词数据' :
      `<div style="max-height:400px;overflow-y:auto"><table>
        <tr><th>#</th><th>单词</th><th>次数</th><th>占比</th></tr>
        ${sorted.map(([word, count], i) => `
          <tr>
            <td class="text-muted">${i+1}</td>
            <td style="font-family:monospace">${word}</td>
            <td style="font-weight:600">${count}</td>
            <td style="min-width:120px">
              <div style="background:var(--border);border-radius:3px;overflow:hidden;height:14px">
                <div style="width:${freqBar(count, maxFreq)}%;background:var(--accent);height:100%"></div>
              </div>
            </td>
          </tr>
        `).join('')}
      </table></div>`;

    document.getElementById('wf-chars').innerHTML = charSorted.length === 0 ? '无字符数据' :
      `<div style="max-height:300px;overflow-y:auto"><table>
        <tr><th>#</th><th>字符</th><th>编码</th><th>次数</th><th>占比</th></tr>
        ${charSorted.map(([ch, count], i) => `
          <tr>
            <td class="text-muted">${i+1}</td>
            <td style="font-family:monospace;font-size:1.125rem">${ch === ' ' ? '␣' : ch}</td>
            <td class="text-xs text-muted">U+${ch.charCodeAt(0).toString(16).padStart(4, '0')}</td>
            <td style="font-weight:600">${count}</td>
            <td style="min-width:120px">
              <div style="background:var(--border);border-radius:3px;overflow:hidden;height:14px">
                <div style="width:${freqBar(count, charSorted[0][1])}%;background:var(--green);height:100%"></div>
              </div>
            </td>
          </tr>
        `).join('')}
      </table></div>`;
  },

  /* ========== 9. Roman Numerals ========== */
  renderRomanNumeral() {
    document.getElementById('panel-roman').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">阿拉伯数字 → 罗马数字</div>
          <div class="card-body">
            <input type="number" id="rn-ato" value="2024" min="1" max="3999" style="width:100%;font-size:1.25rem;padding:0.75rem">
            <button class="btn btn-primary mt-2" onclick="MoreTools.arabicToRoman()">转换</button>
            <div class="mt-2" id="rn-ato-result" style="font-size:1.5rem;font-weight:700;color:var(--accent);font-family:serif"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">罗马数字 → 阿拉伯数字</div>
          <div class="card-body">
            <input type="text" id="rn-rta" value="MMXXIV" style="width:100%;font-size:1.25rem;padding:0.75rem;font-family:serif">
            <button class="btn btn-primary mt-2" onclick="MoreTools.romanToArabic()">转换</button>
            <div class="mt-2" id="rn-rta-result" style="font-size:1.5rem;font-weight:700;color:var(--accent)"></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">罗马数字对照表</div>
        <div class="card-body">
          <div class="grid-3">
            <div>I = 1</div><div>V = 5</div><div>X = 10</div>
            <div>L = 50</div><div>C = 100</div><div>D = 500</div>
            <div>M = 1000</div>
          </div>
        </div>
      </div>
    `;
  },

  arabicToRoman() {
    const num = parseInt(document.getElementById('rn-ato').value);
    if (isNaN(num) || num < 1 || num > 3999) return showToast('请输入 1~3999 的整数');

    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const strs = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '', n = num;
    for (let i = 0; i < vals.length; i++) {
      while (n >= vals[i]) { result += strs[i]; n -= vals[i]; }
    }
    document.getElementById('rn-ato-result').textContent = result;
  },

  romanToArabic() {
    const input = document.getElementById('rn-rta').value.toUpperCase().trim();
    if (!input) return showToast('请输入罗马数字');

    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let result = 0, prev = 0;
    for (let i = input.length - 1; i >= 0; i--) {
      const curr = map[input[i]];
      if (!curr) return showToast(`无效的罗马数字: ${input[i]}`);
      if (curr < prev) result -= curr;
      else { result += curr; prev = curr; }
    }
    document.getElementById('rn-rta-result').textContent = result.toLocaleString();
  },

  /* ========== 10. Text Repeat / Line Number ========== */
  renderTextRepeat() {
    document.getElementById('panel-text-repeat').innerHTML = `
      <div class="card">
        <div class="card-header">文本重复器</div>
        <div class="card-body">
          <div class="form-row"><label>输入文本</label><input type="text" id="tr-text" value="Hello" style="width:100%"></div>
          <div class="form-row"><label>重复次数</label><input type="number" id="tr-count" value="5" min="1" max="999" style="width:80px"></div>
          <div class="form-row"><label>间隔</label>
            <select id="tr-sep">
              <option value="\n">换行</option>
              <option value=",">逗号 ,</option>
              <option value=", ">逗号+空格</option>
              <option value=" ">空格</option>
              <option value="">无间隔</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="MoreTools.doTextRepeat()">重复</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header">行号添加</div>
        <div class="card-body">
          <textarea id="tr-lines" class="large" placeholder="每行输入文字..."></textarea>
          <div class="form-row mt-2">
            <label>起始编号</label><input type="number" id="tr-start" value="1" style="width:80px">
            <label>步长</label><input type="number" id="tr-step" value="1" style="width:80px">
            <label>格式</label>
            <select id="tr-format">
              <option value="{n}. ">{n}. </option>
              <option value="{n}: ">{n}: </option>
              <option value="({n}) ">({n}) </option>
              <option value="{n}.{i} ">{n}.{i} </option>
              <option value="[{n}] ">[{n}] </option>
              <option value="custom">自定义</option>
            </select>
            <input type="text" id="tr-format-custom" value="{n}. " style="width:120px;display:none;font-family:monospace">
          </div>
          <button class="btn btn-primary" onclick="MoreTools.addLineNumbers()">添加行号</button>
          <div class="mt-2"><textarea id="tr-out" class="large" readonly style="min-height:150px"></textarea></div>
        </div>
      </div>
    `;
    document.getElementById('tr-format').addEventListener('change', () => {
      document.getElementById('tr-format-custom').style.display =
        document.getElementById('tr-format').value === 'custom' ? 'inline-block' : 'none';
    });
  },

  doTextRepeat() {
    const text = document.getElementById('tr-text').value;
    const count = parseInt(document.getElementById('tr-count').value) || 1;
    let sep = document.getElementById('tr-sep').value;
    if (sep === '\\n') sep = '\n';
    document.getElementById('tr-out').value = Array(count).fill(text).join(sep);
  },

  addLineNumbers() {
    const lines = document.getElementById('tr-lines').value.split('\n');
    const start = parseInt(document.getElementById('tr-start').value) || 1;
    const step = parseInt(document.getElementById('tr-step').value) || 1;
    let format = document.getElementById('tr-format').value;
    if (format === 'custom') format = document.getElementById('tr-format-custom').value;
    if (!format) format = '{n}. ';

    const result = lines.map((line, i) => {
      const n = start + i * step;
      const idx = String(i + 1);
      return format.replace(/\{n\}/g, String(n)).replace(/\{i\}/g, idx) + line;
    });
    document.getElementById('tr-out').value = result.join('\n');
  },

  /* ========== 11. CSS Unit Converter ========== */
  renderCssUnits() {
    document.getElementById('panel-css-units').innerHTML = `
      <div class="card">
        <div class="card-header">CSS 单位换算</div>
        <div class="card-body">
          <div class="grid-2">
            <div>
              <div class="form-row"><label>值</label><input type="number" id="cu-value" value="16" step="any" style="width:100px"></div>
              <div class="form-row"><label>源单位</label>
                <select id="cu-from">
                  <option value="px">px (像素)</option>
                  <option value="pt">pt (点)</option>
                  <option value="em">em</option>
                  <option value="rem">rem</option>
                  <option value="%" selected>% (百分比)</option>
                  <option value="vw">vw</option>
                  <option value="vh">vh</option>
                  <option value="ch">ch</option>
                  <option value="ex">ex</option>
                  <option value="cm">cm (厘米)</option>
                  <option value="mm">mm (毫米)</option>
                  <option value="in">in (英寸)</option>
                  <option value="pc">pc (派卡)</option>
                </select>
              </div>
            </div>
            <div>
              <div class="form-row"><label>目标单位</label>
                <select id="cu-to">
                  <option value="px" selected>px (像素)</option>
                  <option value="pt">pt (点)</option>
                  <option value="em">em</option>
                  <option value="rem">rem</option>
                  <option value="%">% (百分比)</option>
                  <option value="vw">vw</option>
                  <option value="vh">vh</option>
                  <option value="ch">ch</option>
                  <option value="cm">cm (厘米)</option>
                  <option value="mm">mm (毫米)</option>
                  <option value="in">in (英寸)</option>
                  <option value="pc">pc (派卡)</option>
                </select>
              </div>
              <div class="form-row"><label>基准值</label>
                <select id="cu-base">
                  <option value="16">16px (默认)</option>
                  <option value="10">10px</option>
                  <option value="14">14px</option>
                  <option value="custom">自定义</option>
                </select>
                <input type="number" id="cu-base-custom" value="16" style="width:80px;display:none">
              </div>
            </div>
          </div>
          <div class="form-row">
            <label>视口 (vw/vh)</label>
            <input type="number" id="cu-viewport" value="1920" placeholder="宽 px" style="width:100px"> ×
            <input type="number" id="cu-viewport-h" value="1080" placeholder="高 px" style="width:100px">
          </div>
          <button class="btn btn-primary" onclick="MoreTools.doConvertCss()">换算</button>
          <div class="mt-2" id="cu-result"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">快速参考</div>
        <div class="card-body">
          <div class="grid-3 text-center text-sm">
            <div><span class="text-muted">1 in</span> = 96 px</div>
            <div><span class="text-muted">1 cm</span> = 37.8 px</div>
            <div><span class="text-muted">1 mm</span> = 3.78 px</div>
            <div><span class="text-muted">1 pt</span> = 1.33 px</div>
            <div><span class="text-muted">1 pc</span> = 16 px</div>
            <div><span class="text-muted">1 em</span> = 基准 px</div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('cu-base').addEventListener('change', () => {
      document.getElementById('cu-base-custom').style.display =
        document.getElementById('cu-base').value === 'custom' ? 'inline-block' : 'none';
    });
  },

  doConvertCss() {
    const val = parseFloat(document.getElementById('cu-value').value);
    const from = document.getElementById('cu-from').value;
    const to = document.getElementById('cu-to').value;
    let basePx = parseInt(document.getElementById('cu-base').value);
    if (basePx === -1 || isNaN(basePx)) basePx = parseInt(document.getElementById('cu-base-custom').value) || 16;
    const vw = parseInt(document.getElementById('cu-viewport').value) || 1920;
    const vh = parseInt(document.getElementById('cu-viewport-h').value) || 1080;

    if (isNaN(val)) return showToast('请输入有效的数值');

    const toPx = (v, unit) => {
      switch (unit) {
        case 'px': return v;
        case 'pt': return v * 1.33333;
        case 'em': return v * basePx;
        case 'rem': return v * basePx;
        case '%': return v / 100 * basePx;
        case 'vw': return v / 100 * vw;
        case 'vh': return v / 100 * vh;
        case 'ch': return v * basePx * 0.6;
        case 'ex': return v * basePx * 0.5;
        case 'cm': return v * 37.795;
        case 'mm': return v * 3.7795;
        case 'in': return v * 96;
        case 'pc': return v * 16;
        default: return v;
      }
    };

    const fromPx = (v, unit) => {
      switch (unit) {
        case 'px': return v;
        case 'pt': return v / 1.33333;
        case 'em': return v / basePx;
        case 'rem': return v / basePx;
        case '%': return v / basePx * 100;
        case 'vw': return v / vw * 100;
        case 'vh': return v / vh * 100;
        case 'ch': return v / (basePx * 0.6);
        case 'ex': return v / (basePx * 0.5);
        case 'cm': return v / 37.795;
        case 'mm': return v / 3.7795;
        case 'in': return v / 96;
        case 'pc': return v / 16;
        default: return v;
      }
    };

    const px = toPx(val, from);
    const result = fromPx(px, to);

    document.getElementById('cu-result').innerHTML = `
      <table>
        <tr><td>源值</td><td style="font-size:1.25rem;font-weight:600">${val}${from}</td></tr>
        <tr><td>结果</td><td style="font-size:1.5rem;font-weight:700;color:var(--accent)">${result.toFixed(4)}${to}</td></tr>
        <tr><td>中间值 (px)</td><td class="text-muted">${px.toFixed(4)} px</td></tr>
      </table>
    `;
  },

  /* ========== 12. Color Converter ========== */
  renderColorConvert() {
    document.getElementById('panel-color-convert').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">颜色输入</div>
          <div class="card-body">
            <div class="form-row"><label>Hex</label><input type="text" id="cc-hex" value="#E8765A" style="width:120px;font-family:monospace" oninput="MoreTools.colorFromHex()"></div>
            <div class="form-row"><label>RGB</label>
              <input type="number" id="cc-r" value="232" min="0" max="255" style="width:70px" oninput="MoreTools.colorFromRgb()">
              <input type="number" id="cc-g" value="118" min="0" max="255" style="width:70px" oninput="MoreTools.colorFromRgb()">
              <input type="number" id="cc-b" value="90" min="0" max="255" style="width:70px" oninput="MoreTools.colorFromRgb()">
            </div>
            <div class="form-row"><label>HSL</label>
              <input type="number" id="cc-h" value="12" min="0" max="360" style="width:70px" oninput="MoreTools.colorFromHsl()">°
              <input type="number" id="cc-s" value="75" min="0" max="100" style="width:70px" oninput="MoreTools.colorFromHsl()">%
              <input type="number" id="cc-l" value="63" min="0" max="100" style="width:70px" oninput="MoreTools.colorFromHsl()">%
            </div>
            <div class="form-row"><label>预览</label>
              <div id="cc-preview" style="width:80px;height:40px;border-radius:6px;border:1px solid var(--border);background:#E8765A"></div>
              <input type="color" id="cc-picker" value="#E8765A" oninput="MoreTools.colorFromPicker()">
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">颜色信息</div>
          <div class="card-body" id="cc-info">
            <div class="empty-state">选择颜色</div>
          </div>
        </div>
      </div>
    `;
  },

  hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  },

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  },

  hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  },

  updateColorInfo(r, g, b) {
    const hex = this.rgbToHex(r, g, b);
    const { h, s, l } = this.rgbToHsl(r, g, b);
    const hex6 = hex.substring(1);
    const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;

    document.getElementById('cc-hex').value = hex;
    document.getElementById('cc-r').value = r;
    document.getElementById('cc-g').value = g;
    document.getElementById('cc-b').value = b;
    document.getElementById('cc-h').value = h;
    document.getElementById('cc-s').value = s;
    document.getElementById('cc-l').value = l;
    document.getElementById('cc-preview').style.background = hex;
    document.getElementById('cc-picker').value = hex;

    const rgbInt = (r << 16) | (g << 8) | b;
    const complement = this.rgbToHex(255 - r, 255 - g, 255 - b);
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    const grayHex = this.rgbToHex(gray, gray, gray);

    const named = this.getColorName(r, g, b);

    document.getElementById('cc-info').innerHTML = `
      <table>
        <tr><td>HEX</td><td style="font-family:monospace;font-weight:600">${hex}</td></tr>
        <tr><td>RGB</td><td style="font-family:monospace">rgb(${r}, ${g}, ${b})</td></tr>
        <tr><td>HSL</td><td style="font-family:monospace">hsl(${h}°, ${s}%, ${l}%)</td></tr>
        <tr><td>CMYK</td><td style="font-family:monospace">cmyk(${(1 - r/255)*100|0}%, ${(1 - g/255)*100|0}%, ${(1 - b/255)*100|0}%, ${(1 - Math.max(r, g, b)/255)*100|0}%)</td></tr>
        <tr><td>整数</td><td style="font-family:monospace">${rgbInt} / 0x${hex6.toUpperCase()}</td></tr>
        <tr><td>补色</td><td><span style="display:inline-block;width:20px;height:20px;background:${complement};border-radius:3px;vertical-align:middle;margin-right:4px"></span> ${complement}</td></tr>
        <tr><td>灰度</td><td><span style="display:inline-block;width:20px;height:20px;background:${grayHex};border-radius:3px;vertical-align:middle;margin-right:4px"></span> ${grayHex} (${gray})</td></tr>
        <tr><td>亮度</td><td>${isLight ? '亮色 ☀️' : '暗色 🌙'} (${isLight ? '浅色背景适用' : '深色背景适用'})</td></tr>
        <tr><td>颜色名</td><td style="font-weight:600">${named}</td></tr>
        <tr><td>RGBA</td><td style="font-family:monospace">rgba(${r}, ${g}, ${b}, 1)</td></tr>
      </table>
    `;
  },

  colorFromHex() {
    let hex = document.getElementById('cc-hex').value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(hex) || /^#[0-9a-fA-F]{3}$/.test(hex)) {
      if (hex.length === 4) hex = '#' + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
      const {r, g, b} = this.hexToRgb(hex);
      this.updateColorInfo(r, g, b);
    }
  },

  colorFromRgb() {
    const r = parseInt(document.getElementById('cc-r').value) || 0;
    const g = parseInt(document.getElementById('cc-g').value) || 0;
    const b = parseInt(document.getElementById('cc-b').value) || 0;
    this.updateColorInfo(Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b)));
  },

  colorFromHsl() {
    const h = parseInt(document.getElementById('cc-h').value) || 0;
    const s = parseInt(document.getElementById('cc-s').value) || 0;
    const l = parseInt(document.getElementById('cc-l').value) || 0;
    const {r, g, b} = this.hslToRgb(h, s, l);
    this.updateColorInfo(r, g, b);
  },

  colorFromPicker() {
    const hex = document.getElementById('cc-picker').value;
    const {r, g, b} = this.hexToRgb(hex);
    this.updateColorInfo(r, g, b);
  },

  getColorName(r, g, b) {
    const colors = {
      '#000000': 'Black', '#FFFFFF': 'White', '#FF0000': 'Red', '#00FF00': 'Lime',
      '#0000FF': 'Blue', '#FFFF00': 'Yellow', '#FF00FF': 'Magenta', '#00FFFF': 'Cyan',
      '#C0C0C0': 'Silver', '#808080': 'Gray', '#800000': 'Maroon', '#808000': 'Olive',
      '#008000': 'Green', '#800080': 'Purple', '#008080': 'Teal', '#000080': 'Navy',
      '#FFA500': 'Orange', '#FFC0CB': 'Pink', '#FFD700': 'Gold', '#A0522D': 'Sienna',
      '#E8765A': 'Warm Coral', '#8B4513': 'SaddleBrown', '#2E8B57': 'SeaGreen',
      '#6A5ACD': 'SlateBlue', '#DEB887': 'Burlywood', '#D2691E': 'Chocolate',
      '#F5DEB3': 'Wheat', '#9ACD32': 'YellowGreen', '#87CEEB': 'SkyBlue',
      '#DA70D6': 'Orchid', '#FFE4B5': 'Moccasin',
    };
    const hex = this.rgbToHex(r, g, b).toUpperCase();
    if (colors[hex]) return colors[hex];
    const closest = Object.entries(colors).reduce((best, [h, name]) => {
      const {r: cr, g: cg, b: cb} = this.hexToRgb(h);
      const dist = Math.sqrt((r-cr)**2 + (g-cg)**2 + (b-cb)**2);
      return dist < best.dist ? {name, dist} : best;
    }, {name: 'Unknown', dist: Infinity});
    return closest.dist < 100 ? closest.name : 'Custom Color';
  },

};
