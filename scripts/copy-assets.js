const fs = require('fs');
const path = require('path');

console.log('Copying assets to dist directory...');

// 源文件和目标路径
const assets = [
  {
    src: 'script.js',
    dest: 'dist/script.js'
  },
  {
    src: 'data/api-config.js',
    dest: 'dist/data/api-config.js'
  }
];

// 确保目标目录存在
const destDirs = new Set(assets.map(asset => path.dirname(asset.dest)));
destDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// 复制文件
let copiedCount = 0;
assets.forEach(asset => {
  const srcPath = path.resolve(asset.src);
  const destPath = path.resolve(asset.dest);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${asset.src} -> ${asset.dest}`);
    copiedCount++;
  } else {
    console.error(`Source file not found: ${srcPath}`);
    process.exit(1);
  }
});

console.log(`Successfully copied ${copiedCount} asset(s).`);