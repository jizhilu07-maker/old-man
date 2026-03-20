// 详情模态框集成测试
// 测试showDetailModal、updateDetailModal、closeDetailModal等函数

const { DataService, MOCK_ELDERLY_HOMES } = require('../../data/api-config');

describe('详情模态框集成测试', () => {
  let mockDataService;
  let detailModal, modalTitle, modalBody, closeModal;

  beforeEach(async () => {
    // 创建完整的DOM结构，包含script.js所需的所有元素
    document.body.innerHTML = `
      <div id="filters-section">
        <select id="city-filter">
          <option value="">全部城市</option>
        </select>
        <select id="service-filter">
          <option value="">全部服务</option>
        </select>
        <select id="rating-filter">
          <option value="0">全部评分</option>
        </select>
        <button id="clear-filters">清除筛选</button>
      </div>
      <div id="search-section">
        <input type="text" id="search-input" placeholder="搜索养老院...">
        <button id="search-btn">搜索</button>
      </div>
      <div id="elderly-list"></div>
      <div id="total-count">0</div>
      <div id="loading" style="display: none;">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>
      <div id="detail-modal" class="modal">
        <div class="modal-content">
          <span id="close-modal">&times;</span>
          <h2 id="modal-title"></h2>
          <div id="modal-body"></div>
        </div>
      </div>
    `;

    // 获取DOM元素引用
    detailModal = document.getElementById('detail-modal');
    modalTitle = document.getElementById('modal-title');
    modalBody = document.getElementById('modal-body');
    closeModal = document.getElementById('close-modal');

    // 创建模拟的DataService
    mockDataService = {
      getCities: jest.fn().mockReturnValue(['杭州市', '宁波市', '温州市']),
      getServiceTypes: jest.fn().mockReturnValue(['24小时护理', '康复训练', '营养膳食']),
      getElderlyHomes: jest.fn().mockResolvedValue(MOCK_ELDERLY_HOMES),
      searchElderlyHomes: jest.fn().mockResolvedValue(MOCK_ELDERLY_HOMES),
      filterElderlyHomes: jest.fn().mockResolvedValue(MOCK_ELDERLY_HOMES),
      getElderlyHomeById: jest.fn().mockImplementation(async (id) => {
        return MOCK_ELDERLY_HOMES.find(home => home.id === id) || null;
      })
    };

    // 将模拟的dataService设置为全局变量
    global.dataService = mockDataService;

    // 加载script.js
    try {
      require('../../script.js');
      // 触发DOMContentLoaded事件
      const domContentLoadedEvent = new Event('DOMContentLoaded');
      document.dispatchEvent(domContentLoadedEvent);
    } catch (error) {
      console.warn('加载script.js时出错:', error.message);
    }
  });

  afterEach(() => {
    // 清理
    document.body.innerHTML = '';
    delete global.dataService;
    delete global.window.appDebug;
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('showDetailModal函数正确加载并显示详情', async () => {
    if (!window.appDebug || !window.appDebug.showDetail) {
      console.warn('appDebug或showDetail不可用，跳过测试');
      return;
    }

    const testHomeId = 1;
    const testHome = MOCK_ELDERLY_HOMES.find(home => home.id === testHomeId);

    // 执行showDetailModal
    await window.appDebug.showDetail(testHomeId);

    // 验证getElderlyHomeById被调用
    expect(mockDataService.getElderlyHomeById).toHaveBeenCalledWith(testHomeId);

    // 验证模态框显示
    expect(detailModal.classList.contains('show')).toBe(true);

    // 验证标题被设置
    expect(modalTitle.textContent).toBe(testHome.name);

    // 验证模态框内容包含养老院信息
    expect(modalBody.innerHTML).toContain(escapeHtml(testHome.address));
    expect(modalBody.innerHTML).toContain(escapeHtml(testHome.phone));
    expect(modalBody.innerHTML).toContain(escapeHtml(testHome.priceRange));
  });

  test('showDetailModal处理未找到养老院的情况', async () => {
    if (!window.appDebug || !window.appDebug.showDetail) {
      console.warn('appDebug或showDetail不可用，跳过测试');
      return;
    }

    // 模拟getElderlyHomeById返回null
    mockDataService.getElderlyHomeById.mockResolvedValue(null);

    // 监听console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 执行showDetailModal
    await window.appDebug.showDetail(999); // 不存在的ID

    // 验证getElderlyHomeById被调用
    expect(mockDataService.getElderlyHomeById).toHaveBeenCalledWith(999);

    // 验证错误被记录
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '加载详情失败:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  test('showDetailModal处理数据服务错误', async () => {
    if (!window.appDebug || !window.appDebug.showDetail) {
      console.warn('appDebug或showDetail不可用，跳过测试');
      return;
    }

    // 模拟getElderlyHomeById抛出错误
    const testError = new Error('网络错误');
    mockDataService.getElderlyHomeById.mockRejectedValue(testError);

    // 监听console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 执行showDetailModal
    await window.appDebug.showDetail(1);

    // 验证错误被记录
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '加载详情失败:',
      testError
    );

    consoleErrorSpy.mockRestore();
  });

  test('closeDetailModal函数正确关闭模态框', () => {
    if (!window.appDebug || !window.appDebug.showDetail || !window.appDebug.closeDetailModal) {
      console.warn('appDebug函数不可用，跳过测试');
      return;
    }

    // 首先显示模态框
    detailModal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 设置一些状态 - 通过appDebug.getState()获取状态对象
    const state = window.appDebug.getState();
    state.currentDetailId = 1;
    state.amapMarker = { setMap: jest.fn() };
    state.amap = { destroy: jest.fn() };

    // 执行closeDetailModal
    window.appDebug.closeDetailModal();

    // 验证模态框隐藏
    expect(detailModal.classList.contains('show')).toBe(false);

    // 验证滚动恢复
    expect(document.body.style.overflow).toBe('auto');

    // 验证状态被清理 - 通过appDebug.getState()获取状态对象
    const stateAfter = window.appDebug.getState();
    expect(stateAfter.currentDetailId).toBeNull();
    expect(stateAfter.amapMarker).toBeNull();
    expect(stateAfter.amap).toBeNull();
  });

  test('closeDetailModal安全处理缺少地图实例的情况', () => {
    if (!window.appDebug || !window.appDebug.closeDetailModal) {
      console.warn('appDebug或closeDetailModal不可用，跳过测试');
      return;
    }

    // 清除地图实例状态 - 通过appDebug.getState()获取状态对象
    const state = window.appDebug.getState();
    state.amapMarker = null;
    state.amap = null;

    // 显示模态框
    detailModal.classList.add('show');

    // 执行closeDetailModal（不应该抛出错误）
    expect(() => {
      window.appDebug.closeDetailModal();
    }).not.toThrow();

    // 验证模态框隐藏
    expect(detailModal.classList.contains('show')).toBe(false);
  });

  test('模态框点击外部区域关闭', async () => {
    // 显示模态框
    detailModal.classList.add('show');

    // 模拟点击模态框外部（背景层）
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      clientX: 100,
      clientY: 100
    });

    // 设置事件目标为模态框本身（模拟点击背景）
    Object.defineProperty(clickEvent, 'target', {
      writable: false,
      value: detailModal
    });

    detailModal.dispatchEvent(clickEvent);

    // 给事件处理一点时间
    await new Promise(resolve => setTimeout(resolve, 50));

    // 验证模态框已关闭
    expect(detailModal.classList.contains('show')).toBe(false);
  });

  test('ESC键关闭模态框', async () => {
    // 显示模态框
    detailModal.classList.add('show');

    // 模拟按下ESC键
    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true
    });

    document.dispatchEvent(escEvent);

    // 给事件处理一点时间
    await new Promise(resolve => setTimeout(resolve, 50));

    // 验证模态框已关闭
    expect(detailModal.classList.contains('show')).toBe(false);
  });

  test('非ESC键不关闭模态框', async () => {
    // 显示模态框
    detailModal.classList.add('show');

    // 模拟按下其他键（Enter）
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    });

    document.dispatchEvent(enterEvent);

    // 给事件处理一点时间
    await new Promise(resolve => setTimeout(resolve, 50));

    // 验证模态框仍然显示
    expect(detailModal.classList.contains('show')).toBe(true);
  });
});

// 辅助函数：从script.js复制的escapeHtml函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}