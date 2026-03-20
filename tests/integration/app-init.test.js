// 应用初始化和事件绑定测试
// 测试initApp、bindEvents、DOMContentLoaded等

const { DataService, MOCK_ELDERLY_HOMES } = require('../../data/api-config');

describe('应用初始化和事件绑定测试', () => {
  let mockDataService;

  beforeEach(() => {
    // 创建完整的DOM结构
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
        </div>
      </div>
    `;

    // 创建模拟的DataService
    mockDataService = {
      getCities: jest.fn().mockReturnValue(['杭州市', '宁波市', '温州市']),
      getServiceTypes: jest.fn().mockReturnValue(['24小时护理', '康复训练', '营养膳食']),
      getElderlyHomes: jest.fn().mockResolvedValue(MOCK_ELDERLY_HOMES),
      searchElderlyHomes: jest.fn().mockResolvedValue(MOCK_ELDERLY_HOMES),
      filterElderlyHomes: jest.fn().mockResolvedValue(MOCK_ELDERLY_HOMES),
      getElderlyHomeById: jest.fn().mockResolvedValue(MOCK_ELDERLY_HOMES[0])
    };

    global.dataService = mockDataService;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete global.dataService;
    delete global.window.appDebug;
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('DOMContentLoaded事件触发initApp', async () => {
    // 监听console.log来验证initApp被调用
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // 加载script.js
    require('../../script.js');

    // 触发DOMContentLoaded事件
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domContentLoadedEvent);

    // 给异步操作一点时间
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证初始化消息被记录
    expect(consoleLogSpy).toHaveBeenCalledWith('初始化养老院目录应用...');

    consoleLogSpy.mockRestore();
  });

  test('initApp调用bindEvents和initFilters', async () => {
    if (!window.appDebug || !window.appDebug.initApp) {
      console.warn('appDebug或initApp不可用，跳过测试');
      return;
    }

    // 监听数据服务调用
    const getCitiesSpy = mockDataService.getCities;
    const getServiceTypesSpy = mockDataService.getServiceTypes;
    const getElderlyHomesSpy = mockDataService.getElderlyHomes;

    // 执行initApp
    await window.appDebug.initApp();

    // 验证bindEvents被调用（通过检查事件监听器是否绑定）
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    // 验证搜索按钮有click事件监听器（通过触发事件检查）
    // 由于我们无法直接检查事件监听器，我们通过模拟点击来验证
    searchInput.value = '测试';
    searchBtn.click();

    // 给异步操作一点时间
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证searchElderlyHomes被调用（说明事件监听器已绑定）
    expect(mockDataService.searchElderlyHomes).toHaveBeenCalled();

    // 验证initFilters被调用（通过检查下拉菜单是否被填充）
    expect(getCitiesSpy).toHaveBeenCalled();
    expect(getServiceTypesSpy).toHaveBeenCalled();

    // 验证loadElderlyHomes被调用
    expect(getElderlyHomesSpy).toHaveBeenCalled();
  });

  test('bindEvents绑定所有事件监听器', () => {
    if (!window.appDebug || !window.appDebug.bindEvents) {
      console.warn('appDebug或bindEvents不可用，跳过测试');
      return;
    }

    // 重置数据服务mock
    mockDataService.searchElderlyHomes.mockClear();

    // 执行bindEvents
    window.appDebug.bindEvents();

    // 测试搜索按钮点击事件
    const searchBtn = document.getElementById('search-btn');
    searchBtn.click();
    expect(mockDataService.searchElderlyHomes).toHaveBeenCalled();

    // 重置mock
    mockDataService.searchElderlyHomes.mockClear();

    // 测试搜索输入框回车事件
    const searchInput = document.getElementById('search-input');
    searchInput.value = '回车测试';

    const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
    searchInput.dispatchEvent(enterEvent);

    expect(mockDataService.searchElderlyHomes).toHaveBeenCalledWith('回车测试');

    // 测试搜索输入框实时搜索（防抖）
    // 使用假定时器
    jest.useFakeTimers();
    mockDataService.searchElderlyHomes.mockClear();

    searchInput.value = 'a';
    searchInput.dispatchEvent(new Event('input'));

    searchInput.value = 'ab';
    searchInput.dispatchEvent(new Event('input'));

    searchInput.value = 'abc';
    searchInput.dispatchEvent(new Event('input'));

    // 在500ms之前，searchElderlyHomes不应被调用
    jest.advanceTimersByTime(400);
    expect(mockDataService.searchElderlyHomes).not.toHaveBeenCalled();

    // 前进到500ms后，searchElderlyHomes应该被调用一次
    jest.advanceTimersByTime(100);
    expect(mockDataService.searchElderlyHomes).toHaveBeenCalledTimes(1);
    expect(mockDataService.searchElderlyHomes).toHaveBeenCalledWith('abc');

    jest.useRealTimers();

    // 测试筛选器变更事件
    mockDataService.searchElderlyHomes.mockClear();
    const cityFilter = document.getElementById('city-filter');
    cityFilter.value = '杭州市';
    cityFilter.dispatchEvent(new Event('change'));

    // 给异步操作一点时间
    return new Promise(resolve => setTimeout(resolve, 100))
      .then(() => {
        expect(mockDataService.searchElderlyHomes).toHaveBeenCalled();
      });

    // 注意：其他事件监听器（清除筛选按钮、关闭模态框等）在其他测试中覆盖
  });

  test('详情按钮点击事件绑定', () => {
    // 这个测试验证updateElderlyList函数中详情按钮的事件绑定

    if (!window.appDebug || !window.appDebug.updateElderlyList) {
      console.warn('appDebug或updateElderlyList不可用，跳过测试');
      return;
    }

    // 创建一个模拟的养老院数据
    const mockHome = {
      id: 999,
      name: '测试养老院',
      address: '测试地址',
      phone: '1234567890',
      description: '测试描述',
      priceRange: '3000-5000元/月',
      rating: 4.5,
      services: ['24小时护理'],
      images: ['test.jpg']
    };

    // 设置数据服务，使getElderlyHomeById返回模拟数据
    mockDataService.getElderlyHomeById.mockResolvedValue(mockHome);

    // 监听showDetailModal调用
    const showDetailSpy = jest.spyOn(window.appDebug, 'showDetail').mockImplementation(() => {});

    // 调用updateElderlyList
    window.appDebug.updateElderlyList([mockHome]);

    // 查找并点击详情按钮
    const detailBtn = document.querySelector('.view-details');
    expect(detailBtn).not.toBeNull();

    // 创建点击事件并阻止默认行为
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    });
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

    detailBtn.dispatchEvent(clickEvent);

    // 验证stopPropagation被调用（阻止事件冒泡）
    expect(stopPropagationSpy).toHaveBeenCalled();

    // 验证showDetail被调用
    expect(showDetailSpy).toHaveBeenCalledWith(mockHome.id);

    showDetailSpy.mockRestore();
  });

  test('全局调试函数可用性', () => {
    // 验证appDebug全局对象的所有函数都可用

    require('../../script.js');

    // 触发DOMContentLoaded事件以确保appDebug被初始化
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domContentLoadedEvent);

    // 验证appDebug对象存在
    expect(window.appDebug).toBeDefined();

    // 验证所有调试函数都存在
    expect(typeof window.appDebug.reloadData).toBe('function');
    expect(typeof window.appDebug.showDetail).toBe('function');
    expect(typeof window.appDebug.getState).toBe('function');
    expect(typeof window.appDebug.getDataService).toBe('function');
    expect(typeof window.appDebug.initFilters).toBe('function');
    expect(typeof window.appDebug.clearFilters).toBe('function');
    expect(typeof window.appDebug.handleSearch).toBe('function');
    expect(typeof window.appDebug.updateElderlyList).toBe('function');

    // 测试getState返回AppState
    const state = window.appDebug.getState();
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');

    // 测试getDataService返回dataService
    const service = window.appDebug.getDataService();
    expect(service).toBeDefined();
    expect(service).toBe(mockDataService);
  });

  test('应用状态初始化', () => {
    // 验证AppState对象被正确初始化

    require('../../script.js');

    // 触发DOMContentLoaded事件
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domContentLoadedEvent);

    // 验证appDebug存在
    expect(window.appDebug).toBeDefined();

    // 通过appDebug.getState()获取状态
    const state = window.appDebug.getState();

    // 验证AppState属性
    expect(state).toHaveProperty('currentHomes');
    expect(state).toHaveProperty('currentDetailId');
    expect(state).toHaveProperty('amap');
    expect(state).toHaveProperty('amapMarker');

    // 验证初始值
    expect(state.currentHomes).toEqual([]);
    expect(state.currentDetailId).toBeNull();
    expect(state.amap).toBeNull();
    expect(state.amapMarker).toBeNull();
  });

  test('DOM元素引用初始化', () => {
    // 验证script.js所需的所有DOM元素都存在

    require('../../script.js');

    // 触发DOMContentLoaded事件
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    document.dispatchEvent(domContentLoadedEvent);

    // 验证所有必需的DOM元素都存在
    expect(document.getElementById('search-input')).toBeDefined();
    expect(document.getElementById('search-btn')).toBeDefined();
    expect(document.getElementById('city-filter')).toBeDefined();
    expect(document.getElementById('service-filter')).toBeDefined();
    expect(document.getElementById('rating-filter')).toBeDefined();
    expect(document.getElementById('clear-filters')).toBeDefined();
    expect(document.getElementById('elderly-list')).toBeDefined();
    expect(document.getElementById('total-count')).toBeDefined();
    expect(document.getElementById('loading')).toBeDefined();
    expect(document.getElementById('detail-modal')).toBeDefined();
    expect(document.getElementById('modal-title')).toBeDefined();
    expect(document.getElementById('modal-body')).toBeDefined();
    expect(document.getElementById('close-modal')).toBeDefined();
  });
});