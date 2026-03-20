/**
 * 浙江省养老院目录 - API配置和数据获取
 * 开发阶段使用模拟数据
 */

// API配置
const API_CONFIG = {
    // 模拟数据模式
    USE_MOCK_DATA: true,

    // 真实API端点（开发完成后使用）
    API_BASE_URL: 'https://api.example.com/elderly-homes',

    // 高德地图API密钥（需要替换为真实密钥）
    AMAP_API_KEY: '438511649cf264b6bdf538592e4bbe0e',

    // 数据缓存设置（单位：分钟）
    CACHE_DURATION: 60,

    // 请求超时时间（单位：毫秒）
    TIMEOUT: 10000
};

// 模拟数据 - 浙江省养老院信息
const MOCK_ELDERLY_HOMES = [
    {
        id: 1,
        name: '杭州市西湖区温馨养老院',
        address: '浙江省杭州市西湖区文三路123号',
        phone: '0571-88881111',
        description: '位于西湖风景区附近，环境优美，设施齐全，提供专业护理服务。',
        priceRange: '3000-5000元/月',
        images: ['elderly1.jpg', 'elderly2.jpg'],
        services: ['24小时护理', '康复训练', '营养膳食', '娱乐活动', '医疗支持'],
        coordinates: [120.153576, 30.287459], // 西湖区坐标
        rating: 4.5,
        capacity: 120,
        establishedYear: 2010,
        features: ['花园', '健身房', '阅览室', '医务室']
    },
    {
        id: 2,
        name: '宁波市海曙区安康敬老院',
        address: '浙江省宁波市海曙区中山西路456号',
        phone: '0574-88882222',
        description: '市中心便利位置，交通方便，提供专业的老年护理和康复服务。',
        priceRange: '2800-4500元/月',
        images: ['elderly3.jpg', 'elderly4.jpg'],
        services: ['日间照料', '康复理疗', '心理咨询', '文化娱乐', '健康监测'],
        coordinates: [121.549792, 29.868388], // 海曙区坐标
        rating: 4.3,
        capacity: 80,
        establishedYear: 2015,
        features: ['餐厅', '活动室', '理疗室', '停车场']
    },
    {
        id: 3,
        name: '温州市鹿城区阳光养老中心',
        address: '浙江省温州市鹿城区车站大道789号',
        phone: '0577-88883333',
        description: '现代化养老设施，专业医疗团队，注重老年人生活质量提升。',
        priceRange: '3500-6000元/月',
        images: ['elderly5.jpg', 'elderly6.jpg'],
        services: ['专业护理', '医疗保健', '康复训练', '餐饮服务', '社交活动'],
        coordinates: [120.672111, 28.013169], // 鹿城区坐标
        rating: 4.7,
        capacity: 150,
        establishedYear: 2018,
        features: ['游泳池', '棋牌室', '电影院', '康复中心']
    },
    {
        id: 4,
        name: '绍兴市越城区颐养家园',
        address: '浙江省绍兴市越城区解放路101号',
        phone: '0575-88884444',
        description: '传统与现代结合的养老机构，注重文化传承和身心健康。',
        priceRange: '2500-4000元/月',
        images: ['elderly7.jpg', 'elderly8.jpg'],
        services: ['传统养生', '中医调理', '书画培训', '戏曲欣赏', '园艺疗法'],
        coordinates: [120.582112, 30.013911], // 越城区坐标
        rating: 4.4,
        capacity: 100,
        establishedYear: 2012,
        features: ['中医馆', '书画室', '戏曲舞台', '中药园']
    },
    {
        id: 5,
        name: '金华市婺城区金色年华养老院',
        address: '浙江省金华市婺城区双龙南街202号',
        phone: '0579-88885555',
        description: '生态宜居环境，专业护理团队，提供全方位养老服务。',
        priceRange: '3200-5500元/月',
        images: ['elderly9.jpg', 'elderly10.jpg'],
        services: ['生态养老', '健康管理', '心理咨询', '兴趣班', '外出活动'],
        coordinates: [119.649506, 29.089524], // 婺城区坐标
        rating: 4.6,
        capacity: 90,
        establishedYear: 2016,
        features: ['生态农场', '健康步道', '心理咨询室', '手工坊']
    },
    {
        id: 6,
        name: '嘉兴市南湖区幸福老年公寓',
        address: '浙江省嘉兴市南湖区中环南路303号',
        phone: '0573-88886666',
        description: '高品质养老服务，智能化管理系统，温馨家庭式环境。',
        priceRange: '4000-7000元/月',
        images: ['elderly11.jpg', 'elderly12.jpg'],
        services: ['智能监护', '专业医疗', '康复护理', '营养配餐', '文化娱乐'],
        coordinates: [120.755486, 30.746129], // 南湖区坐标
        rating: 4.8,
        capacity: 200,
        establishedYear: 2020,
        features: ['智能监控', '医疗中心', '营养餐厅', '多功能厅']
    },
    {
        id: 7,
        name: '湖州市吴兴区安享晚年中心',
        address: '浙江省湖州市吴兴区青铜路404号',
        phone: '0572-88887777',
        description: '湖景养老环境，专业康复设施，提供个性化护理方案。',
        priceRange: '3800-6500元/月',
        images: ['elderly13.jpg', 'elderly14.jpg'],
        services: ['湖景养老', '康复治疗', '心理疏导', '艺术疗法', '健康讲座'],
        coordinates: [120.0883, 30.8933], // 吴兴区坐标
        rating: 4.5,
        capacity: 110,
        establishedYear: 2014,
        features: ['湖景房', '康复中心', '艺术工作室', '讲座厅']
    },
    {
        id: 8,
        name: '台州市椒江区康乐养老院',
        address: '浙江省台州市椒江区市府大道505号',
        phone: '0576-88888888',
        description: '滨海城市养老机构，空气清新，提供海滨休闲养老服务。',
        priceRange: '3000-5200元/月',
        images: ['elderly15.jpg', 'elderly16.jpg'],
        services: ['海滨养老', '呼吸疗法', '海鲜膳食', '海滨活动', '健康检测'],
        coordinates: [121.420757, 28.655911], // 椒江区坐标
        rating: 4.2,
        capacity: 95,
        establishedYear: 2017,
        features: ['海滨观景', '海鲜餐厅', '呼吸治疗室', '活动广场']
    }
];

/**
 * 数据获取类
 */
class DataService {
    constructor(config = API_CONFIG) {
        this.config = config;
        this.cacheKey = 'elderly_homes_cache';
        this.cacheTimestampKey = 'elderly_homes_cache_timestamp';
    }

    /**
     * 获取养老院数据
     * @returns {Promise<Array>} 养老院数据数组
     */
    async getElderlyHomes() {
        // 如果使用模拟数据
        if (this.config.USE_MOCK_DATA) {
            console.log('使用模拟数据');
            return this.simulateApiCall(MOCK_ELDERLY_HOMES);
        }

        // 检查缓存
        const cachedData = this.getCachedData();
        if (cachedData) {
            console.log('使用缓存数据');
            return cachedData;
        }

        // 从API获取数据
        try {
            const data = await this.fetchFromApi();
            this.cacheData(data);
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            // API失败时使用模拟数据作为fallback
            console.log('API失败，使用模拟数据');
            return MOCK_ELDERLY_HOMES;
        }
    }

    /**
     * 模拟API调用（延迟返回）
     * @param {Array} data 要返回的数据
     * @returns {Promise<Array>} 延迟后返回的数据
     */
    simulateApiCall(data) {
        return new Promise((resolve) => {
            // 模拟网络延迟
            setTimeout(() => {
                resolve(data);
            }, 800);
        });
    }

    /**
     * 从API获取数据
     * @returns {Promise<Array>} API返回的数据
     */
    async fetchFromApi() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);

        try {
            const response = await fetch(this.config.API_BASE_URL, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 获取缓存数据
     * @returns {Array|null} 缓存的数据，如果过期或不存在则返回null
     */
    getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            const timestamp = localStorage.getItem(this.cacheTimestampKey);

            if (!cached || !timestamp) {
                return null;
            }

            const now = Date.now();
            const cacheTime = parseInt(timestamp, 10);
            const cacheAge = (now - cacheTime) / (1000 * 60); // 转换为分钟

            if (cacheAge > this.config.CACHE_DURATION) {
                // 缓存过期
                localStorage.removeItem(this.cacheKey);
                localStorage.removeItem(this.cacheTimestampKey);
                return null;
            }

            return JSON.parse(cached);
        } catch (error) {
            console.error('读取缓存失败:', error);
            return null;
        }
    }

    /**
     * 缓存数据
     * @param {Array} data 要缓存的数据
     */
    cacheData(data) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
            localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
        } catch (error) {
            console.error('缓存数据失败:', error);
        }
    }

    /**
     * 根据ID获取单个养老院详情
     * @param {number} id 养老院ID
     * @returns {Promise<Object|null>} 养老院详情对象
     */
    async getElderlyHomeById(id) {
        const homes = await this.getElderlyHomes();
        return homes.find(home => home.id === id) || null;
    }

    /**
     * 搜索养老院
     * @param {string} query 搜索关键词
     * @returns {Promise<Array>} 搜索结果
     */
    async searchElderlyHomes(query) {
        const homes = await this.getElderlyHomes();

        if (!query || query.trim() === '') {
            return homes;
        }

        const searchTerm = query.toLowerCase().trim();

        return homes.filter(home => {
            return (
                home.name.toLowerCase().includes(searchTerm) ||
                home.address.toLowerCase().includes(searchTerm) ||
                home.description.toLowerCase().includes(searchTerm) ||
                home.services.some(service =>
                    service.toLowerCase().includes(searchTerm)
                )
            );
        });
    }

    /**
     * 获取浙江省城市列表（用于可能的筛选功能）
     * @returns {Array} 城市列表
     */
    getCities() {
        return [
            '杭州市', '宁波市', '温州市', '绍兴市',
            '金华市', '嘉兴市', '湖州市', '台州市',
            '衢州市', '舟山市', '丽水市'
        ];
    }

    /**
     * 获取服务类型列表（用于可能的筛选功能）
     * @returns {Array} 服务类型列表
     */
    getServiceTypes() {
        const allServices = new Set();
        MOCK_ELDERLY_HOMES.forEach(home => {
            home.services.forEach(service => allServices.add(service));
        });
        return Array.from(allServices);
    }

    /**
     * 筛选养老院
     * @param {Object} filters 筛选条件对象
     * @param {string} [filters.city] 城市名称（如"杭州市"）
     * @param {string} [filters.service] 服务类型（如"24小时护理"）
     * @param {number} [filters.minRating] 最小评分（0-5）
     * @param {Array} [homes] 可选：要筛选的数据数组，如果未提供则从getElderlyHomes获取
     * @returns {Promise<Array>} 筛选结果
     */
    async filterElderlyHomes(filters = {}, homes = null) {
        // 如果未提供数据，则获取数据
        if (!homes) {
            homes = await this.getElderlyHomes();
        }

        // 如果没有筛选条件，返回所有数据
        if (!filters || Object.keys(filters).length === 0) {
            return homes;
        }

        return homes.filter(home => {
            // 城市筛选
            if (filters.city && !home.address.includes(filters.city)) {
                return false;
            }

            // 服务筛选
            if (filters.service && !home.services.includes(filters.service)) {
                return false;
            }

            // 评分筛选
            if (filters.minRating !== undefined && home.rating < filters.minRating) {
                return false;
            }

            return true;
        });
    }
}

// 导出DataService类和配置（用于测试）
// 只在Node.js环境下使用exports
if (typeof exports !== 'undefined') {
    exports.DataService = DataService;
    exports.MOCK_ELDERLY_HOMES = MOCK_ELDERLY_HOMES;
    exports.API_CONFIG = API_CONFIG;
}

// 创建全局数据服务实例
const dataService = new DataService(API_CONFIG);

// 在浏览器环境中将dataService暴露为全局变量
if (typeof window !== 'undefined') {
    window.dataService = dataService;
}