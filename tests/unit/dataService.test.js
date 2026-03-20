// DataService类测试
const { DataService, MOCK_ELDERLY_HOMES } = require('../../data/api-config');

describe('DataService类', () => {
  let service;
  let localStorageMock;

  beforeEach(() => {
    // 创建localStorage mock
    localStorageMock = {
      data: {},
      getItem: jest.fn((key) => localStorageMock.data[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock.data[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete localStorageMock.data[key];
      }),
      clear: jest.fn(() => {
        localStorageMock.data = {};
      })
    };

    // 模拟Date.now
    const mockDateNow = jest.fn(() => 1234567890);
    const DateMock = class extends Date {
      static now = mockDateNow;
      constructor() {
        super(1234567890);
      }
    };

    // 创建service实例并注入mock
    service = new DataService();
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'Date', {
      value: DateMock,
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'fetch', {
      value: jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_ELDERLY_HOMES
      }),
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('构造函数初始化', () => {
    expect(service.cacheKey).toBe('elderly_homes_cache');
    expect(service.cacheTimestampKey).toBe('elderly_homes_cache_timestamp');
  });

  test('getElderlyHomes返回模拟数据', async () => {
    const homes = await service.getElderlyHomes();
    expect(Array.isArray(homes)).toBe(true);
    expect(homes.length).toBeGreaterThan(0);
    expect(homes[0]).toHaveProperty('id');
    expect(homes[0]).toHaveProperty('name');
    expect(homes[0]).toHaveProperty('description');
  });

  test('getElderlyHomes返回完整数据', async () => {
    const homes = await service.getElderlyHomes();
    expect(homes.length).toBe(8);
    expect(homes[0]).toHaveProperty('id');
    expect(homes[0]).toHaveProperty('name');
    expect(homes[0]).toHaveProperty('address');
    expect(homes[0]).toHaveProperty('phone');
    expect(homes[0]).toHaveProperty('description');
    expect(homes[0]).toHaveProperty('priceRange');
    expect(homes[0]).toHaveProperty('services');
    expect(homes[0]).toHaveProperty('rating');
    expect(homes[0]).toHaveProperty('capacity');
  });

  test('getElderlyHomeById返回正确的项目', async () => {
    const home = await service.getElderlyHomeById(1);
    expect(home).toBeDefined();
    expect(home.id).toBe(1);
    expect(home.name).toBe('杭州市西湖区温馨养老院');

    const notFound = await service.getElderlyHomeById(999);
    expect(notFound).toBeNull();
  });

  test('getElderlyHomeById返回null当ID不存在', async () => {
    const notFound = await service.getElderlyHomeById(9999);
    expect(notFound).toBeNull();
  });

  test('searchElderlyHomes搜索功能', async () => {
    // 搜索名称
    const resultsByName = await service.searchElderlyHomes('杭州');
    expect(resultsByName.length).toBeGreaterThan(0);
    expect(resultsByName[0].name).toContain('杭州');

    // 搜索地址
    const resultsByAddress = await service.searchElderlyHomes('西湖区');
    expect(resultsByAddress.length).toBeGreaterThan(0);
    expect(resultsByAddress[0].address).toContain('西湖区');

    // 搜索描述
    const resultsByDescription = await service.searchElderlyHomes('环境优美');
    expect(resultsByDescription.length).toBeGreaterThan(0);

    // 搜索服务
    const resultsByService = await service.searchElderlyHomes('24小时护理');
    expect(resultsByService.length).toBeGreaterThan(0);

    // 空搜索返回所有
    const allResults = await service.searchElderlyHomes('');
    expect(allResults.length).toBe(8); // 模拟数据有8个项目
  });

  test('searchElderlyHomes不区分大小写', async () => {
    const results = await service.searchElderlyHomes('杭');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('杭');
  });

  test('searchElderlyHomes精确匹配', async () => {
    const results = await service.searchElderlyHomes('24小时护理');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].services).toContain('24小时护理');
  });

  test('getCities返回城市列表', () => {
    const cities = service.getCities();
    expect(Array.isArray(cities)).toBe(true);
    expect(cities.length).toBe(11); // 11个城市
    expect(cities).toContain('杭州市');
    expect(cities).toContain('宁波市');
    expect(cities).toContain('温州市');
  });

  test('getCities返回不重复的城市列表', () => {
    const cities = service.getCities();
    const uniqueCities = [...new Set(cities)];
    expect(cities.length).toBe(uniqueCities.length);
  });

  test('getServiceTypes返回服务类型列表', () => {
    const services = service.getServiceTypes();
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);
    expect(services).toContain('24小时护理');
    expect(services).toContain('康复训练');
  });

  test('getServiceTypes返回所有服务', async () => {
    const allServices = new Set();
    const homes = await service.getElderlyHomes();
    homes.forEach(home => {
      home.services.forEach(s => allServices.add(s));
    });

    const services = service.getServiceTypes();
    services.forEach(s => expect(allServices.has(s)).toBe(true));
  });

  test('fetchFromApi使用fetch函数', async () => {
    const originalFetch = global.fetch;
    await service.fetchFromApi();
    expect(global.fetch).toHaveBeenCalled();
    global.fetch = originalFetch;
  });

  // 筛选功能测试
  describe('筛选功能', () => {
    test('filterElderlyHomes按城市筛选', async () => {
      // 按城市"杭州市"筛选
      const filters = { city: '杭州市' };
      const results = await service.filterElderlyHomes(filters);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // 所有结果都应该包含"杭州市"
      results.forEach(home => {
        expect(home.address).toContain('杭州市');
      });
    });

    test('filterElderlyHomes按服务类型筛选', async () => {
      // 按服务"24小时护理"筛选
      const filters = { service: '24小时护理' };
      const results = await service.filterElderlyHomes(filters);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // 所有结果都应该包含"24小时护理"服务
      results.forEach(home => {
        expect(home.services).toContain('24小时护理');
      });
    });

    test('filterElderlyHomes按城市和服务组合筛选', async () => {
      // 按城市"杭州市"和服务"24小时护理"筛选
      const filters = { city: '杭州市', service: '24小时护理' };
      const results = await service.filterElderlyHomes(filters);

      expect(Array.isArray(results)).toBe(true);
      // 所有结果都应该包含"杭州市"地址和"24小时护理"服务
      results.forEach(home => {
        expect(home.address).toContain('杭州市');
        expect(home.services).toContain('24小时护理');
      });
    });

    test('filterElderlyHomes按评分筛选', async () => {
      // 按最小评分4.0筛选
      const filters = { minRating: 4.0 };
      const results = await service.filterElderlyHomes(filters);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // 所有结果的评分都应该>=4.0
      results.forEach(home => {
        expect(home.rating).toBeGreaterThanOrEqual(4.0);
      });
    });

    test('filterElderlyHomes空筛选返回所有数据', async () => {
      const filters = {};
      const results = await service.filterElderlyHomes(filters);
      const allHomes = await service.getElderlyHomes();

      expect(results.length).toBe(allHomes.length);
      expect(results).toEqual(allHomes);
    });

    test('filterElderlyHomes不匹配筛选条件返回空数组', async () => {
      const filters = { city: '不存在的城市' };
      const results = await service.filterElderlyHomes(filters);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});

// 测试USE_MOCK_DATA为false的情况
describe('DataService类 - 真实API模式', () => {
  let service;
  let localStorageMock;
  const customConfig = {
    USE_MOCK_DATA: false,
    API_BASE_URL: 'https://api.example.com/elderly-homes',
    CACHE_DURATION: 60,
    TIMEOUT: 10000
  };

  beforeEach(() => {
    // 创建localStorage mock
    localStorageMock = {
      data: {},
      getItem: jest.fn((key) => localStorageMock.data[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock.data[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete localStorageMock.data[key];
      }),
      clear: jest.fn(() => {
        localStorageMock.data = {};
      })
    };

    // 模拟Date.now
    const mockDateNow = jest.fn(() => 1234567890);
    const DateMock = class extends Date {
      static now = mockDateNow;
      constructor() {
        super(1234567890);
      }
    };

    // 创建service实例并注入mock和自定义配置
    service = new DataService(customConfig);
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'Date', {
      value: DateMock,
      writable: true,
      configurable: true
    });
    Object.defineProperty(global, 'fetch', {
      value: jest.fn().mockResolvedValue({
        ok: true,
        json: async () => MOCK_ELDERLY_HOMES
      }),
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('USE_MOCK_DATA为false时不使用模拟数据', async () => {
    // 清空缓存
    localStorageMock.data = {};

    const homes = await service.getElderlyHomes();
    expect(fetch).toHaveBeenCalled();
    expect(homes).toEqual(MOCK_ELDERLY_HOMES);
  });

  test('缓存命中时使用缓存数据', async () => {
    // 设置缓存数据
    const cachedHomes = [{ id: 99, name: '缓存测试养老院' }];
    localStorageMock.data[service.cacheKey] = JSON.stringify(cachedHomes);
    localStorageMock.data[service.cacheTimestampKey] = Date.now().toString();

    const homes = await service.getElderlyHomes();
    expect(fetch).not.toHaveBeenCalled(); // 不应调用API
    expect(homes).toEqual(cachedHomes);
  });

  test('缓存过期时重新获取数据', async () => {
    // 设置过期的缓存数据
    const cachedHomes = [{ id: 99, name: '过期缓存' }];
    localStorageMock.data[service.cacheKey] = JSON.stringify(cachedHomes);
    // 设置时间戳为2小时前（超过60分钟缓存时间）
    localStorageMock.data[service.cacheTimestampKey] = (Date.now() - 2 * 60 * 60 * 1000).toString();

    const homes = await service.getElderlyHomes();
    expect(fetch).toHaveBeenCalled(); // 应该调用API
    expect(homes).toEqual(MOCK_ELDERLY_HOMES);
    // 缓存应该被更新
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      service.cacheKey,
      JSON.stringify(MOCK_ELDERLY_HOMES)
    );
  });

  test('API请求失败时使用模拟数据作为降级', async () => {
    // 模拟fetch失败
    global.fetch = jest.fn().mockRejectedValue(new Error('网络错误'));

    const homes = await service.getElderlyHomes();
    expect(homes).toEqual(MOCK_ELDERLY_HOMES);
  });

  test('API返回HTTP错误时使用模拟数据作为降级', async () => {
    // 模拟fetch返回HTTP错误
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: '服务器错误' })
    });

    const homes = await service.getElderlyHomes();
    expect(homes).toEqual(MOCK_ELDERLY_HOMES);
  });

  test('缓存读取失败时回退到API', async () => {
    // 模拟localStorage.getItem抛出错误
    localStorageMock.getItem = jest.fn(() => {
      throw new Error('读取失败');
    });

    const homes = await service.getElderlyHomes();
    expect(fetch).toHaveBeenCalled(); // 应该调用API
    expect(homes).toEqual(MOCK_ELDERLY_HOMES);
  });

  test('缓存写入失败时不抛出错误', async () => {
    // 模拟localStorage.setItem抛出错误
    localStorageMock.setItem = jest.fn(() => {
      throw new Error('写入失败');
    });

    // 应该不抛出错误
    await expect(service.getElderlyHomes()).resolves.toEqual(MOCK_ELDERLY_HOMES);
  });
});
