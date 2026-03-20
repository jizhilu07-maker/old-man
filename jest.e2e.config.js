// E2E测试专用配置
module.exports = {
  // 串行运行测试，避免浏览器冲突
  maxWorkers: 1,
  testMatch: ['**/tests/e2e/**/*.test.js'],
  // 设置较长的超时时间，因为E2E测试较慢
  testTimeout: 30000,
  // 显示详细输出
  verbose: true,
  // 不需要jsdom环境，因为使用Puppeteer
  testEnvironment: 'node',
  // 设置全局超时
  globalSetup: undefined,
  globalTeardown: undefined,
  // 配置覆盖率报告
  collectCoverage: false
};