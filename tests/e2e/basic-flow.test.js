// 端到端测试 - 基本用户流程
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, spawn } = require('child_process');

/**
 * 强制终止所有Chrome/Chromium进程（Windows专用）
 */
function killChromeProcessesOnWindows() {
  if (process.platform !== 'win32') return;

  try {
    console.log('正在检查并终止Chrome进程...');
    // 查找并终止所有chrome/chromium相关进程
    const processes = ['chrome.exe', 'chromium.exe', 'chrome', 'chromium'];

    processes.forEach(processName => {
      try {
        execSync(`taskkill /F /IM ${processName} /T`, { stdio: 'ignore' });
        console.log(`已终止 ${processName} 进程`);
      } catch (error) {
        // 进程可能不存在，忽略错误
      }
    });

    // 额外等待确保进程完全终止
    setTimeout(() => {}, 1000);
  } catch (error) {
    console.warn('终止Chrome进程时出错:', error.message);
  }
}

/**
 * 清理用户数据目录，包含重试和强制清理
 */
async function cleanupUserDataDir(dirPath, maxRetries = 5) {
  if (!dirPath || !fs.existsSync(dirPath)) return true;

  let retries = maxRetries;
  while (retries > 0) {
    try {
      // 首先尝试正常删除
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      console.log(`成功清理用户数据目录: ${dirPath}`);
      return true;
    } catch (rmError) {
      retries--;
      console.warn(`清理用户数据目录失败，剩余重试次数 ${retries}: ${dirPath}`, rmError.message);

      if (retries === 0) {
        console.warn(`无法清理用户数据目录，将保留: ${dirPath}`);

        // 在Windows上尝试使用rmdir命令
        if (process.platform === 'win32') {
          try {
            execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore', timeout: 5000 });
            console.log(`使用rmdir命令成功清理: ${dirPath}`);
            return true;
          } catch (cmdError) {
            console.warn(`rmdir命令也失败: ${cmdError.message}`);
            return false;
          }
        }
        return false;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// 全局浏览器和页面实例，在beforeAll中初始化，afterAll中关闭
let browser;
let page;
let userDataDir;

describe('基本用户流程', () => {
  beforeAll(async () => {
    // 在启动新浏览器前，先终止可能存在的Chrome进程（Windows）
    if (process.platform === 'win32') {
      killChromeProcessesOnWindows();
    }

    // 创建独立的用户数据目录，避免冲突
    userDataDir = path.join(os.tmpdir(), `puppeteer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    // 确保目录不存在，然后创建
    if (fs.existsSync(userDataDir)) {
      console.warn(`用户数据目录已存在，尝试清理: ${userDataDir}`);
      await cleanupUserDataDir(userDataDir, 3);
    }

    fs.mkdirSync(userDataDir, { recursive: true });
    console.log(`创建用户数据目录: ${userDataDir}`);

    // 启动浏览器，使用独立的用户数据目录
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-features=site-per-process',  // 禁用可能引起冲突的特性
          '--disable-gpu',  // 禁用GPU加速，减少问题
          '--disable-software-rasterizer'  // 禁用软件光栅化器
        ],
        userDataDir: userDataDir,
        timeout: 30000
      });

      page = await browser.newPage();

      // 设置视口大小
      await page.setViewport({ width: 1280, height: 720 });

      // 监听页面错误和console消息
      page.on('pageerror', (error) => {
        console.error('页面错误:', error.message);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.error('浏览器控制台错误:', msg.text());
        }
      });

      // 配置默认超时
      jest.setTimeout(20000);
      console.log('浏览器启动成功');
    } catch (launchError) {
      console.error('启动浏览器失败:', launchError.message);
      // 清理失败的用户数据目录
      if (userDataDir && fs.existsSync(userDataDir)) {
        await cleanupUserDataDir(userDataDir, 3);
      }
      throw launchError;
    }
  }, 40000);

  afterAll(async () => {
    console.log('开始afterAll清理...');

    // 1. 首先关闭浏览器
    if (browser) {
      let browserClosed = false;

      // 尝试正常关闭
      try {
        await browser.close();
        browserClosed = true;
        console.log('浏览器正常关闭');
      } catch (closeError) {
        console.warn('关闭浏览器时出错:', closeError.message);
        browserClosed = false;
      }

      // 如果正常关闭失败，尝试强制终止
      if (!browserClosed) {
        try {
          // 尝试通过进程PID终止
          if (browser.process && browser.process()) {
            const pid = browser.process().pid;
            console.log(`尝试终止浏览器进程 PID: ${pid}`);

            if (process.platform === 'win32') {
              try {
                execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
                console.log(`已终止浏览器进程 PID: ${pid}`);
              } catch (taskkillError) {
                console.warn(`taskkill失败: ${taskkillError.message}`);
              }
            } else {
              try {
                process.kill(pid, 'SIGKILL');
                console.log(`已发送SIGKILL到进程 PID: ${pid}`);
              } catch (killError) {
                console.warn(`终止进程失败: ${killError.message}`);
              }
            }
          }
        } catch (processError) {
          console.warn('终止浏览器进程时出错:', processError.message);
        }
      }

      // 强制终止所有Chrome进程（Windows）
      if (process.platform === 'win32') {
        killChromeProcessesOnWindows();
      }

      // 等待足够时间确保进程完全退出
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 2. 清理用户数据目录
    if (userDataDir && fs.existsSync(userDataDir)) {
      console.log(`清理用户数据目录: ${userDataDir}`);
      const cleaned = await cleanupUserDataDir(userDataDir, 5);
      if (!cleaned) {
        console.warn(`无法清理用户数据目录，将保留: ${userDataDir}`);
        // 标记目录为可删除（Windows）
        if (process.platform === 'win32') {
          try {
            // 尝试在下次启动时删除
            execSync(`attrib +R "${userDataDir}"`, { stdio: 'ignore' });
          } catch (attribError) {
            // 忽略错误
          }
        }
      }
    }

    // 3. 重置全局变量
    browser = null;
    page = null;
    userDataDir = null;

    console.log('afterAll清理完成');
  }, 50000);  // 增加超时时间到50秒

  // 在每个测试后，如果测试失败则截图
  afterEach(async () => {
    if (jest && jest.currentTest && jest.currentTest.state === 'failed') {
      const testName = jest.currentTest.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const screenshotPath = path.join(__dirname, `../../test-screenshots/${testName}-${Date.now()}.png`);

      try {
        // 确保截图目录存在
        const screenshotDir = path.join(__dirname, '../../test-screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`测试失败截图已保存: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error('保存截图失败:', screenshotError.message);
      }
    }
  });

  // 测试1: 页面加载并显示养老院列表
  test('页面加载并显示养老院列表', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 检查标题
    const title = await page.title();
    expect(title).toContain('浙江省养老院目录');

    // 检查结果计数
    await page.waitForSelector('#total-count', { visible: true, timeout: 5000 });
    const countText = await page.$eval('#total-count', el => el.textContent);
    expect(parseInt(countText)).toBeGreaterThan(0);

    // 检查养老院卡片
    const cards = await page.$$('.elderly-card');
    expect(cards.length).toBeGreaterThan(0);
  }, 20000);

  // 测试2: 搜索功能
  test('搜索功能', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 清空输入框
    await page.evaluate(() => {
      const input = document.querySelector('#search-input');
      if (input) input.value = '';
    });

    // 输入搜索词
    await page.type('#search-input', '杭州', { delay: 100 });
    await page.click('#search-btn');

    // 等待结果更新
    await page.waitForFunction(() => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) > 0;
    }, { timeout: 10000 });

    // 验证搜索结果
    const countText = await page.$eval('#total-count', el => el.textContent);
    expect(parseInt(countText)).toBeGreaterThan(0);

    // 检查卡片包含搜索词
    const cardText = await page.$eval('.elderly-card', el => el.textContent);
    expect(cardText.toLowerCase()).toContain('杭州');
  }, 20000);

  // 测试3: 查看详情模态框
  test('查看详情模态框', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 等待并点击第一个卡片
    await page.waitForSelector('.elderly-card', { visible: true, timeout: 5000 });
    await page.click('.elderly-card');

    // 等待模态框显示
    await page.waitForSelector('#detail-modal.show', { visible: true, timeout: 5000 });

    // 检查模态框标题
    const modalTitle = await page.$eval('#modal-title', el => el.textContent);
    expect(modalTitle).toBeTruthy();

    // 关闭模态框
    await page.click('#close-modal');
    await page.waitForSelector('#detail-modal.show', { hidden: true, timeout: 5000 });
  }, 20000);

  // 测试4: 城市筛选功能
  test('城市筛选功能', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 等待筛选器加载
    await page.waitForSelector('#city-filter', { visible: true, timeout: 5000 });

    // 等待卡片加载
    await page.waitForSelector('#total-count', { visible: true, timeout: 5000 });
    await page.waitForSelector('.elderly-card', { visible: true, timeout: 5000 });

    // 获取初始卡片数量
    const initialCards = await page.$$('.elderly-card');
    const initialCount = initialCards.length;
    expect(initialCount).toBeGreaterThan(0);

    // 选择城市筛选器
    await page.select('#city-filter', '杭州市');

    // 等待城市选项加载完成
    await page.waitForFunction(() => {
      const select = document.getElementById('city-filter');
      return select && select.options.length > 1;
    }, { timeout: 5000 });

    // 调试：验证筛选器值
    const cityFilterValue = await page.$eval('#city-filter', el => el.value);
    console.log('城市筛选器值:', cityFilterValue);

    // 调试：打印所有选项
    const cityOptions = await page.$$eval('#city-filter option', options =>
      options.map(opt => ({ value: opt.value, text: opt.textContent }))
    );
    console.log('城市选项:', cityOptions);

    // 调试：直接测试筛选逻辑
    const filterResult = await page.evaluate(async () => {
      try {
        const service = window.dataService;
        const homes = await service.getElderlyHomes();
        const filtered = await service.filterElderlyHomes({ city: '杭州市' }, homes);
        return {
          total: homes.length,
          filtered: filtered.length,
          filteredNames: filtered.map(h => h.name)
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('直接筛选结果:', filterResult);

    // 点击搜索按钮触发筛选（确保handleSearch被调用）
    await page.click('#search-btn');

    // 等待结果更新 - 等待数量减少（筛选生效）
    await page.waitForFunction((expectedInitialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) > 0 && parseInt(countEl.textContent) < expectedInitialCount;
    }, { timeout: 10000 }, initialCount);

    // 验证筛选结果
    const countText = await page.$eval('#total-count', el => el.textContent);
    const filteredCount = parseInt(countText);
    console.log('初始数量:', initialCount, '筛选后数量:', filteredCount);

    // 调试：打印所有卡片的地址
    const cardAddresses = await page.$$eval('.elderly-card .card-address span', spans =>
      spans.map(span => span.textContent)
    );
    console.log('卡片地址:', cardAddresses);

    expect(filteredCount).toBeGreaterThan(0);
    // 筛选后数量应该减少（因为只有部分数据匹配）
    expect(filteredCount).toBeLessThan(initialCount);

    // 检查卡片内容包含"杭州"
    const cards = await page.$$('.elderly-card');
    expect(cards.length).toBe(filteredCount);

    // 验证每张卡片都包含"杭州"或地址中包含"杭州"
    for (let i = 0; i < Math.min(cards.length, 3); i++) {
      const cardText = await page.evaluate(el => el.textContent, cards[i]);
      expect(cardText.toLowerCase()).toContain('杭州');
    }

    // 清除筛选
    await page.click('#clear-filters');

    // 等待恢复原始数量
    await page.waitForFunction((initialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) === initialCount;
    }, { timeout: 10000 }, initialCount);
  }, 30000);

  // 测试5: 服务类型筛选功能
  test('服务类型筛选功能', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 等待筛选器加载
    await page.waitForSelector('#service-filter', { visible: true, timeout: 5000 });

    // 等待卡片加载
    await page.waitForSelector('#total-count', { visible: true, timeout: 5000 });
    await page.waitForSelector('.elderly-card', { visible: true, timeout: 5000 });

    // 获取初始卡片数量
    const initialCards = await page.$$('.elderly-card');
    const initialCount = initialCards.length;
    expect(initialCount).toBeGreaterThan(0);

    // 选择服务类型筛选器
    await page.select('#service-filter', '24小时护理');

    // 等待服务类型选项加载完成
    await page.waitForFunction(() => {
      const select = document.getElementById('service-filter');
      return select && select.options.length > 1;
    }, { timeout: 5000 });

    // 点击搜索按钮触发筛选（确保handleSearch被调用）
    await page.click('#search-btn');

    // 等待结果更新 - 等待数量减少（筛选生效）
    await page.waitForFunction((expectedInitialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) > 0 &&
             parseInt(countEl.textContent) < expectedInitialCount;
    }, { timeout: 10000 }, initialCount);

    // 验证筛选结果
    const countText = await page.$eval('#total-count', el => el.textContent);
    const filteredCount = parseInt(countText);
    console.log('服务类型筛选测试 - 初始数量:', initialCount, '筛选后数量:', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    // 筛选后数量应该减少（因为只有部分数据匹配）
    expect(filteredCount).toBeLessThan(initialCount);

    // 清除筛选
    await page.click('#clear-filters');

    // 等待恢复原始数量
    await page.waitForFunction((initialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) === initialCount;
    }, { timeout: 10000 }, initialCount);
  }, 30000);

  // 测试6: 评分筛选功能
  test('评分筛选功能', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 等待筛选器加载
    await page.waitForSelector('#rating-filter', { visible: true, timeout: 5000 });

    // 等待卡片加载
    await page.waitForSelector('#total-count', { visible: true, timeout: 5000 });
    await page.waitForSelector('.elderly-card', { visible: true, timeout: 5000 });

    // 获取初始卡片数量
    const initialCards = await page.$$('.elderly-card');
    const initialCount = initialCards.length;
    expect(initialCount).toBeGreaterThan(0);

    // 选择评分筛选器 - 使用4.5星以确保数量减少
    await page.select('#rating-filter', '4.5');

    // 确保筛选器值已设置
    await page.waitForFunction(() => {
      const select = document.getElementById('rating-filter');
      return select && select.value === '4.5';
    }, { timeout: 5000 });

    // 点击搜索按钮触发筛选（确保handleSearch被调用）
    await page.click('#search-btn');

    // 等待结果更新 - 等待数量减少（筛选生效）
    await page.waitForFunction((expectedInitialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) > 0 &&
             parseInt(countEl.textContent) < expectedInitialCount;
    }, { timeout: 10000 }, initialCount);

    // 验证筛选结果
    const countText = await page.$eval('#total-count', el => el.textContent);
    const filteredCount = parseInt(countText);
    console.log('评分筛选测试 - 初始数量:', initialCount, '筛选后数量:', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    // 筛选后数量应该减少（因为只有部分数据匹配）
    expect(filteredCount).toBeLessThan(initialCount);

    // 清除筛选
    await page.click('#clear-filters');

    // 等待恢复原始数量
    await page.waitForFunction((initialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) === initialCount;
    }, { timeout: 10000 }, initialCount);
  }, 30000);

  // 测试7: 组合筛选功能（搜索 + 筛选）
  test('组合筛选功能', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 等待筛选器加载
    await page.waitForSelector('#city-filter', { visible: true, timeout: 5000 });
    await page.waitForSelector('#search-input', { visible: true, timeout: 5000 });

    // 等待卡片加载
    await page.waitForSelector('#total-count', { visible: true, timeout: 5000 });
    await page.waitForSelector('.elderly-card', { visible: true, timeout: 5000 });

    // 获取初始卡片数量
    const initialCards = await page.$$('.elderly-card');
    const initialCount = initialCards.length;
    expect(initialCount).toBeGreaterThan(0);

    // 先进行搜索
    await page.evaluate(() => {
      const input = document.querySelector('#search-input');
      if (input) input.value = '';
    });
    await page.type('#search-input', '养老', { delay: 100 });
    await page.click('#search-btn');

    // 等待搜索结果
    await page.waitForFunction(() => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) > 0;
    }, { timeout: 10000 });

    // 应用城市筛选
    await page.select('#city-filter', '杭州市');

    // 等待组合筛选结果 - 等待数量变化（应该减少）
    await page.waitForFunction((initialCount) => {
      const countEl = document.getElementById('total-count');
      if (!countEl) return false;
      const currentCount = parseInt(countEl.textContent);
      return currentCount > 0 && currentCount < initialCount;
    }, { timeout: 10000 }, initialCount);

    // 验证组合筛选结果
    const countText = await page.$eval('#total-count', el => el.textContent);
    const filteredCount = parseInt(countText);
    console.log('组合筛选测试 - 初始数量:', initialCount, '筛选后数量:', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    // 筛选后数量应该减少（因为只有部分数据匹配）
    expect(filteredCount).toBeLessThan(initialCount);

    // 清除所有筛选和搜索
    await page.click('#clear-filters');
    await page.evaluate(() => {
      const input = document.querySelector('#search-input');
      if (input) input.value = '';
      const searchBtn = document.querySelector('#search-btn');
      if (searchBtn) searchBtn.click();
    });

    // 等待恢复原始数量
    await page.waitForFunction((initialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) === initialCount;
    }, { timeout: 10000 }, initialCount);
  }, 40000);

  // 测试8: 空筛选结果测试
  test('空筛选结果测试', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 等待筛选器加载
    await page.waitForSelector('#city-filter', { visible: true, timeout: 5000 });

    // 等待卡片加载
    await page.waitForSelector('#total-count', { visible: true, timeout: 5000 });
    await page.waitForSelector('.elderly-card', { visible: true, timeout: 5000 });

    // 获取初始卡片数量
    const initialCards = await page.$$('.elderly-card');
    const initialCount = initialCards.length;
    expect(initialCount).toBeGreaterThan(0);

    // 选择不存在的城市（衢州市在模拟数据中不存在）
    await page.select('#city-filter', '衢州市');

    // 点击搜索按钮触发筛选
    await page.click('#search-btn');

    // 等待结果显示 - 应该显示0个结果
    await page.waitForFunction(() => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) === 0;
    }, { timeout: 10000 });

    // 验证结果显示为0
    const countText = await page.$eval('#total-count', el => el.textContent);
    expect(parseInt(countText)).toBe(0);

    // 验证显示空白状态信息
    const emptyState = await page.$('.empty-state');
    expect(emptyState).not.toBeNull();

    // 验证空白状态包含正确的文本
    const emptyStateText = await page.$eval('.empty-state', el => el.textContent);
    expect(emptyStateText).toContain('未找到相关养老院');

    // 清除筛选
    await page.click('#clear-filters');

    // 等待恢复原始数量
    await page.waitForFunction((initialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) === initialCount;
    }, { timeout: 10000 }, initialCount);
  }, 30000);

  // 测试9: 多筛选器组合测试（城市+服务+评分）
  test('多筛选器组合测试', async () => {
    // 导航到本地文件
    const filePath = path.join(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // 等待筛选器加载
    await page.waitForSelector('#city-filter', { visible: true, timeout: 5000 });
    await page.waitForSelector('#service-filter', { visible: true, timeout: 5000 });
    await page.waitForSelector('#rating-filter', { visible: true, timeout: 5000 });

    // 等待卡片加载
    await page.waitForSelector('#total-count', { visible: true, timeout: 5000 });
    await page.waitForSelector('.elderly-card', { visible: true, timeout: 5000 });

    // 获取初始卡片数量
    const initialCards = await page.$$('.elderly-card');
    const initialCount = initialCards.length;
    expect(initialCount).toBeGreaterThan(0);

    // 应用三个筛选器：城市=杭州市，服务=24小时护理，评分=4星及以上
    await page.select('#city-filter', '杭州市');
    await page.select('#service-filter', '24小时护理');
    await page.select('#rating-filter', '4');

    // 验证筛选器值已设置
    await page.waitForFunction(() => {
      const cityVal = document.getElementById('city-filter').value;
      const serviceVal = document.getElementById('service-filter').value;
      const ratingVal = document.getElementById('rating-filter').value;
      return cityVal === '杭州市' && serviceVal === '24小时护理' && ratingVal === '4';
    }, { timeout: 5000 });

    // 点击搜索按钮触发筛选
    await page.click('#search-btn');

    // 等待结果更新 - 等待数量减少（筛选生效）
    await page.waitForFunction((expectedInitialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) > 0 &&
             parseInt(countEl.textContent) < expectedInitialCount;
    }, { timeout: 10000 }, initialCount);

    // 验证筛选结果
    const countText = await page.$eval('#total-count', el => el.textContent);
    const filteredCount = parseInt(countText);
    console.log('初始数量:', initialCount, '组合筛选后数量:', filteredCount);

    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(initialCount);

    // 验证筛选结果的正确性
    const cards = await page.$$('.elderly-card');
    expect(cards.length).toBe(filteredCount);

    // 验证每张卡片都符合所有筛选条件
    for (let i = 0; i < Math.min(cards.length, 3); i++) {
      const cardText = await page.evaluate(el => el.textContent, cards[i]);
      // 检查地址包含"杭州"
      expect(cardText.toLowerCase()).toContain('杭州');
      // 检查服务包含"24小时护理"（服务标签显示在卡片中）
      expect(cardText).toContain('24小时护理');
      // 检查评分>=4（通过星级显示）
      // 注意：卡片中显示评分如"4.5"，我们需要检查数值
      const ratingMatch = cardText.match(/(\d+\.?\d*)/);
      if (ratingMatch) {
        const rating = parseFloat(ratingMatch[1]);
        expect(rating).toBeGreaterThanOrEqual(4);
      }
    }

    // 清除所有筛选
    await page.click('#clear-filters');

    // 等待恢复原始数量
    await page.waitForFunction((initialCount) => {
      const countEl = document.getElementById('total-count');
      return countEl && parseInt(countEl.textContent) === initialCount;
    }, { timeout: 10000 }, initialCount);
  }, 30000);
});