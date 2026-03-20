// escapeHtml函数测试
const fs = require('fs');
const path = require('path');

// 读取script.js文件内容
const scriptPath = path.join(__dirname, '../../script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// 提取escapeHtml函数
const escapeHtmlMatch = scriptContent.match(/function escapeHtml\(str\) \{[\s\S]*?\n\}/);
if (!escapeHtmlMatch) {
  throw new Error('无法找到escapeHtml函数');
}

// 使用eval创建函数（注意：在生产环境中应更安全地处理）
eval(escapeHtmlMatch[0]);

describe('escapeHtml函数', () => {
  test('转义HTML特殊字符', () => {
    const input = '<script>alert("xss")</script>';
    const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
    expect(escapeHtml(input)).toBe(expected);
  });

  test('转义尖括号', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    expect(escapeHtml('</div>')).toBe('&lt;/div&gt;');
  });

  test('转义引号', () => {
    expect(escapeHtml('"test"')).toBe('&quot;test&quot;');
    expect(escapeHtml("'test'")).toBe('&#039;test&#039;');
  });

  test('转义&符号', () => {
    expect(escapeHtml('AT&T')).toBe('AT&amp;T');
  });

  test('非字符串输入返回原值', () => {
    expect(escapeHtml(123)).toBe(123);
    expect(escapeHtml(null)).toBe(null);
    expect(escapeHtml(undefined)).toBe(undefined);
  });

  test('空字符串返回空字符串', () => {
    expect(escapeHtml('')).toBe('');
  });
});