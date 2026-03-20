const fs = require('fs');
const path = require('path');

// 读取script.js文件内容
const scriptPath = path.join(__dirname, 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// 提取generateStarRating函数
const generateStarRatingMatch = scriptContent.match(/function generateStarRating\(rating\) \{[\s\S]*?\n\}/);
if (!generateStarRatingMatch) {
  throw new Error('无法找到generateStarRating函数');
}

// 使用eval创建函数
eval(generateStarRatingMatch[0]);

console.log('测试4.5星:');
const result45 = generateStarRating(4.5);
console.log('结果:', result45);
console.log('包含fas fa-star:', (result45.match(/fas fa-star/g) || []).length);
console.log('包含fa-star-half-alt:', (result45.match(/fa-star-half-alt/g) || []).length);
console.log('包含far fa-star:', (result45.match(/far fa-star/g) || []).length);

console.log('\n测试3.7星:');
const result37 = generateStarRating(3.7);
console.log('结果:', result37);
console.log('包含fas fa-star:', (result37.match(/fas fa-star/g) || []).length);
console.log('包含fa-star-half-alt:', (result37.match(/fa-star-half-alt/g) || []).length);
console.log('包含far fa-star:', (result37.match(/far fa-star/g) || []).length);

console.log('\n函数定义:');
console.log(generateStarRatingMatch[0]);