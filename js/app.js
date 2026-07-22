const tools = {
  /* === 高级工具 === */
  'stream': { name: 'Data Stream Pipeline', desc: '可视化数据管道，支持 CSV/JSON/文本解析和链式处理', usage: '选择数据源格式 → 输入数据 → 点击"解析数据源"→ 在"处理步骤"区域，点击"添加步骤"选择过滤/映射/排序等操作 → 点击"执行管道"查看结果', module: StreamTools, init: 'renderStreamPipeline' },
  'json-explorer': { name: 'JSON Explorer', desc: '交互式 JSON 树浏览，支持字段提取和 JSONPath 查询', usage: '粘贴 JSON 数据 → 点击"构建树"→ 点击树节点中的值可提取到输出区 → 或在 JSONPath 输入框输入路径（如 $.users[*].name）点击"提取"', module: AdvTools, init: 'renderJsonExplorer' },
  'list-compare': { name: '多列表比对', desc: '对比 2~5 个列表的共有/独有/重叠数据', usage: '在 2~5 个输入框中各粘贴数据（每行一项）→ 点击"比对全部列表"→ 结果区分"独有""共有""部分重叠"三类展示，支持忽略大小写选项', module: AdvTools, init: 'renderListCompare' },

  /* === 文本处理 === */
  'col-select': { name: '列选择模式', desc: '按分隔符提取文本中的指定列，支持表格预览', usage: '输入带分隔符的文本（Tab/逗号等）→ 选择分隔符 → 指定提取的列号或列名 → 点击"提取列"→ 支持仅提取、排除选择、追加模式', module: TextTools, init: 'renderColumnSelect' },
  'col-process': { name: '列处理', desc: '对指定列进行排序、去重、替换、筛选等操作', usage: '输入带分隔符的文本 → 选择分隔符并点击"解析数据源"→ 选择要处理的列 → 选择操作类型（排序/去重/替换/筛选/大小写转换）→ 点击"执行"', module: TextTools, init: 'renderColumnProcess' },
  'string-wrap': { name: '包裹字符串', desc: '批量给文本添加前缀后缀，支持引号/括号/HTML标签等预设', usage: '输入多行文本 → 选择预设包裹（引号/括号/HTML 标签/XML 标签/Markdown）或自定义前缀后缀 → 点击"包裹"', module: TextTools, init: 'renderStringWrap' },
  'string-join': { name: '字符串连接', desc: '将多行文本用自定义分隔符合并，支持模板语法', usage: '输入多行文本 → 设置连接符（逗号/换行/自定义）→ 可使用 {1}{2} 模板语法引用各列 → 点击"连接"', module: TextTools, init: 'renderStringJoin' },
  'case-convert': { name: '大小写转换', desc: '在 upper/lower/camel/pascal/snake/kebab 等命名风格间转换', usage: '输入文本 → 点击目标命名风格按钮 → 一键转换，结果自动选中方便复制', module: TextTools, init: 'renderCaseConvert' },
  'text-sort': { name: '排序/去重', desc: '对文本行进行排序、去重、打乱或反转', usage: '输入文本 → 点击排序/去重/打乱/反转按钮 → 可设置忽略大小写、排序方式（升序/降序）和数字排序', module: TextTools, init: 'renderTextSort' },
  'text-diff': { name: '文本对比', desc: '使用 LCS 算法对比两段文本的差异', usage: '在左右两个输入框分别粘贴文本 → 点击"对比"→ 差异部分用红绿色高亮显示（红色为删除、绿色为新增）', module: TextTools, init: 'renderTextDiff' },
  'regex': { name: '正则测试', desc: '测试正则表达式的匹配和替换效果，实时高亮结果', usage: '输入正则表达式 → 输入测试文本 → 实时查看匹配高亮 → 可在替换区域输入替换文本并执行替换（支持 $1 捕获组引用）', module: TextTools, init: 'renderRegexTester' },

  /* === JSON 工具 === */
  'json': { name: 'JSON 格式化', desc: '格式化/压缩/校验 JSON，支持导出为 CSV', usage: '粘贴 JSON 文本 → 点击"格式化"美化排版（2空格缩进）→ 点击"压缩"去除空白 → 点击"校验"检查语法 → 支持导出为 CSV 格式', module: JsonTools, init: 'renderJsonFormatter' },
  'json-yaml': { name: 'JSON ↔ YAML', desc: '在 JSON 和 YAML 格式之间互转', usage: '在左侧输入 JSON 或 YAML → 点击转换按钮 → 自动识别源格式并转换为目标格式 → 支持复制结果', module: JsonTools, init: 'renderJsonToYaml' },

  /* === 编码解码 === */
  'base64': { name: 'Base64', desc: 'Base64 编解码，支持文本和文件上传', usage: '输入文本或切换到"文件"模式上传文件 → 点击"编码"或"解码"按钮 → 支持 UTF-8 和 Latin-1 字符集', module: EncodeTools, init: 'renderBase64' },
  'url': { name: 'URL 编码', desc: 'URL 编解码及查询参数提取/生成', usage: '输入 URL 字符串 → 点击"编码"或"解码"→ 点击"提取参数"解析查询字符串 → 表格形式展示键值对', module: EncodeTools, init: 'renderUrlEncode' },
  'html': { name: 'HTML 编码', desc: 'HTML 实体编解码及标签剥离', usage: '输入 HTML 文本 → 点击"编码"转义特殊字符（< > & "）→ 点击"解码"还原 → 点击"剥离标签"去除所有 HTML 标签', module: EncodeTools, init: 'renderHtmlEncode' },

  /* === 安全 & 生成 === */
  'hash': { name: '哈希计算', desc: '计算 MD5/SHA-1/SHA-256/SHA-512 哈希值（基于 Web Crypto API）', usage: '输入文本 → 选择哈希算法 → 点击"计算"→ 支持同时显示所有算法结果方便对比', module: EncodeTools, init: 'renderHashTools' },
  'uuid': { name: 'UUID 生成', desc: '生成 UUID v4/ULID/NanoID/CUID 等多种唯一标识', usage: '选择 ID 类型（UUID/ULID/NanoID/CUID）→ 设置大小写 → 点击"生成"→ 支持批量生成（可配置数量）→ 一键复制', module: EncodeTools, init: 'renderUuidGenerator' },
  'timestamp': { name: '时间戳转换', desc: 'Unix 时间戳与日期时间互转，支持毫秒/秒精度', usage: '输入时间戳（秒或毫秒）或选择日期时间 → 自动在两种格式间双向转换 → 支持实时时钟显示当前时间戳', module: EncodeTools, init: 'renderTimestamp' },

  /* === 冷门/新奇工具 === */
  'ascii-art': { name: 'ASCII Art', desc: '将文字转换为 ASCII 艺术字（方块/简单/泡泡字体）', usage: '输入文字 → 选择字体样式（方块/简单/泡泡）→ 点击"生成"→ 可选择复制结果到剪贴板', module: MoreTools, init: 'renderAsciiArt' },
  'morse': { name: '莫尔斯电码', desc: '莫尔斯电码编解码，支持音频播放', usage: '输入文字或莫尔斯码（点用 . 表示，划用 - 表示，空格分隔字母）→ 点击"编码"或"解码"→ 点击"播放"通过音频收听莫尔斯码', module: MoreTools, init: 'renderMorse' },
  'levenshtein': { name: '编辑距离', desc: '计算 Levenshtein/Hamming/Jaccard/Cosine 文本相似度', usage: '输入两段文本 → 选择算法 → 点击"计算"→ 显示距离数值和相似度百分比', module: MoreTools, init: 'renderLevenshtein' },
  'password': { name: '密码检测/生成', desc: '密码强度评估（熵值+破解时间）及随机密码生成', usage: '输入密码可实时查看强度评估（熵值、破解时间、评分）→ 或在生成区域配置长度/字符类型生成随机密码', module: MoreTools, init: 'renderPassword' },
  'base-convert': { name: '进制转换', desc: '2~36 进制数字互转，支持所有进制同时显示', usage: '输入数字 → 选择源进制 → 选择目标进制 → 点击"转换"→ 支持"全部进制"模式同时显示 2~36 进制的所有结果', module: MoreTools, init: 'renderBaseConvert' },
  'string-escape': { name: '字符串转义', desc: '字符串的转义/反转义，支持 Java/JS/Python/SQL/HTML/URL', usage: '输入字符串 → 选择目标语言（Java/JS/Python/SQL/HTML/URL）→ 选择"转义"或"反转义"→ 支持特殊字符如 \\n \\t 的处理', module: MoreTools, init: 'renderStringEscape' },
  'rot': { name: 'ROT加密', desc: 'ROT13/47/5/18 及恺撒密码的加密和解密', usage: '输入文本 → 选择 ROT 类型（13/47/5/18）或自定义偏移量（1~25）→ 点击"加密"或"解密"', module: MoreTools, init: 'renderRot' },
  'wordfreq': { name: '字频统计', desc: '统计文本中的词频和字符分布，支持柱状图展示', usage: '输入文本 → 点击"统计"→ 可切换查看词频或字符频次 → 支持柱状图可视化展示前 N 个高频项', module: MoreTools, init: 'renderWordFreq' },
  'roman': { name: '罗马数字', desc: '阿拉伯数字与罗马数字互转（1~3999）', usage: '输入阿拉伯数字（如 2024）或罗马数字（如 MMXXIV）→ 自动识别并双向转换 → 范围 1~3999', module: MoreTools, init: 'renderRomanNumeral' },
  'text-repeat': { name: '文本重复/行号', desc: '批量重复文本或为每行添加行号', usage: '输入文本 → 设置重复次数或选择"添加行号"→ 支持自定义行号格式（如 "第1行"）和起始值', module: MoreTools, init: 'renderTextRepeat' },
  'css-units': { name: 'CSS单位换算', desc: 'px/pt/em/rem/%/vw/vh/cm/mm/in/pc 等 CSS 单位互相换算', usage: '输入数值和源单位 → 选择目标单位 → 点击"换算"→ 基准值 16px 下同时显示所有单位的换算结果', module: MoreTools, init: 'renderCssUnits' },
  'color-convert': { name: '颜色转换', desc: 'Hex/RGB/HSL/CMYK 颜色格式互转，带拾色器和互补色', usage: '输入颜色值（如 #ff6600 或 rgb(255,102,0)）或使用拾色器选择颜色 → 自动识别输入格式并显示所有格式转换结果 → 同时显示色块预览和互补色', module: MoreTools, init: 'renderColorConvert' },
  'spring-boot-banner': { name: 'Spring Boot Banner', desc: '生成 Spring Boot 风格的 ASCII Banner 文字', usage: '输入文字 → 选择字体变体（标准/加粗/实心/放大）→ 点击"生成 Banner"→ 预览效果 → 一键复制到剪贴板', module: AdvTools, init: 'renderSpringBootBanner' },
  'csv-process': { name: 'CSV 处理', desc: 'CSV 数据处理，支持按行/按列/查找替换/正则/清洗/转SQL/JSON/Markdown', usage: '输入 CSV 数据或上传文件 → 选择处理模式（按行/按列/查找替换/正则匹配/数据清洗/转SQL/JSON/Markdown）→ 配置参数 → 点击"执行处理"→ 支持撤销重做、复制、下载', module: CsvTools, init: 'renderCsvProcess' },

  /* === 实用工具 === */
  'sql-formatter': { name: 'SQL 格式化', desc: 'SQL 关键字大写高亮、子句缩进排版、压缩模式', usage: '粘贴 SQL 语句 → 点击"格式化"美化排版（关键字大写、子句换行缩进）→ 点击"压缩"去除多余空白 → 一键复制结果', module: AdvTools, init: 'renderSqlFormatter' },
  'mermaid': { name: 'Mermaid 图表', desc: '通过文本生成流程图、时序图、类图等图表（需网络加载库）', usage: '输入 Mermaid 语法（如 graph TD; A-->B;）→ 点击"渲染图表"预览 → 支持导出为 SVG 文件 → 可参考下方常用语法速查', module: AdvTools, init: 'renderMermaid' },
  'cron': { name: 'Cron 解析', desc: '解析 Cron 表达式为可读说明，计算未来执行时间', usage: '输入 Cron 表达式（5 字段如 */5 * * * * 或 6 字段）→ 点击"解析"→ 查看每个字段的详细说明 → 下方显示最近 5 次执行时间', module: AdvTools, init: 'renderCronParser' },
  'xml-formatter': { name: 'XML 格式化', desc: 'XML 格式化/压缩/校验，自动检测语法错误', usage: '粘贴 XML 文本 → 点击"格式化"美化排版 → 点击"压缩"去除空白 → 点击"验证"检查 XML 语法正确性', module: AdvTools, init: 'renderXmlFormatter' },
  'ua-parser': { name: 'UA 解析', desc: '解析 User-Agent 字符串，提取浏览器/OS/设备信息', usage: '输入 User-Agent 字符串 → 点击"解析"→ 自动识别浏览器名称版本、操作系统、设备类型和渲染引擎 → 可使用预设按钮快速尝试', module: AdvTools, init: 'renderUaParser' },
  'ascii-table': { name: 'ASCII 表格', desc: '将分隔符文本转换为美观的 ASCII 表格（支持居中/对齐）', usage: '输入表格数据 → 选择分隔符（Tab/逗号等）→ 选择对齐方式（左/中/右）→ 勾选"首行为标题"→ 点击"生成表格"→ 一键复制', module: AdvTools, init: 'renderAsciiTable' },
  'date-format': { name: '日期格式转换', desc: '将日期时间字符串转换为任意格式，支持时间戳/ISO/RFC等常用格式', usage: '输入日期时间字符串或时间戳 → 点击"转换"→ 自动识别格式并显示 10+ 种常用格式的结果 → 可在"自定义格式"区使用模板字符串（yyyy/MM/dd/HH/mm/ss/SSS/Z）输出任意格式', module: AdvTools, init: 'renderDateFormat' },
  'http-codes': { name: 'HTTP 状态码', desc: '快速查阅 HTTP 状态码的含义和说明，支持搜索过滤', usage: '在搜索框输入状态码号或关键词（如 404、Not Found）→ 实时过滤显示匹配的状态码 → 表格展示代码+名称+说明+分类', module: AdvTools, init: 'renderHttpCodes' },
  'ascii-codes': { name: 'ASCII 码表', desc: 'ASCII 0~127 完整对照表：字符/十进制/十六进制/二进制', usage: '查看完整的 ASCII 表 → 可在搜索框按字符或编码值快速定位', module: AdvTools, init: 'renderAsciiCodes' },
  'data-size': { name: '数据大小换算', desc: 'B/KB/MB/GB/TB/PB/EB 及比特单位互相换算', usage: '输入数值 → 选择源单位（B/KB/MB/GB/TB/PB/bit）→ 自动显示所有单位的等值换算结果', module: AdvTools, init: 'renderDataSize' },
  'text-stats': { name: '文本统计', desc: '统计文本的字符数/单词数/行数/段落数/CJK字符数等', usage: '输入文本 → 实时显示各种统计指标：总字符(含空格/不含空格)、单词数、行数、段落数、中文字符数、标点数、字节数', module: AdvTools, init: 'renderTextStats' },
  'time-duration': { name: '时间间隔换算', desc: '将秒数转换为可读的时间间隔，或将时间描述字符串转为秒', usage: '输入秒数 → 自动换算为周/天/时/分/秒/毫秒 → 也可在右侧输入"2天3小时30分"等自然语言反算秒数', module: AdvTools, init: 'renderTimeDuration' },
  'port-lookup': { name: '端口查询', desc: '查询常见端口号对应的服务名称和协议', usage: '在搜索框输入端口号或服务名（如 3306、MySQL）→ 实时过滤显示匹配的端口信息', module: AdvTools, init: 'renderPortLookup' },
};

function initApp() {
  // 懒加载：不在启动时渲染所有面板，首次切换到工具时才按需渲染
  const hash = window.location.hash.slice(1) || 'col-select';
  navigateTo(hash);
}

function navigateTo(toolId) {
  if (!tools[toolId]) return;

  // 懒加载：面板首次激活时才调用 render 方法构建 DOM
  const panel = document.getElementById(`panel-${toolId}`);
  if (panel && panel.innerHTML.trim() === '') {
    const t = tools[toolId];
    try {
      if (t.module && t.init && typeof t.module[t.init] === 'function') {
        t.module[t.init]();
      }
    } catch (e) {
      console.error(`工具 "${toolId}" 初始化失败:`, e);
      panel.innerHTML = `<div class="empty-state">⚠️ 工具加载失败：${e.message}</div>`;
    }
  }

  document.querySelectorAll('.tool-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  if (panel) panel.classList.add('active');

  const navItem = document.querySelector(`[data-tool="${toolId}"]`);
  if (navItem) navItem.classList.add('active');

  const header = document.getElementById('tool-header-name');
  if (header) header.textContent = tools[toolId].name;

  const desc = document.getElementById('tool-desc');
  if (desc) desc.textContent = tools[toolId].desc || '';

  const guideBody = document.getElementById('guide-body');
  const guideToggle = document.getElementById('guide-toggle');
  if (guideBody) {
    guideBody.innerHTML = tools[toolId].usage || '暂无使用说明';
    guideBody.style.display = 'none';
    guideBody.classList.remove('open');
  }
  if (guideToggle) guideToggle.textContent = '▸';

  window.location.hash = toolId;
}

function toggleGuide() {
  const body = document.getElementById('guide-body');
  const toggle = document.getElementById('guide-toggle');
  if (!body) return;
  if (body.classList.contains('open')) {
    body.classList.remove('open');
    body.style.display = 'none';
    toggle.textContent = '▸';
  } else {
    body.classList.add('open');
    body.style.display = 'block';
    toggle.textContent = '▼';
  }
}

function filterTools() {
  const q = document.getElementById('tool-search').value.trim().toLowerCase();
  const nav = document.querySelector('.sidebar-nav');
  const children = Array.from(nav.children);

  // 第一遍：过滤所有 nav-item
  children.forEach(el => {
    if (!el.classList.contains('nav-item')) return;
    if (!q) { el.style.display = ''; return; }
    const id = el.getAttribute('data-tool');
    const t = tools[id];
    const match = t && (t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
    el.style.display = match ? '' : 'none';
  });

  // 第二遍：根据 nav-item 可见性决定 nav-section 可见性
  let currentSection = null;
  children.forEach(el => {
    if (el.classList.contains('nav-section')) {
      // 先关闭上一个 section（如果没有可见子项）
      if (currentSection && !currentSection.hasVisible) {
        currentSection.el.style.display = 'none';
      }
      currentSection = { el: el, hasVisible: false };
      el.style.display = '';
    } else if (currentSection && el.classList.contains('nav-item')) {
      if (el.style.display !== 'none') {
        currentSection.hasVisible = true;
      }
    }
  });
  // 处理最后一个 section
  if (currentSection && !currentSection.hasVisible) {
    currentSection.el.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1) || 'col-select';
  navigateTo(hash);
});
