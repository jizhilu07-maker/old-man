const fs = require('fs');
const path = require('path');

console.log('设置环境变量到构建输出...');

// 要处理的文件
const htmlFile = path.resolve('dist/index.html');

// 环境变量（从process.env读取）
const amapApiKey = process.env.AMAP_API_KEY || process.env.VITE_AMAP_API_KEY;

if (!amapApiKey) {
    console.log('未设置AMAP_API_KEY环境变量，使用默认值');
    console.log('提示：在Vercel项目中设置AMAP_API_KEY环境变量以使用您自己的高德地图API密钥');

    // 在CI/CD环境（如Vercel）中，如果没有API密钥则抛出错误
    if (process.env.CI === 'true' || process.env.VERCEL === '1') {
        console.error('❌ 错误：在CI/CD环境中未设置AMAP_API_KEY环境变量');
        console.error('请在Vercel项目设置中添加AMAP_API_KEY环境变量');
        process.exit(1);
    }

    return;
}

console.log(`使用环境变量中的高德地图API密钥: ${amapApiKey.substring(0, 10)}...`);

// 读取HTML文件
let htmlContent = fs.readFileSync(htmlFile, 'utf8');

// 替换window.ENV.AMAP_API_KEY的值
const defaultKey = '438511649cf264b6bdf538592e4bbe0e';
const regex = new RegExp(`window\\.ENV\\.AMAP_API_KEY\\s*=\\s*["']${defaultKey}["']`, 'g');

if (regex.test(htmlContent)) {
    htmlContent = htmlContent.replace(
        `window.ENV.AMAP_API_KEY = window.ENV.AMAP_API_KEY || '${defaultKey}'`,
        `window.ENV.AMAP_API_KEY = '${amapApiKey}'`
    );
    console.log('已更新HTML中的高德地图API密钥');
} else {
    // 如果没有找到默认值，尝试其他模式
    const altRegex = /window\.ENV\.AMAP_API_KEY\s*=\s*window\.ENV\.AMAP_API_KEY\s*\|\|\s*['"][^'"]+['"]/g;
    if (altRegex.test(htmlContent)) {
        htmlContent = htmlContent.replace(
            /window\.ENV\.AMAP_API_KEY\s*=\s*window\.ENV\.AMAP_API_KEY\s*\|\|\s*['"][^'"]+['"]/,
            `window.ENV.AMAP_API_KEY = '${amapApiKey}'`
        );
        console.log('已更新HTML中的高德地图API密钥（备用模式）');
    } else {
        console.log('警告：未找到window.ENV.AMAP_API_KEY的默认值配置');
    }
}

// 写回文件
fs.writeFileSync(htmlFile, htmlContent, 'utf8');
console.log('环境变量设置完成');