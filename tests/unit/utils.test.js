// 工具函数测试
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

// 提取generateStarRating函数
const generateStarRatingMatch = scriptContent.match(/function generateStarRating\(rating\) \{[\s\S]*?\n\}/);
if (!generateStarRatingMatch) {
  throw new Error('无法找到generateStarRating函数');
}

// 使用eval创建函数
eval(escapeHtmlMatch[0]);
eval(generateStarRatingMatch[0]);

describe('generateStarRating函数', () => {
  test('生成5星评分', () => {
    expect(generateStarRating(5)).toContain('fa-star');
    // 应该有5个满星
    const result = generateStarRating(5);
    const fullStarCount = (result.match(/class="fas fa-star"/g) || []).length;
    const halfStarCount = (result.match(/class="fas fa-star-half-alt"/g) || []).length;
    const emptyStarCount = (result.match(/class="far fa-star"/g) || []).length;

    expect(fullStarCount).toBe(5);
    expect(halfStarCount).toBe(0);
    expect(emptyStarCount).toBe(0);
  });

  test('生成4.5星评分', () => {
    const result = generateStarRating(4.5);
    const fullStarCount = (result.match(/class="fas fa-star"/g) || []).length;
    const halfStarCount = (result.match(/class="fas fa-star-half-alt"/g) || []).length;
    const emptyStarCount = (result.match(/class="far fa-star"/g) || []).length;

    expect(fullStarCount).toBe(4); // 4个满星
    expect(halfStarCount).toBe(1); // 1个半星
    expect(emptyStarCount).toBe(0); // 0个空星
  });

  test('生成3.7星评分（应该四舍五入到半星）', () => {
    const result = generateStarRating(3.7);
    // 3.7应该显示3.5星（3个满星，1个半星，1个空星）
    const fullStarCount = (result.match(/class="fas fa-star"/g) || []).length;
    const halfStarCount = (result.match(/class="fas fa-star-half-alt"/g) || []).length;
    const emptyStarCount = (result.match(/class="far fa-star"/g) || []).length;

    expect(fullStarCount).toBe(3);
    expect(halfStarCount).toBe(1);
    expect(emptyStarCount).toBe(1);
  });

  test('生成0星评分', () => {
    const result = generateStarRating(0);
    const fullStarCount = (result.match(/class="fas fa-star"/g) || []).length;
    const halfStarCount = (result.match(/class="fas fa-star-half-alt"/g) || []).length;
    const emptyStarCount = (result.match(/class="far fa-star"/g) || []).length;

    expect(fullStarCount).toBe(0);
    expect(halfStarCount).toBe(0);
    expect(emptyStarCount).toBe(5);
  });

  test('边界条件测试', () => {
    expect(() => generateStarRating(-1)).not.toThrow();
    expect(() => generateStarRating(6)).not.toThrow();
  });
});