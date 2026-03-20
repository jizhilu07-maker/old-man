# 浙江省养老院目录网站

一个简洁现代的养老院信息查询网站，专注于浙江省范围内的养老机构展示。

## 项目概述

这是一个纯前端静态网站，使用HTML、CSS和JavaScript开发，通过高德地图集成显示养老院位置，提供搜索和详情查看功能。

### 主要功能
- 🏠 **养老院列表展示** - 展示浙江省各城市的养老院基本信息
- 🔍 **实时搜索** - 按名称、地址、服务等关键词搜索
- 🗺️ **高德地图集成** - 显示养老院地理位置
- 📱 **详情查看** - 点击卡片查看养老院完整信息
- 🎨 **温馨暖色主题** - 橙色、黄色为主的温馨设计风格
- ⚡ **快速响应** - 优化的加载性能和用户体验

### 技术栈
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **地图**: 高德地图JavaScript API
- **图标**: Font Awesome 6
- **字体**: Google Fonts (Noto Sans SC)
- **部署**: GitHub Pages

## 项目结构

```
elderly-directory/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 主JavaScript逻辑
├── data/
│   └── api-config.js   # API配置和模拟数据
├── assets/
│   ├── images/         # 图片资源目录
│   └── icons/          # 图标目录
└── README.md           # 项目说明
```

## 快速开始

### 1. 本地运行
1. 克隆或下载本项目
2. 直接使用浏览器打开 `index.html` 文件
3. 或者使用本地服务器（如Python的http.server）：
   ```bash
   python -m http.server 8000
   ```
   然后在浏览器中访问 `http://localhost:8000`

### 2. 开发说明
- 所有数据目前使用模拟数据（`data/api-config.js`）
- 如需连接真实API，修改 `API_CONFIG.USE_MOCK_DATA = false`
- 高德地图API密钥需要替换为真实密钥

### 3. 部署到GitHub Pages
1. 将项目推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择main分支的根目录或/docs文件夹
4. 访问 `https://[你的用户名].github.io/[仓库名]`

## 数据说明

### 模拟数据
项目包含8个浙江省养老院的模拟数据，涵盖：
- 杭州市、宁波市、温州市、绍兴市、金华市、嘉兴市、湖州市、台州市
- 每个养老院包含：名称、地址、电话、价格、服务项目、设施等完整信息
- 模拟坐标对应各城市中心位置

### 数据字段
```javascript
{
  id: 1,
  name: "养老院名称",
  address: "详细地址",
  phone: "联系电话",
  description: "详细描述",
  priceRange: "价格范围",
  services: ["服务项目1", "服务项目2"],
  coordinates: [经度, 纬度],
  rating: 4.5,
  capacity: 100,
  establishedYear: 2010,
  features: ["设施1", "设施2"]
}
```

## 功能特性

### 1. 搜索功能
- 实时搜索（防抖500ms）
- 支持名称、地址、描述、服务项目搜索
- 空搜索显示所有结果
- 搜索结果计数显示

### 2. 详情查看
- 点击卡片或"查看详情"按钮
- 模态框显示完整信息
- 高德地图显示位置
- 服务项目和设施列表

### 3. 用户体验
- 加载状态提示
- 错误处理机制
- 响应式设计（桌面端优化）
- 平滑动画过渡
- 键盘导航支持（ESC关闭）

### 4. 性能优化
- 本地缓存机制（localStorage）
- 图片懒加载（待实现）
- 代码分割（未来优化）
- 最小化HTTP请求

## 开发指南

### 添加新养老院
在 `data/api-config.js` 文件的 `MOCK_ELDERLY_HOMES` 数组中添加新对象：

```javascript
{
  id: 9, // 唯一ID
  name: "新养老院名称",
  address: "浙江省XX市XX区XX路XX号",
  phone: "0571-8888XXXX",
  description: "描述内容...",
  priceRange: "价格范围",
  images: ["image1.jpg", "image2.jpg"],
  services: ["服务1", "服务2", "服务3"],
  coordinates: [经度, 纬度], // 使用高德地图坐标
  rating: 4.0, // 0-5
  capacity: 80, // 床位数量
  establishedYear: 2023, // 成立年份
  features: ["设施1", "设施2"] // 特色设施
}
```

### 修改主题颜色
在 `style.css` 文件的 `:root` 部分修改CSS变量：

```css
:root {
  --primary-color: #ff7e5f;     /* 主色 */
  --secondary-color: #feb47b;   /* 辅色 */
  --accent-color: #ffcc00;      /* 强调色 */
  --bg-color: #fff9f5;          /* 背景色 */
  /* ... 其他变量 */
}
```

### 配置高德地图
1. 注册高德地图开发者账号
2. 创建应用获取API密钥
3. 在 `index.html` 和 `data/api-config.js` 中替换 `YOUR_AMAP_KEY`

## 未来扩展

### 计划功能
1. **筛选功能** - 按城市、价格、服务类型筛选
2. **收藏功能** - 用户收藏养老院
3. **比较功能** - 多养老院对比
4. **用户评价** - 评分和评论系统
5. **预约参观** - 在线预约表单

### 技术改进
1. **响应式优化** - 更好的移动端体验
2. **PWA支持** - 离线访问能力
3. **性能监控** - 用户体验数据收集
4. **SEO优化** - 更好的搜索引擎收录

## 注意事项

### 开发阶段
- 当前使用模拟数据，需要替换为真实API
- 高德地图需要有效API密钥
- 图片资源目前使用Font Awesome图标占位
- 建议在生产环境启用HTTPS

### 数据安全
- 避免在代码中硬编码敏感信息
- 使用环境变量管理API密钥
- 对用户输入进行验证和转义
- 遵循GDPR等相关法规

### 浏览器兼容性
- 支持现代浏览器（Chrome 60+, Firefox 55+, Safari 11+）
- 需要JavaScript支持
- 地图功能需要网络连接

## 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱：service@example.com
- 电话：400-XXX-XXXX

---

**最后更新**: 2026-03-17
**版本**: 1.0.0
**状态**: 开发阶段（模拟数据）