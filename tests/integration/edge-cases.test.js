// 边缘情况测试 - 覆盖未测试的分支
// 目标是提升分支覆盖率到80%以上

describe('边缘情况测试', () => {
  let mockDataService;

  // 启用fake timers用于测试setTimeout
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    // 创建完整的DOM结构，模拟index.html
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
          <option value="3.0">3.0+</option>
          <option value="4.0">4.0+</option>
          <option value="4.5">4.5+</option>
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
          <div id="detail-map" style="height: 300px; margin: 1rem 0;"></div>
        </div>
      </div>
      <div id="error-container"></div>
    `;

    // 创建模拟的dataService
    mockDataService = {
      getElderlyHomes: jest.fn().mockResolvedValue([]),
      searchElderlyHomes: jest.fn().mockResolvedValue([]),
      filterElderlyHomes: jest.fn().mockResolvedValue([]),
      getElderlyHomeById: jest.fn().mockResolvedValue(null),
      getCities: jest.fn().mockReturnValue([]),
      getServiceTypes: jest.fn().mockReturnValue([])
    };

    // 将模拟的dataService设置为全局变量
    global.dataService = mockDataService;
    global.AppState = { currentHomes: [], isLoading: false, currentDetailId: null, amap: null, amapMarker: null };
    global.AMap = undefined; // 模拟高德地图API未加载

    // 确保window对象存在并指向全局对象
    // 在Jest的jsdom环境中，window应该已经设置，但我们需要确保它指向全局对象
    global.window = global;
    global.document = document;

    // 导入script.js模块（需要重新加载以使用模拟的全局变量）
    // 使用jest.isolateModules确保每次测试都重新加载模块
    jest.isolateModules(() => {
      require('../../script.js');
    });

    // 触发DOMContentLoaded事件，让script.js初始化应用并绑定事件
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domContentLoadedEvent);
  });

  afterEach(() => {
    // 清理全局变量
    delete global.dataService;
    delete global.AppState;
    delete global.AMap;
    // 清理appDebug
    if (typeof window !== 'undefined') delete window.appDebug;
    if (global.window) delete global.window.appDebug;
    // 清理DOM
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  // 测试1: handleSearch中AppState.currentHomes.length === 0的分支
  test('空状态下的搜索应该重新加载数据', async () => {
    // 设置模拟数据
    const mockHomes = [
      {
        id: 1,
        name: '测试养老院',
        address: '测试地址',
        rating: 4.5,
        phone: '1234567890',
        description: '测试描述',
        priceRange: '3000-5000元/月',
        services: ['24小时护理'],
        images: ['test.jpg']
      }
    ];
    mockDataService.getElderlyHomes.mockResolvedValue(mockHomes);
    mockDataService.searchElderlyHomes.mockResolvedValue(mockHomes);
    mockDataService.filterElderlyHomes.mockResolvedValue(mockHomes);

    // 清空搜索输入框，确保没有查询词
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';

    // 获取handleSearch函数
    const handleSearch = window.appDebug?.handleSearch;
    expect(handleSearch).toBeDefined();

    // 调用handleSearch，期望它调用loadElderlyHomes（通过getElderlyHomes）
    await handleSearch();

    // 验证：由于AppState.currentHomes为空，应该调用getElderlyHomes
    expect(mockDataService.getElderlyHomes).toHaveBeenCalled();
    expect(mockDataService.searchElderlyHomes).not.toHaveBeenCalled();
    expect(mockDataService.filterElderlyHomes).not.toHaveBeenCalled();
  });

  // 测试2: 详情按钮事件冒泡阻止
  test('详情按钮点击事件阻止冒泡', async () => {
    // 设置模拟数据 - 需要完整的属性，因为updateElderlyList会使用它们
    const mockHome = {
      id: 1,
      name: '测试养老院',
      address: '测试地址',
      rating: 4.5,
      phone: '1234567890',
      description: '测试描述',
      priceRange: '3000-5000元/月',
      services: ['24小时护理'],
      images: ['test.jpg']
    };

    // 手动调用updateElderlyList来添加卡片
    // 注意：global.AppState可能不会影响script.js内部的AppState
    // 但我们通过window.appDebug.getState()来获取状态

    // 获取updateElderlyList函数
    const updateElderlyList = window.appDebug?.updateElderlyList;
    expect(updateElderlyList).toBeDefined();

    // 调用函数更新列表
    updateElderlyList([mockHome]);

    // 查找详情按钮
    const detailBtn = document.querySelector('.view-details');
    expect(detailBtn).toBeDefined();

    // 创建模拟事件对象
    const mockEvent = {
      stopPropagation: jest.fn()
    };

    // 模拟点击事件
    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'stopPropagation', { value: jest.fn() });

    // 触发点击事件
    detailBtn.dispatchEvent(clickEvent);

    // 验证事件监听器被触发
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
  });

  // 测试3: 高德地图API未加载的情况
  test('高德地图API未加载时显示错误信息', () => {
    // 设置AMap为undefined
    global.AMap = undefined;

    // 获取initAmapMap函数
    const initAmapMap = window.appDebug?.initAmapMap;
    expect(initAmapMap).toBeDefined();

    // 调用函数
    initAmapMap([120.153576, 30.287459], '测试地点');

    // 验证地图容器显示了错误信息
    const mapContainer = document.getElementById('detail-map');
    expect(mapContainer.innerHTML).toContain('地图加载失败');
    expect(mapContainer.innerHTML).toContain('请检查网络连接或API密钥');
  });

  // 测试4: 初始化筛选器失败
  test('筛选器初始化失败时不会崩溃', async () => {
    // 模拟getCities或getServiceTypes抛出错误
    mockDataService.getCities.mockImplementation(() => {
      throw new Error('获取城市列表失败');
    });
    mockDataService.getServiceTypes.mockResolvedValue([]);

    // 获取initFilters函数
    const initFilters = window.appDebug?.initFilters;
    expect(initFilters).toBeDefined();

    // 调用函数，期望它不会抛出错误
    await expect(initFilters()).resolves.not.toThrow();

    // 验证错误被捕获并记录
    // 这里我们主要验证函数不会崩溃
  });

  // 测试5: 显示错误消息并自动移除
  test('错误消息显示和自动移除', () => {
    // 获取showError函数
    const showError = window.appDebug?.showError;
    expect(showError).toBeDefined();

    // 调用函数显示错误
    showError('测试错误消息');

    // 验证错误消息被添加到DOM
    // showError将错误消息添加到document.body，而不是error-container
    const errorMessages = document.querySelectorAll('.error-message');
    expect(errorMessages.length).toBe(1);
    const errorDiv = errorMessages[0];
    // 错误消息包含在内部div中，检查整个文本内容
    expect(errorDiv.textContent).toContain('测试错误消息');

    // 模拟3秒后自动移除
    jest.advanceTimersByTime(3000);

    // 验证错误消息开始淡出
    expect(errorDiv.style.animation).toBe('slideOut 0.3s ease');

    // 模拟动画完成
    jest.advanceTimersByTime(300);

    // 验证错误消息被移除
    expect(document.querySelectorAll('.error-message').length).toBe(0);
  });

  // 测试6: 应用初始化失败
  test('应用初始化失败时显示错误', async () => {
    // 增加超时时间到10秒
    jest.setTimeout(10000);

    // 模拟dataService.getElderlyHomes失败，导致initApp失败
    // global.dataService是在beforeEach中设置的mock
    const originalGetElderlyHomes = global.dataService.getElderlyHomes;
    global.dataService.getElderlyHomes = jest.fn().mockRejectedValue(new Error('数据加载失败'));

    try {
      // 模拟DOMContentLoaded事件，触发initApp
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // 等待所有微任务和宏任务完成
      // 由于我们使用了假定时器，需要手动推进时间
      await Promise.resolve();

      // 推进时间让异步操作有机会执行
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      // 验证getElderlyHomes被调用
      expect(global.dataService.getElderlyHomes).toHaveBeenCalled();

      // 验证错误消息被显示（通过检查.error-message元素）
      // showError函数会将错误消息添加到body
      const errorMessages = document.querySelectorAll('.error-message');
      // 注意：可能有一个来自之前测试的错误消息，但应该被清理了
      // 至少应该有一个错误消息显示
      expect(errorMessages.length).toBeGreaterThan(0);
    } finally {
      // 恢复原始mock
      global.dataService.getElderlyHomes = originalGetElderlyHomes;
    }
  }, 10000); // 10秒超时

  // 测试7: 地图初始化失败
  test('地图初始化失败时显示错误信息', () => {
    // 设置AMap为抛出错误的函数
    global.AMap = class MockAMap {
      constructor() {
        throw new Error('地图初始化失败');
      }
    };

    // 获取initAmapMap函数
    const initAmapMap = window.appDebug?.initAmapMap;
    expect(initAmapMap).toBeDefined();

    // 调用函数
    initAmapMap([120.153576, 30.287459], '测试地点');

    // 验证地图容器显示了错误信息
    const mapContainer = document.getElementById('detail-map');
    expect(mapContainer.innerHTML).toContain('地图初始化失败');
  });

  // 测试8: escapeHtml函数边缘情况
  test('escapeHtml处理非字符串输入', () => {
    // 获取escapeHtml函数
    const escapeHtml = window.appDebug?.escapeHtml;
    expect(escapeHtml).toBeDefined();

    // 测试非字符串输入
    expect(escapeHtml(null)).toBe(null);
    expect(escapeHtml(undefined)).toBe(undefined);
    expect(escapeHtml(123)).toBe(123);
    expect(escapeHtml({})).toEqual({});

    // 测试字符串输入
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(escapeHtml('test & test')).toBe('test &amp; test');
  });

  // 测试9: 清理已存在的地图实例
  test('初始化新地图前清理旧实例', () => {
    // 设置已存在的地图实例 - 通过appDebug.getState()设置
    const mockMarker = { setMap: jest.fn() };
    const mockMap = { destroy: jest.fn() };
    const state = window.appDebug.getState();
    state.amapMarker = mockMarker;
    state.amap = mockMap;
    global.AMap = class MockAMap {
      constructor() {
        return { setCenter: jest.fn(), setZoom: jest.fn() };
      }
    };

    // 获取initAmapMap函数
    const initAmapMap = window.appDebug?.initAmapMap;
    expect(initAmapMap).toBeDefined();

    // 调用函数
    initAmapMap([120.153576, 30.287459], '测试地点');

    // 验证旧实例被清理
    expect(mockMarker.setMap).toHaveBeenCalledWith(null);
    expect(mockMap.destroy).toHaveBeenCalled();
    // 通过appDebug.getState()验证状态被清理
    const stateAfter = window.appDebug.getState();
    expect(stateAfter.amapMarker).toBeNull();
    expect(stateAfter.amap).toBeNull();
  });
});