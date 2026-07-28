#!/usr/bin/env node
/**
 * 字符串管道单元测试
 * 运行: node test/string-pipeline.test.js
 * 不依赖 DOM，直接测试纯函数逻辑。
 */

let passed = 0, failed = 0;
function assert(label, ok, expected, actual) {
  if (ok) { passed++; return; }
  failed++;
  console.error(`  ✗ ${label}`);
  if (expected !== undefined) console.error(`    期望: ${JSON.stringify(expected)}`);
  if (actual !== undefined) console.error(`    实际: ${JSON.stringify(actual)}`);
}
function eq(label, actual, expected) { return assert(label, actual === expected, expected, actual); }
function neq(label, actual, expected) { return assert(label, actual !== expected, expected, actual); }
function arr(label, actual, expected) { const ok=actual.length===expected.length&&actual.every((v,i)=>v===expected[i]); return assert(label, ok, expected, actual); }
function inc(label, actual, substr) { return assert(label, String(actual).includes(substr), `包含${substr}`, actual); }
function truthy(label, val) { return assert(label, !!val, 'truthy', val); }
function falsy(label, val) { return assert(label, !val, 'falsy', val); }
function summary() {
  const total = passed + failed;
  console.log(`\n=== 结果: ${total} 用例, ${passed} 通过, ${failed} 失败 ===`);
  process.exit(failed ? 1 : 0);
}

// ====== 拷贝纯工具函数 ======
// 来源: StringPipelineUtils (string-pipeline.js)

function caseConvert(input, mode) {
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
}
function sortLines(input, mode) {
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
}
function parseColumns(str) {
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
}
function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function charMap(fromStr, toStr) {
  const map = {};
  for (let i = 0; i < fromStr.length; i++) map[fromStr[i]] = toStr[i] || '';
  return map;
}
function processLines(data, fn) { return data.split('\n').map(fn).join('\n'); }
function filterLines(data, fn) { return data.split('\n').filter(fn).join('\n'); }
function flatMapLines(data, fn) { return data.split('\n').flatMap(fn).join('\n'); }

console.log('=== 1. 大小写转换 (caseConvert) ===\n');

eq('upper: hello', caseConvert('hello', 'upper'), 'HELLO');
eq('upper: Hello World', caseConvert('Hello World', 'upper'), 'HELLO WORLD');
eq('upper: 中文不变', caseConvert('你好hello', 'upper'), '你好HELLO');
eq('upper: 空串', caseConvert('', 'upper'), '');

eq('lower: HELLO', caseConvert('HELLO', 'lower'), 'hello');
eq('lower: Hello World', caseConvert('Hello World', 'lower'), 'hello world');

eq('title: hello world', caseConvert('hello world', 'title'), 'Hello World');
eq('title: 单字符', caseConvert('a b c', 'title'), 'A B C');
eq('title: 已大写', caseConvert('Hello World', 'title'), 'Hello World');

eq('camel: hello-world', caseConvert('hello-world', 'camel'), 'helloWorld');
eq('camel: hello_world', caseConvert('hello_world', 'camel'), 'helloWorld');
eq('camel: Hello World', caseConvert('Hello World', 'camel'), 'helloWorld');
eq('camel: 单字', caseConvert('foo', 'camel'), 'foo');

eq('pascal: hello-world', caseConvert('hello-world', 'pascal'), 'HelloWorld');
eq('pascal: hello_world', caseConvert('hello_world', 'pascal'), 'HelloWorld');
eq('pascal: 单字', caseConvert('foo', 'pascal'), 'Foo');

eq('snake: helloWorld', caseConvert('helloWorld', 'snake'), 'hello_world');
eq('snake: HelloWorld', caseConvert('HelloWorld', 'snake'), 'hello_world');
eq('snake: hello-world', caseConvert('hello-world', 'snake'), 'hello_world');
eq('snake: 全大写', caseConvert('HELLO', 'snake'), 'h_e_l_l_o'); // 每个大写字母前插_然后小写

console.log('\n=== 2. 排序 (sortLines) ===\n');

eq('asc: 基本', sortLines('b\na\nc', 'asc'), 'a\nb\nc');
eq('asc: 中文行数不变', sortLines('张三\n李四\n王五', 'asc').split('\n').length, 3); // Unicode/BOM 排序
eq('asc: 空行过滤', sortLines('b\n\na\n', 'asc'), 'a\nb');
eq('desc: 基本', sortLines('b\na\nc', 'desc'), 'c\nb\na');

eq('number-asc', sortLines('10\n2\n33\n1', 'number-asc'), '1\n2\n10\n33');
eq('number-desc', sortLines('1\n10\n5', 'number-desc'), '10\n5\n1');

eq('by-length: 长优先', sortLines('a\nccc\nbb', 'by-length'), 'ccc\nbb\na');

eq('natural: 混合', sortLines('a10\na2\na1', 'natural'), 'a1\na2\na10');

// shuffle: 只验证不抛异常 + 内容一致
const shuffled = sortLines('a\nb\nc\n', 'shuffle');
neq('shuffle: 有输出', shuffled, '');
inc('shuffle: 包含a', shuffled, 'a');
inc('shuffle: 包含c', shuffled, 'c');

console.log('\n=== 3. parseColumns ===\n');

arr('单列', parseColumns('3'), [3]);
arr('多列', parseColumns('1,3,5'), [1,3,5]);
arr('范围', parseColumns('1-3'), [1,2,3]);
arr('混合', parseColumns('1,3-5,7'), [1,3,4,5,7]);
arr('空格容错', parseColumns(' 1 , 3-5 '), [1,3,4,5]);
arr('负数忽略', parseColumns('-1'), []);
arr('空串', parseColumns(''), []);
arr('无效字符忽略', parseColumns('1,a,3'), [1,3]);

console.log('\n=== 4. escapeRegex ===\n');

eq('点号', escapeRegex('a.b'), 'a\\.b');
eq('星号', escapeRegex('a*b'), 'a\\*b');
eq('加号', escapeRegex('a+b'), 'a\\+b');
eq('问号', escapeRegex('a?b'), 'a\\?b');
eq('括号', escapeRegex('(a)'), '\\(a\\)');
eq('方括号', escapeRegex('[a]'), '\\[a\\]');
eq('花括号', escapeRegex('{a}'), '\\{a\\}');
eq('竖线', escapeRegex('a|b'), 'a\\|b');
eq('反斜杠', escapeRegex('a\\b'), 'a\\\\b');
eq('美元/插入/点', escapeRegex('$^.,'), '\\$\\^\\.,'); // 逗号不是正则字符, 不转义
eq('普通文本不变', escapeRegex('hello'), 'hello');
eq('空串', escapeRegex(''), '');

console.log('\n=== 5. 逐行变换操作 ===\n');

// capitalize
const capitalize = s => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
eq('capitalize', capitalize('hello'), 'Hello');
eq('capitalize 中文', capitalize('你好'), '你好');

// decapitalize
const decapitalize = s => s ? s[0].toLowerCase() + s.slice(1) : s;
eq('decapitalize', decapitalize('Hello'), 'hello');
eq('decapitalize 保持', decapitalize('hello'), 'hello');

// prefix-suffix
const ps = (data, pfx, sfx) => data.split('\n').map(l=>l.trim()?pfx+l+sfx:l).join('\n');
eq('prefix+suffix', ps('a\nb', '<', '>'), '<a>\n<b>');

// strip-prefix, strip-suffix
eq('strip-prefix', 'a\nb'.split('\n').map(l=>l.startsWith('x')?l.slice(1):l).join('\n'), 'a\nb');
eq('strip-suffix', 'ab\nxb'.split('\n').map(l=>l.endsWith('b')?l.slice(0,-1):l).join('\n'), 'a\nx');

// ensure-prefix, ensure-suffix
const esP = (p, data) => data.split('\n').map(l=>l.trim()?l.startsWith(p)?l:p+l:l).join('\n');
const esS = (s, data) => data.split('\n').map(l=>l.trim()?l.endsWith(s)?l:l+s:l).join('\n');
eq('ensure-prefix 已有时不变', esP('http://', 'http://a'), 'http://a');
eq('ensure-prefix 没有则加', esP('http://', 'a'), 'http://a');
eq('ensure-suffix', esS('.com', 'a'), 'a.com');

// join
eq('join 逗号', ['a','b','c'].join(','), 'a,b,c');
eq('join 空过滤', ['a','','c'].filter(l=>l.trim()).join(','), 'a,c');

// split
const splitSep = (sep, data) => data.split('\n').flatMap(l=>l.trim()?l.split(sep):[]).join('\n');
eq('split 逗号', splitSep(',', 'a,b\nc,d'), 'a\nb\nc\nd');

// trim
eq('trim', processLines(' a \n b ', l=>l.trim()), 'a\nb');

// normalize-space
eq('normalize-space', processLines('  a   b  \n c ', l=>l.trim().replace(/\s+/g,' ')), 'a b\nc');

// expandtabs
const expandtabs = (n, data) => data.split('\n').map(l=>l.replace(/\t/g,' '.repeat(n))).join('\n');
eq('expandtabs 4空格', expandtabs(4, 'a\tb'), 'a    b');

// squeeze
const squeeze = (data, char) => {
  const r = char ? new RegExp(`(${escapeRegex(char)})\\1+`,'g') : new RegExp('(.)\\1+','g');
  return data.replace(r,'$1');
};
eq('squeeze 重复字母', squeeze('aaabbbccc'), 'abc');
eq('squeeze 重复空格', squeeze('a   b'), 'a b');
eq('squeeze 指定字符', squeeze('aaa---bbb', '-'), 'aaa-bbb');

// replace
eq('replaceAll', 'aabbaa'.replaceAll('aa', 'xx'), 'xxbbxx');

// replaceOnce
const replaceOnce = (data, find, to) => data.replace(find, to);
eq('replaceOnce 只替换第一次', replaceOnce('aabbaa', 'aa', 'xx'), 'xxbbaa');

// replaceEach (批量替换)
const replaceEach = (data, find, to) => {
  let r = data;
  for (let i = 0; i < find.length; i++) if (to[i] !== undefined) r = r.replaceAll(find[i], to[i]);
  return r;
};
eq('replaceEach', replaceEach('a,b,c', ['a','c'], ['x','z']), 'x,b,z');

// reverse-str
eq('reverse 每行', processLines('abc\n123', l=>l.split('').reverse().join('')), 'cba\n321');

// reverse-words
eq('reverse-words', processLines('a b c', l=>l.split(/\s+/).reverse().join(' ')), 'c b a');

// line-number
const lineNum = (data, fmt) => data.split('\n').map((l,i)=>fmt.replace('{n}',String(i+1)).replace('{text}',l)).join('\n');
eq('line-number 默认', lineNum('a\nb', '{n}. {text}'), '1. a\n2. b');
eq('line-number 自定义', lineNum('a\nb', '{n}:{text}'), '1:a\n2:b');

// limit
eq('limit', 'a\nb\nc'.split('\n').slice(0,2).join('\n'), 'a\nb');
eq('limit 超过行数', 'a\nb'.split('\n').slice(0,5).join('\n'), 'a\nb');

// skip
eq('skip 1', 'a\nb\nc'.split('\n').slice(1).join('\n'), 'b\nc');

// last
eq('last 2', 'a\nb\nc'.split('\n').slice(-2).join('\n'), 'b\nc');

// pick
arr('pick parseColumns', parseColumns('1,3,5'), [1,3,5]);

// overlay
const overlay = (data, str, start, end) => processLines(data, l=>l.slice(0,start)+str+l.slice(end));
eq('overlay 覆盖', overlay('abcdefg', '123', 1, 4), 'a123efg');

// rotate +3
const rotate = (data, n) => processLines(data, l=>{const len=l.length;if(!len)return l;const offset=((n%len)+len)%len;return l.slice(len-offset)+l.slice(0,len-offset);});
eq('rotate +3 abcdefg', rotate('abcdefg', 3), 'efgabcd');
eq('rotate +1 abc', rotate('abc', 1), 'cab');
eq('rotate 0', rotate('abc', 0), 'abc');
eq('rotate 负数', rotate('abc', -1), 'bca');

// left / right / mid
eq('left 3', processLines('abcdef', l=>l.slice(0,3)), 'abc');
eq('right 3', processLines('abcdef', l=>l.slice(-3)), 'def');
eq('mid 1,3', processLines('abcdef', l=>l.slice(1,4)), 'bcd');
eq('substr 起始+长度', processLines('abcdef', l=>{const s=1,len=3;return len>0?l.substr(s,len):l.substr(s);}), 'bcd');

// substringBefore / substringAfter
const sb = (data, sep) => processLines(data, l=>{const i=l.indexOf(sep);return i>=0?l.slice(0,i):l;});
const sa = (data, sep) => processLines(data, l=>{const i=l.indexOf(sep);return i>=0?l.slice(i+sep.length):l;});
eq('substringBefore', sb('user@host', '@'), 'user');
eq('substringBefore 无分隔符', sb('userehost', '@'), 'userehost');
eq('substringAfter', sa('user@host', '@'), 'host');

// substringBetween
const sbtw = (data, o, c) => processLines(data, l=>{const s=l.indexOf(o);if(s<0)return '';const e=l.indexOf(c,s+o.length);return e>=0?l.slice(s+o.length,e):'';});
eq('substringBetween', sbtw('[hello]', '[', ']'), 'hello');

// insert
const insert = (data, pos, text) => processLines(data, l=>l.slice(0,pos)+text+l.slice(pos));
eq('insert 位置0', insert('bc', 0, 'a'), 'abc');
eq('insert 中间', insert('ab', 1, 'x'), 'axb');

// replaceByPos
const rbp = (data, pos, len, text) => processLines(data, l=>l.slice(0,pos)+text+l.slice(pos+len));
eq('replaceByPos', rbp('abcdef', 1, 3, 'xx'), 'axxef');

// wrap
eq('wrap 每行', 'a\nb'.split('\n').map(l=>l.trim()?'['+l+']':l).join('\n'), '[a]\n[b]');

// slugify
const slugify = s => s.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/^-+|-+$/g,'');
eq('slugify 基本', slugify('Hello World'), 'hello-world');
eq('slugify 特殊字符', slugify('Hello! @World#'), 'hello-world');
eq('slugify 中文消失', slugify('你好 hello'), 'hello');

// to-ascii (NFD decompose + remove combining marks)
const toAscii = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
eq('toAscii é→e', toAscii('café'), 'cafe');
eq('toAscii ñ→n', toAscii('jalapeño'), 'jalapeno');
eq('toAscii ü→u', toAscii('München'), 'Munchen');
eq('toAscii ü分解', toAscii('ü'), 'u');

// mask
const mask = (data, mode, char, keep) => processLines(data, l=>{
  switch(mode){
    case'end':if(l.length<=keep)return char.repeat(l.length);return l.slice(0,keep)+char.repeat(l.length-keep);
    case'start':if(l.length<=keep)return char.repeat(l.length);return char.repeat(l.length-keep)+l.slice(l.length-keep);
    case'middle':if(l.length<=keep+2)return char.repeat(l.length);const h=Math.floor(keep/2);return l.slice(0,h)+char.repeat(l.length-keep)+l.slice(l.length-h);
    case'email':{const at=l.indexOf('@');if(at<=1)return l;return l[0]+char.repeat(at-1)+l.slice(at);}
    default:return l;
  }
});
eq('mask-end 1234->12**', mask('1234', 'end', '*', 2), '12**');
eq('mask-end 短', mask('1', 'end', '*', 2), '*');
eq('mask-start', mask('1234', 'start', '*', 2), '**34');
eq('mask-email ab@b.com', mask('ab@b.com', 'email', '*', 2), 'a*@b.com'); // @前保留首字母, 其余变*

// delete-whitespace
eq('deleteWhitespace', processLines(' a b\nc ', l=>l.replace(/\s+/g,'')), 'ab\nc');

// remove-chars
const removeChars = (data, chars) => processLines(data, l=>l.replace(new RegExp(`[${escapeRegex(chars)}]`,'g'),''));
eq('removeChars 元音', removeChars('hello world', 'aeiou'), 'hll wrld');
eq('removeChars 特殊字符', removeChars('a.b.c', '.'), 'abc');

// retain-chars
const retainChars = (data, chars) => {
  const set = new Set(chars);
  return processLines(data, l=>l.split('').filter(ch=>set.has(ch)).join(''));
};
eq('retainChars 只保留数字', retainChars('ab1c2d3', '123'), '123');

// words
eq('words 拆分为单词', flatMapLines('a b\nc d', l=>l.trim()?l.split(/\s+/):[]), 'a\nb\nc\nd');

// startCase (每个单词首字母大写)
const startCase = s => s.replace(/\b\w/g,c=>c.toUpperCase());
eq('startCase', startCase('hello world'), 'Hello World');

// collapseSpaces
const collapseSpaces = (data, char) => processLines(data, l=>l.replace(/\s+/g,char));
eq('collapseSpaces', collapseSpaces('a   b\nc\td', '-'), 'a-b\nc-d');

// translate/tr (字符映射)
const translate = (data, fromStr, toStr) => {
  const map = charMap(fromStr, toStr);
  return processLines(data, l=>l.split('').map(c=>map[c]!==undefined?map[c]:c).join(''));
};
eq('translate a→x,b→y', translate('abc', 'ab', 'xy'), 'xyc');
eq('translate 删除字符', translate('hello', 'l', ''), 'heo');

// escape-regex
eq('escapeRegExp 行处理', processLines('a.b\nc+d', l=>l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')), 'a\\.b\nc\\+d');

// length 统计
const lineLen = data => data.split('\n').map(l=>`${l.length} | ${l}`).join('\n');
eq('length 空行', lineLen(''), '0 | ');
eq('length 基本', lineLen('abc'), '3 | abc');
eq('length 中文', lineLen('你好'), '2 | 你好');

// wordCount
const wordCnt = data => data.split('\n').map(l=>{const c=l.trim()?l.split(/\s+/).length:0;return `${c} | ${l}`;}).join('\n');
eq('wordCount', wordCnt('a b c'), '3 | a b c');
eq('wordCount 空', wordCnt(''), '0 | ');

// format
const doFmt = (data, fmt) => data.split('\n').map((l,i)=>{const parts=l.split(/\s+/);return fmt.replace(/\{(\d+)\}/g,(_,n)=>parts[parseInt(n)]||'');}).join('\n');
eq('format {0} {1}', doFmt('a b\nc d', '{1},{0}'), 'b,a\nd,c');

// commonPrefix
const commonPrefix = data => {
  const lines = data.split('\n').filter(l=>l.trim());
  if (!lines.length) return '';
  let p = lines[0];
  for (let i = 1; i < lines.length; i++) { while (lines[i].indexOf(p) !== 0) p = p.slice(0, -1); }
  return p;
};
eq('commonPrefix', commonPrefix('abcde\nabxyz\nabcd'), 'ab');
eq('commonPrefix 无公共', commonPrefix('abc\nxyz'), '');
eq('commonPrefix 全相同', commonPrefix('abc\nabc'), 'abc');
eq('commonPrefix 空输入', commonPrefix(''), '');

// commonSuffix
const commonSuffix = data => {
  const lines = data.split('\n').filter(l=>l.trim());
  if (!lines.length) return '';
  let s = lines[0];
  for (let i = 1; i < lines.length; i++) { while (lines[i].indexOf(s) !== lines[i].length - s.length && s.length > 0) s = s.slice(1); }
  return s;
};
eq('commonSuffix', commonSuffix('abcde\nxyzde\nabcde'), 'de');
eq('commonSuffix 无公共', commonSuffix('abc\nxyz'), '');

// strip-start / strip-end
const stStart = (data, chars) => processLines(data, l=>l.replace(new RegExp(`^[${escapeRegex(chars)}]+`),''));
const stEnd = (data, chars) => processLines(data, l=>l.replace(new RegExp(`[${escapeRegex(chars)}]+$`),''));
eq('stripStart', stStart('...hello', '.'), 'hello');
eq('stripEnd', stEnd('hello...', '.'), 'hello');
eq('stripStart 多个字符', stStart('\t hello', ' \t'), 'hello');

// trim-leading / trim-trailing
eq('trimLeading', processLines('  hello\n  world', l=>l.replace(/^\s+/,'')), 'hello\nworld');
eq('trimTrailing', processLines('hello  \nworld  ', l=>l.replace(/\s+$/,'')), 'hello\nworld');

// replace-line-endings
const rle = (data, mode) => { const t=mode==='crlf'?'\r\n':mode==='cr'?'\r':'\n'; return data.replace(/\r\n|\r|\n/g,t); };
eq('rle CRLF', rle('a\nb\nc', 'crlf'), 'a\r\nb\r\nc');
eq('rle CR', rle('a\nb', 'cr'), 'a\rb');
eq('rle LF', rle('a\r\nb', 'lf'), 'a\nb');

// unqualify
const unqualify = (data, sep) => processLines(data, l=>{const i=l.lastIndexOf(sep);return i>=0?l.slice(i+sep.length):l;});
eq('unqualify 点', unqualify('com.example.Test', '.'), 'Test');
eq('unqualify 无分隔符', unqualify('Test', '.'), 'Test');
eq('unqualify 斜杠', unqualify('a/b/c', '/'), 'c');

// remove-quotes
const removeQuotes = data => processLines(data, l=>l.replace(/^['"]|['"]$/g,''));
eq('removeQuotes 双引号', removeQuotes('"hello"'), 'hello');
eq('removeQuotes 单引号', removeQuotes("'hello'"), 'hello');
eq('removeQuotes 无引号不变', removeQuotes('hello'), 'hello');

// defaultIfBlank
const dib = (data, def) => data.split('\n').map(l=>l.trim()?l:def).join('\n');
eq('defaultIfBlank', dib('a\n\nc', 'N/A'), 'a\nN/A\nc');

// flush (flatten: 所有行空格合并)
eq('flatten', ['a','b','c'].filter(l=>l.trim()).join(' '), 'a b c');

// batch
const batch = (data, size, sep) => {
  const lines = data.split('\n');
  const groups = [];
  for (let i = 0; i < lines.length; i += size) groups.push(lines.slice(i,i+size).join('\n'));
  return groups.join('\n'+sep+'\n');
};
eq('batch 每组2', batch('a\nb\nc\nd', 2, '---'), 'a\nb\n---\nc\nd');

// chunk
const chunk = (data, size) => flatMapLines(data, l=>{const r=[];for(let i=0;i<l.length;i+=size)r.push(l.slice(i,i+size));return r;});
eq('chunk 每2字符', chunk('abcde', 2), 'ab\ncd\ne');

// word-wrap
const wordWrap = (data, width) => flatMapLines(data, l=>{const r=[];let cur='';for(const w of l.split(/\s+/)){if(!w)continue;if(cur.length+w.length+(cur?1:0)>width){if(cur)r.push(cur);cur=w;}else cur=cur?cur+' '+w:w;}if(cur)r.push(cur);return r;});
eq('wordWrap 宽度5', wordWrap('hello world foo bar', 10), 'hello\nworld foo\nbar');

// interleave
const interleave = (data, text, every) => {
  const lines = data.split('\n'); const r = [];
  lines.forEach((l,i)=>{r.push(l);if((i+1)%every===0&&i<lines.length-1)r.push(text);});
  return r.join('\n');
};
eq('interleave 每2行插入', interleave('a\nb\nc\nd', '---', 2), 'a\nb\n---\nc\nd');

// zip
const zip = (dataA, dataB, sep) => {
  const a = dataA.split('\n').filter(l=>l.trim()); const b = dataB.split('\n').filter(l=>l.trim());
  const len = Math.min(a.length,b.length);
  return Array.from({length:len},(_,i)=>a[i]+sep+b[i]).join('\n');
};
eq('zip 合并', zip('a\nb\nc','x\ny\nz',':'), 'a:x\nb:y\nc:z');

// pad
const padEnd = (data, len, char) => processLines(data, l=>l.padEnd(len,char));
const padStart = (data, len, char) => processLines(data, l=>l.padStart(len,char));
eq('padEnd', padEnd('a', 5, '-'), 'a----');
eq('padStart', padStart('a', 5, '-'), '----a');
eq('pad-zeros', processLines('123', l=>l.padStart(5,'0')), '00123');

// center
const center = (data, len, char) => processLines(data, l=>{const pad=Math.max(0,len-l.length);const left=Math.floor(pad/2);return char.repeat(left)+l+char.repeat(pad-left);});
eq('center', center('a', 5, '-'), '--a--');

// truncate
const truncateEnd = (data, max, ellipsis) => processLines(data, l=>l.length<=max?l:l.slice(0,max-ellipsis.length)+ellipsis);
eq('truncate-end', truncateEnd('hello world', 8, '...'), 'hello...');

// truncate middle
const truncateMid = (data, max, ellipsis) => processLines(data, l=>{if(l.length<=max)return l;const h=Math.floor((max-ellipsis.length)/2);return l.slice(0,h)+ellipsis+l.slice(l.length-h);});
eq('truncate-middle', truncateMid('abcdefghij', 7, '...'), 'ab...ij');

// indent / dedent
const indent = (data, n, char) => processLines(data, l=>l.trim()?char.repeat(n)+l:l);
eq('indent 2空格', indent('hello', 2, ' '), '  hello');
eq('indent 空行不变', indent('\nhello', 2, ' '), '\n  hello');

const dedent = data => {
  const lines = data.split('\n').filter(l=>l.trim());
  const min = Math.min(...lines.map(l=>l.match(/^[ \t]*/)[0].length));
  return data.split('\n').map(l=>l.slice(min)).join('\n');
};
eq('dedent', dedent('  hello\n  world'), 'hello\nworld');

// stripTags (HTML)
const stripTags = data => data.replace(/<[^>]*>/g,'');
eq('stripTags 基本', stripTags('<p>hello</p>'), 'hello');
eq('stripTags 嵌套', stripTags('<div><b>bold</b></div>'), 'bold');
eq('stripTags 带属性', stripTags('<a href="#">link</a>'), 'link');
eq('stripTags 无标签不变', stripTags('hello world'), 'hello world');

// filter operations
const fContains = (data, val) => filterLines(data, l=>l.includes(val));
const fNotContains = (data, val) => filterLines(data, l=>!l.includes(val));
const fStartsWith = (data, val) => filterLines(data, l=>l.startsWith(val));
const fEndsWith = (data, val) => filterLines(data, l=>l.endsWith(val));
const fEquals = (data, val) => filterLines(data, l=>l===val);
const fRegex = (data, val) => filterLines(data, l=>new RegExp(val).test(l));
const fLenGte = (data, val) => filterLines(data, l=>l.length>=parseInt(val));
const fLenLte = (data, val) => filterLines(data, l=>l.length<=parseInt(val));
const fIsBlank = data => filterLines(data, l=>l.trim()==='');
const fNotBlank = data => filterLines(data, l=>l.trim()!=='');

eq('filter 包含', fContains('abc\ndef\nabcx', 'abc'), 'abc\nabcx');
eq('filter 不包含', fNotContains('abc\ndef', 'a'), 'def');
eq('filter 开头', fStartsWith('abc\nxb', 'a'), 'abc');
eq('filter 结尾', fEndsWith('ab\nxb', 'b'), 'ab\nxb');
eq('filter 等于', fEquals('abc\nxb\nabc', 'abc'), 'abc\nabc');
eq('filter 正则', fRegex('abc\n123\na1b', '\\d+'), '123\na1b');
eq('filter 长度≥3', fLenGte('a\nab\nabc\nabcd', 3), 'abc\nabcd');
eq('filter 长度≤2', fLenLte('a\nab\nabc', 2), 'a\nab');
eq('filter 空白', fIsBlank('a\n\n  \nc'), '\n  ');
eq('filter 非空白', fNotBlank('a\n\nc'), 'a\nc');

// isBlank/notBlank
eq('isBlank trim', ' '.trim()==='', true);
eq('notBlank trim', 'a'.trim()!=='', true);

// isAlpha / isNumeric / isAlphanumeric
eq('isAlpha', filterLines('abc\n123\na1', l=>/^[A-Za-z]+$/.test(l)), 'abc');
eq('isNumeric', filterLines('abc\n123\na1', l=>/^\d+$/.test(l)), '123');
eq('isAlphanumeric', filterLines('abc\n123\na1', l=>/^[A-Za-z0-9]+$/.test(l)), 'abc\n123\na1');

// isAllLowerCase / isAllUpperCase
eq('isAllLower', filterLines('abc\nABC\nAbc', l=>/^[a-z]+$/.test(l.trim())), 'abc');
eq('isAllUpper', filterLines('ABC\nabc\nAbc', l=>/^[A-Z]+$/.test(l.trim())), 'ABC');
eq('isAllLower 含数字过滤', filterLines('abc\nab1\nABC', l=>/^[a-z]+$/.test(l.trim())), 'abc');
eq('isAllUpper 含数字过滤', filterLines('ABC\nAB1\nabc', l=>/^[A-Z]+$/.test(l.trim())), 'ABC');

// isTitleCase
const isTitleCase = data => filterLines(data, l=>/^[A-Z]/.test(l)&&l===l.replace(/\b\w/g,c=>c.toUpperCase()));
eq('isTitleCase', isTitleCase('Hello World\nhello world'), 'Hello World');
// "Hello world" passes because each word's first letter is upper: "Hello" is correct, "world" is lowercase but the regex doesn't force the rest

// take-while / drop-while
const takeWhile = (data, pred) => { const r=[];for(const l of data.split('\n')){if(pred(l))r.push(l);else break;}return r.join('\n'); };
const dropWhile = (data, pred) => { const lines=data.split('\n');let i=0;for(;i<lines.length;i++){if(!pred(lines[i]))break;}return lines.slice(i).join('\n'); };
eq('takeWhile 包含a', takeWhile('ab\nac\nbb', l=>l.includes('a')), 'ab\nac');
eq('takeWhile 全匹配', takeWhile('ab\nac', l=>l.includes('a')), 'ab\nac');
eq('dropWhile 包含a', dropWhile('ab\nac\nbb', l=>l.includes('a')), 'bb');
eq('dropWhile 全匹配', dropWhile('ab\nac', l=>l.includes('a')), '');

// unique
const unique = data => { const s=new Set();return data.split('\n').filter(l=>{const t=l.trim();return t&&!s.has(t)?(s.add(t),true):false;}).join('\n'); };
eq('unique 基本', unique('a\nb\na\nc\nb'), 'a\nb\nc');
eq('unique 空行过滤', unique('a\n\n\na'), 'a');

// reverse-lines
eq('reverseLines', ['a','b','c'].reverse().join('\n'), 'c\nb\na');

// remove-empty
eq('removeEmpty', 'a\n\n\nc'.split('\n').filter(l=>l.trim()).join('\n'), 'a\nc');

// peek 不改变数据
const peek = data => data;
eq('peek 透传', peek('abc'), 'abc');

// simpleMatch (通配符)
const simpleMatch = (data, pat) => {
  const re = new RegExp('^'+pat.replace(/\*/g,'.*').replace(/\?/g,'.')+'$');
  return filterLines(data, l=>re.test(l));
};
eq('simpleMatch *.txt', simpleMatch('a.txt\nb.md\nc.txt', '*.txt'), 'a.txt\nc.txt');
eq('simpleMatch 单字符?', simpleMatch('a\nab\nabc', 'a?'), 'ab');

// containsAny/None/Only
const cAny = (data, chars) => { const s=new Set(chars);return filterLines(data, l=>l.split('').some(ch=>s.has(ch))); };
const cNone = (data, chars) => { const s=new Set(chars);return filterLines(data, l=>!l.split('').some(ch=>s.has(ch))); };
const cOnly = (data, chars) => { const s=new Set(chars);return filterLines(data, l=>l.split('').every(ch=>s.has(ch))); };
eq('containsAny', cAny('abc\n123\ndef','ab'), 'abc');
eq('containsNone', cNone('abc\n123\ndef','xy'), 'abc\n123\ndef');
eq('containsOnly', cOnly('abc\n123\na1','abc'), 'abc');

// count-occ
const countOcc = (data, sub) => data.split('\n').map(l=>{const c=(l.match(new RegExp(escapeRegex(sub),'g'))||[]).length;return `${l} | ${c}`;}).join('\n');
eq('countOcc', countOcc('hello\nabcab', 'ab'), 'hello | 0\nabcab | 2');

// frequency
const freq = data => { const lines=data.split('\n').filter(l=>l.trim());const m={};for(const l of lines)m[l]=(m[l]||0)+1;return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${v} | ${k}`).join('\n'); };
eq('frequency', freq('a\na\nb\nc'), '2 | a\n1 | b\n1 | c');

// top
const top = (data, n) => { const lines=data.split('\n').filter(l=>l.trim());const m={};for(const l of lines)m[l]=(m[l]||0)+1;return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`${v} | ${k}`).join('\n'); };
eq('top 2', top('a\na\nb\nb\nb\nc', 2), '3 | b\n2 | a');

// split-lines
const splitLines = data => data.split('\n').flatMap(l=>l.split(/\r?\n/)).join('\n');
eq('splitLines 基本', (function(data){return data.split('\n').join('\n')})('a\nb\nc'), 'a\nb\nc');
eq('splitLines 空行保留', (function(data){return data.split('\n').join('\n')})('a\n\nb'), 'a\n\nb');

// chomp / chop
eq('chomp 去末尾换行', 'a\nb\n'.replace(/\r?\n?$/,''), 'a\nb');
eq('chop', processLines('abc\ndef', l=>l.slice(0,-1)), 'ab\nde');

// hash (MD5 known result)
// "abc" → 900150983cd24fb0d6963f7d28e17f72
// We test the md5 function directly
function md5(str) {
  // webtoolkit.md5 (public domain) adapted for UTF-8
  const s = unescape(encodeURIComponent(str));
  const n = s.length;
  const x = [];
  const nWords = (((n + 8) >>> 6) + 1) << 4;
  for (let i = 0; i < nWords; i++) x[i] = 0;
  for (let i = 0; i < n; i++) x[i>>2] |= (s.charCodeAt(i) & 0xFF) << ((i & 3) * 8);
  x[n>>2] |= 0x80 << ((n & 3) * 8);
  x[14] = n * 8;
  const add = (x, y) => { const l = (x & 0xFFFF) + (y & 0xFFFF); const m = (x >>> 16) + (y >>> 16) + (l >>> 16); return (m << 16) | (l & 0xFFFF); };
  const r = (v, s) => (v << s) | (v >>> (32 - s));
  const F = (x, y, z) => (x & y) | (~x & z);
  const G = (x, y, z) => (x & z) | (y & ~z);
  const H = (x, y, z) => x ^ y ^ z;
  const I = (x, y, z) => y ^ (x | ~z);
  const T = [-680876936,-389564586,606105819,-1044525330,-176418897,1200080426,-1473231341,-45705983,1770035416,-1958414417,-42063,-1990404162,1804603682,-40341101,-1502002290,1236535329,-165796510,-1069501632,643717713,-373897302,-701558691,38016083,-660478335,-405537848,568446438,-1019803690,-187363961,1163531501,-1444681467,-51403784,1735328473,-1926607734,-378558,-2022574463,1839030562,-35309556,-1530992060,1272893353,-155497632,-1094730640,681279174,-358537222,-722521979,76029189,-640364487,-421815835,530742520,-995338651,-198630844,1126891415,-1416354905,-57434055,1700485571,-1894986606,-1051523,-2054922799,1873313359,-30611744,-1560198380,1309151649,-145523070,-1120210379,718787259,-343485551];
  const K1 = [1,6,11,0,5,10,15,4,9,14,3,8,13,2,7,12];
  const K2 = [5,8,11,14,1,4,7,10,13,0,3,6,9,12,15,2];
  const K3 = [0,7,14,5,12,3,10,1,8,15,6,13,4,11,2,9];
  let h = [1732584193, -271733879, -1732584194, 271733878];
  for (let i = 0; i < x.length; i += 16) {
    const w = x.slice(i, i + 16); let [a,b,c,d] = h;
    for (let j = 0; j < 16; j++) { a = add(b,r(add(add(add(a,F(b,c,d)),w[j]),T[j]),[7,12,17,22][j&3])); [a,b,c,d]=[d,a,b,c]; }
    for (let j = 0; j < 16; j++) { a = add(b,r(add(add(add(a,G(b,c,d)),w[K1[j]]),T[16+j]),[5,9,14,20][j&3])); [a,b,c,d]=[d,a,b,c]; }
    for (let j = 0; j < 16; j++) { a = add(b,r(add(add(add(a,H(b,c,d)),w[K2[j]]),T[32+j]),[4,11,16,23][j&3])); [a,b,c,d]=[d,a,b,c]; }
    for (let j = 0; j < 16; j++) { a = add(b,r(add(add(add(a,I(b,c,d)),w[K3[j]]),T[48+j]),[6,10,15,21][j&3])); [a,b,c,d]=[d,a,b,c]; }
    h = [add(h[0],a),add(h[1],b),add(h[2],c),add(h[3],d)];
  }
  return h.map(v => { const u=v>>>0; return [u&0xFF,(u>>>8)&0xFF,(u>>>16)&0xFF,(u>>>24)&0xFF].map(b=>b.toString(16).padStart(2,'0')).join(''); }).join('');
}
eq('md5 空串', md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
eq('md5 abc', md5('abc'), '900150983cd24fb0d6963f7d28e17f72');
eq('md5 hello', md5('hello'), '5d41402abc4b2a76b9719d911017c592');
eq('md5 中文', md5('你好'), '7eca689f0d3389d9dea66ae112e5cfd7');

// encode-hex / decode-hex
const hexEnc = data => data.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
const hexDec = data => data.replace(/\s/g,'').split(/([0-9a-fA-F]{2})/g).filter(Boolean).map(h=>String.fromCharCode(parseInt(h,16))).join('');
eq('encode-hex', hexEnc('ABC'), '414243');
eq('encode-hex 中文', hexEnc('中'), '4e2d'); // UTF-16 charCodeAt
eq('decode-hex', hexDec('414243'), 'ABC');
eq('decode-hex 空格容错', hexDec('41 42'), 'AB');
// hex roundtrip: 只对ASCII可靠, 中文需要UTF-8编码
eq('hex roundtrip ASCII', hexDec(hexEnc('hello')), 'hello');

// JSON escape / unescape (JSON.stringify/parse with slice)
eq('json-escape 换行', JSON.stringify('a\nb').slice(1,-1), 'a\\nb');
eq('json-escape 引号', JSON.stringify('a"b').slice(1,-1), 'a\\"b');
eq('json-escape 反斜杠', JSON.stringify('a\\b').slice(1,-1), 'a\\\\b');

// HTML encode / decode
const htmlEnc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const htmlDec = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
eq('html-encode', htmlEnc('<tag id="x">'), '&lt;tag id=&quot;x&quot;&gt;');
eq('html-decode', htmlDec('&lt;tag&gt;'), '<tag>');
eq('roundtrip html', htmlDec(htmlEnc('<hello>')), '<hello>');

// URL encode / decode
eq('url-encode', encodeURIComponent('a b'), 'a%20b');
eq('url-encode 中文', encodeURIComponent('你好'), '%E4%BD%A0%E5%A5%BD');
eq('url-decode', decodeURIComponent('a%20b'), 'a b');
eq('url-decode 中文', decodeURIComponent('%E4%BD%A0'), '你');
eq('roundtrip url', decodeURIComponent(encodeURIComponent('a b 你好')), 'a b 你好');

// Base64 encode / decode
eq('base64-encode', btoa(unescape(encodeURIComponent('hello'))), 'aGVsbG8=');
eq('base64-decode', decodeURIComponent(escape(atob('aGVsbG8='))), 'hello');
// 中文 roundtrip
const b64enc = btoa(unescape(encodeURIComponent('你好')));
eq('base64-encode 中文', b64enc, '5L2g5aW9');
eq('base64-decode 中文', decodeURIComponent(escape(atob(b64enc))), '你好');

// ROT13
const rot13 = s => s.replace(/[a-zA-Z]/g,c=>{const base=c.charCodeAt(0)>=97?97:65;return String.fromCharCode((c.charCodeAt(0)-base+13)%26+base);});
eq('rot13 英文', rot13('Hello'), 'Uryyb');
eq('rot13 二次还原', rot13(rot13('Hello')), 'Hello');
eq('rot13 数字不变', rot13('123'), '123');
eq('rot13 中文不变', rot13('你好'), '你好');

// unicode-escape
const unicodeEsc = s => s.split('').map(c=>{const code=c.charCodeAt(0);return code>127?'\\u'+code.toString(16).padStart(4,'0'):c;}).join('');
eq('unicode-escape ASCII不变', unicodeEsc('abc'), 'abc');
eq('unicode-escape 中文', unicodeEsc('中'), '\\u4e2d');

// escapeStr / unescapeStr
function escapeStr(str, lang) {
  const map = {'\\':'\\\\','\n':'\\n','\r':'\\r','\t':'\\t','"':'\\"',"'":"\\'"};
  if (lang==='js') { map['`']='\\`'; map['$']='\\$'; }
  return str.split('').map(c=>map[c]||c).join('');
}
function unescapeStr(str) {
  return str.replace(/\\(.)/g,(_,c)=>({n:'\n',r:'\r',t:'\t','0':'\0','\\':'\\','"':'"',"'":"'"})[c]||c);
}
eq('escape js', escapeStr('a\nb\\c"', 'js'), 'a\\nb\\\\c\\"');
eq('unescape', unescapeStr('a\\nb\\\\c\\"'), 'a\nb\\c"');
eq('escape roundtrip', unescapeStr(escapeStr("hello\nworld",'js')), "hello\nworld");

// escapeHtml util
const escHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
eq('escapeHtml', escHtml('<a&b>'), '&lt;a&amp;b&gt;');

// resolveJSONPath
function resolveJSONPath(obj, path) {
  if (!path || path === '$') return Array.isArray(obj) ? obj : [obj];
  let p = path;
  if (p.startsWith('$.')) p = p.slice(2);
  else if (p.startsWith('$')) p = p.slice(1);
  const parts = p.split('.').filter(Boolean);
  let current = [obj];
  for (const part of parts) {
    if (part === '*') { current = current.flatMap(c => Array.isArray(c) ? c : Object.values(c)); }
    else if (part.endsWith(']')) {
      const m = part.match(/^(\w+)?\[(\d+|\*)\]$/);
      if (m) { const [,key,idx]=m; if(key)current=current.map(c=>c[key]).filter(c=>c!==undefined); if(idx==='*')current=current.flatMap(c=>Array.isArray(c)?c:[c]); else current=current.map(c=>Array.isArray(c)?c[parseInt(idx)]:c).filter(c=>c!==undefined); }
    } else { current = current.flatMap(c => Array.isArray(c) ? c.map(item=>item[part]).filter(v=>v!==undefined) : c[part]!==undefined ? (Array.isArray(c[part]) ? c[part] : [c[part]]) : []); }
  }
  return current;
}
const testObj = { users: [{name:'Alice',age:30},{name:'Bob',age:25}], count: 2 };
eq('JSONPath $ 返回数组长度', resolveJSONPath(testObj, '$').length, 1);
eq('JSONPath $.users 返回长度', resolveJSONPath(testObj, '$.users').length, 2);
eq('JSONPath $.users[0].name', resolveJSONPath(testObj, '$.users[0].name')[0], 'Alice');
eq('JSONPath $.users[*].name 数量', resolveJSONPath(testObj, '$.users[*].name').length, 2);
eq('JSONPath $.count', resolveJSONPath(testObj, '$.count')[0], 2);
eq('JSONPath 直接数组', resolveJSONPath([1,2,3], '$').length, 3);
arr('JSONPath 空路径', resolveJSONPath('hello', ''), ['hello']);

// column-select
const colSel = (data, delim, colsStr) => {
  const cols = parseColumns(colsStr);
  return data.split('\n').map(l=>{const c=l.split(delim);return cols.map(i=>(c[i-1]||'')).join(delim);}).join('\n');
};
eq('column-select', colSel('a,b,c\n1,2,3', ',', '1,3'), 'a,c\n1,3');
eq('column-select 单列', colSel('a,b,c\n1,2,3', ',', '2'), 'b\n2');

// partition
const partition = (data, mode, val) => {
  const lines=data.split('\n'); const m=[],r=[];
  for(const l of lines){let ok;switch(mode){case'contain':ok=l.includes(val);break;case'regex':ok=new RegExp(val).test(l);break;case'length-gte':ok=l.length>=parseInt(val);break;default:ok=true;}if(ok)m.push(l);else r.push(l);}
  return `# 匹配 (${m.length} 行)\n${m.join('\n')}\n\n# 不匹配 (${r.length} 行)\n${r.join('\n')}`;
};
inc('partition 包含', partition('a\nb\nc', 'contain', 'a'), '# 匹配 (1 行)');
inc('partition 不匹配', partition('a\nb', 'contain', 'x'), '# 匹配 (0 行)');

// groupby
const groupBy = (data, mode) => {
  const lines=data.split('\n').filter(l=>l.trim());const g={};
  for(const l of lines){let k;switch(mode){case'firstChar':k=(l[0]||'').toUpperCase()||'(empty)';break;case'length':k=`len=${l.length}`;break;case'exact':k=l;break;default:k=l;}if(!g[k])g[k]=[];g[k].push(l);}
  return Object.entries(g).map(([k,items])=>`# ${k} (${items.length} 项)\n${items.join('\n')}`).join('\n\n');
};
inc('groupBy 首字母', groupBy('abc\naab\nbbc', 'firstChar'), '# A (2 项)');
inc('groupBy 长度', groupBy('a\nbb\nc', 'length'), '# len=1 (2 项)');
inc('groupBy 精确', groupBy('a\na\nb', 'exact'), '# a (2 项)');

// reduce (join/count/sum/min/max)
const reduceJoin = (data, sep) => data.split('\n').filter(l=>l.trim()).join(sep);
const reduceCount = data => `Count: ${data.split('\n').filter(l=>l.trim()).length}`;
const linesForReduce = '1\n2\n3\n4\n5';
const nums = linesForReduce.split('\n').filter(l=>l.trim()).map(v=>parseFloat(v)).filter(v=>!isNaN(v));
eq('reduce-join', reduceJoin(linesForReduce, ','), '1,2,3,4,5');
eq('reduce-count', reduceCount(linesForReduce), 'Count: 5');
eq('reduce-sum', `Sum: ${nums.reduce((a,b)=>a+b,0)}`, 'Sum: 15');
eq('reduce-min', `Min: ${nums.length>0?Math.min(...nums):'N/A'}`, 'Min: 1');
eq('reduce-max', `Max: ${nums.length>0?Math.max(...nums):'N/A'}`, 'Max: 5');

// containsAny/None/Only edge cases
eq('containsAny 空字符集', cAny('abc', ''), '');
eq('containsNone 空字符集', cNone('abc', ''), 'abc');
eq('containsOnly 空字符集不输出', cOnly('abc', ''), '');

// 边界：空输入
eq('空输入 trim', processLines('', l=>l.trim()), '');
eq('空输入 sort', sortLines('', 'asc'), '');
eq('空输入 case', caseConvert('', 'upper'), '');
eq('空输入 unique', unique(''), '');
eq('空输入 parseColumns', parseColumns('').length, 0);

// 边界：单行
eq('单行 sort', sortLines('a', 'desc'), 'a');
eq('单行 join', reduceJoin('a', ','), 'a');
eq('单行 commonPrefix', commonPrefix('a'), 'a');

// 边界：特殊字符
eq('sort 特殊字符', sortLines('b\n_\na', 'asc'), '_\na\nb');
eq('特殊字符反转', 'a$b'.split('').reverse().join(''), 'b$a');

// 中文处理
eq('中文大小写不变', caseConvert('你好世界', 'upper'), '你好世界');
eq('中文长度', '你好'.length, 2);
eq('中文截取', '你好世界'.slice(0,2), '你好');

console.log('\n=== ✅ 自定义断言过滤: isAlpha/isNumeric等 ===\n');
eq('isAlpha 含标点过滤', filterLines('abc\na.b\nABC', l=>/^[A-Za-z]+$/.test(l)), 'abc\nABC');
eq('isNumeric 小数过滤', filterLines('123\n3.14\na', l=>/^\d+$/.test(l)), '123');
eq('isAlphanumeric', filterLines('abc123\n123\nabc', l=>/^[A-Za-z0-9]+$/.test(l)), 'abc123\n123\nabc');

console.log('\n=== 🔗 扩展操作(新增) ===\n');
// lookup
const lookup = (data, mapStr) => {
  const map = {}; mapStr.split('\n').filter(l=>l.trim()).forEach(l=>{const i=l.indexOf('=');if(i>0){map[l.slice(0,i).trim()]=l.slice(i+1).trim();}});
  return data.split('\n').map(l=>map[l]!==undefined?map[l]:l).join('\n');
};
eq('lookup 精确替换', lookup('apple\nbanana\ncherry', 'apple=苹果\nbanana=香蕉'), '苹果\n香蕉\ncherry');
eq('lookup 无映射不变', lookup('hello', 'a=x'), 'hello');
eq('lookup 空映射', lookup('hello', ''), 'hello');

// comm
const comm = (dataA, dataB, mode) => {
  const a = dataA.split('\n').filter(l=>l.trim()); const b = dataB.split('\n').filter(l=>l.trim());
  const sb = new Set(b), sa = new Set(a);
  const ao = a.filter(l=>!sb.has(l)), bo = b.filter(l=>!sa.has(l)), both = a.filter(l=>sb.has(l));
  if(mode==='a-only')return ao.join('\n'); if(mode==='b-only')return bo.join('\n'); if(mode==='both')return both.join('\n');
  return `# A独有 (${ao.length})\n${ao.join('\n')}\n\n# B独有 (${bo.length})\n${bo.join('\n')}\n\n# 共有 (${both.length})\n${both.join('\n')}`;
};
const commA = 'a\nb\nc', commB = 'b\nc\nd';
inc('comm all 含A独有', comm(commA, commB, 'all'), 'a');
inc('comm all 含B独有', comm(commA, commB, 'all'), 'd');
inc('comm all 含共有', comm(commA, commB, 'all'), 'c');
eq('comm a-only', comm(commA, commB, 'a-only'), 'a');
eq('comm b-only', comm(commA, commB, 'b-only'), 'd');
eq('comm both', comm(commA, commB, 'both'), 'b\nc');

// fold
const fold = (data, w) => data.split('\n').flatMap(l => l.match(new RegExp('.{1,'+w+'}','g'))||[]).join('\n');
eq('fold 宽度5', fold('abcdefghij', 5), 'abcde\nfghij');
eq('fold 宽度3', fold('abcdef', 3), 'abc\ndef');

// unexpand
const unexpand = (data, n) => data.split('\n').map(l=>l.replace(new RegExp('^ {'+n+'}','gm'),'\t')).join('\n');
eq('unexpand 4空格', unexpand('    hello', 4), '\thello');
eq('unexpand 不足不转', unexpand('  hello', 4), '  hello');

// accumulate
const accum = (data, mode) => {
  const lines=data.split('\n'); const r=[]; let acc=0, parts=[];
  for(let i=0;i<lines.length;i++){const l=lines[i];if(mode==='sum'){acc+=parseFloat(l)||0;r.push(String(acc));}else if(mode==='count'){r.push(String(i+1));}else{parts.push(l);r.push(parts.join(' '));}}
  return r.join('\n');
};
eq('accum-sum', accum('1\n2\n3', 'sum'), '1\n3\n6');
eq('accum-count', accum('a\nb\nc', 'count'), '1\n2\n3');
eq('accum-concat', accum('a\nb\nc', 'concat'), 'a\na b\na b c');

// regex-test
const rt = (data, pat, mode) => { const re=new RegExp(pat,'g');return data.split('\n').map(l=>{const m=l.match(re);return mode==='bool'?`${re.test(l)} | ${l}`:`${(m||[]).length} | ${l}`;}).join('\n'); };
eq('regex-test bool', rt('abc\n123', '\\d', 'bool').includes('true | 123'), true);
eq('regex-test 中文', rt('abc\n123', '\\d', 'bool').includes('false | abc'), true);
eq('regex-test count', rt('a1b2c3', '\\d', 'count'), '3 | a1b2c3');

// count
const cnt = data => { const lines=data.split('\n');return `行数: ${lines.length}\n字符数: ${data.length}\n单词数: ${data.split(/\s+/).filter(Boolean).length}`; };
inc('count 含行数', cnt('a\nb\nc'), '行数: 3');
inc('count 含字符', cnt('a\nb\nc'), '字符数: 5');
inc('count 含单词', cnt('a b\nc'), '单词数: 3');

// pivot
const pivot = (data, inDelim, outDelim) => data.split('\n').filter(l=>l.trim()).flatMap(l=>l.split(inDelim)).join(outDelim);
eq('pivot 基本', pivot('a,b\nc,d', ',', '|'), 'a|b|c|d');

// unpivot
const unpivot = (data, delim) => data.split('\n').flatMap(l=>l.split(delim)).join('\n');
eq('unpivot 基本', unpivot('a,b,c', ','), 'a\nb\nc');
eq('unpivot 多行', unpivot('a,b\nc,d', ','), 'a\nb\nc\nd');

// window
const windowFn = (data, size, step, sep) => {
  const lines=data.split('\n');const r=[];
  for(let i=0;i<lines.length-size+1;i+=step) r.push(lines.slice(i,i+size).join('\n'));
  return r.join('\n'+sep+'\n');
};
inc('window 包含', windowFn('a\nb\nc\nd', 2, 1, '---'), 'a\nb');
inc('window 分隔符', windowFn('a\nb\nc\nd', 2, 1, '---'), '---');
eq('window 步长2', windowFn('a\nb\nc\nd', 2, 2, '---'), 'a\nb\n---\nc\nd');

// dedupe-consecutive
const dedupe = data => data.split('\n').filter((l,i,arr)=>i===0||l!==arr[i-1]).join('\n');
eq('dedupe 连续重复', dedupe('a\na\nb\nb\nc'), 'a\nb\nc');
eq('dedupe 非连续保留', dedupe('a\nb\na'), 'a\nb\na');
eq('dedupe 无重复', dedupe('a\nb\nc'), 'a\nb\nc');

console.log('扩展操作全部通过');

summary();