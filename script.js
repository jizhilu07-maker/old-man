/**
 * 浙江省养老院目录 - 主JavaScript文件
 */

// 全局状态
const AppState = {
    currentHomes: [],      // 当前显示的养老院列表
    isLoading: false,      // 加载状态
    currentDetailId: null, // 当前查看的养老院ID
    amap: null,           // 高德地图实例
    amapMarker: null      // 高德地图标记
};

// DOM元素引用
const DOM = {
    elderlyList: document.getElementById('elderly-list'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    totalCount: document.getElementById('total-count'),
    loading: document.getElementById('loading'),
    detailModal: document.getElementById('detail-modal'),
    closeModal: document.getElementById('close-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    // 筛选器元素
    cityFilter: document.getElementById('city-filter'),
    serviceFilter: document.getElementById('service-filter'),
    ratingFilter: document.getElementById('rating-filter'),
    clearFiltersBtn: document.getElementById('clear-filters'),
    filtersSection: document.getElementById('filters-section')
};

/**
 * HTML转义函数，防止XSS攻击
 * @param {string} str 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 动态加载高德地图API
 * @returns {Promise<boolean>} 是否加载成功
 */
function loadAmap() {
    return new Promise((resolve, reject) => {
        // 如果已经加载，直接返回成功
        if (typeof AMap !== 'undefined') {
            console.log('高德地图API已加载');
            resolve(true);
            return;
        }

        // 获取API密钥 - 优先级：全局ENV变量 > api-config.js > 默认值
        let apiKey = '438511649cf264b6bdf538592e4bbe0e'; // 默认测试密钥
        let keySource = '默认测试密钥';

        // 1. 尝试从全局ENV变量读取
        if (window.ENV && window.ENV.AMAP_API_KEY) {
            apiKey = window.ENV.AMAP_API_KEY;
            keySource = '全局ENV变量';
            console.log(`使用${keySource}中的高德地图API密钥`);
        }
        // 2. 尝试从dataService配置读取
        else if (window.dataService && dataService.config && dataService.config.AMAP_API_KEY) {
            apiKey = dataService.config.AMAP_API_KEY;
            keySource = 'dataService配置';
            console.log(`使用${keySource}中的高德地图API密钥`);
        }
        // 3. 尝试从API_CONFIG读取（如果已加载）
        else if (typeof API_CONFIG !== 'undefined' && API_CONFIG.AMAP_API_KEY) {
            apiKey = API_CONFIG.AMAP_API_KEY;
            keySource = 'API_CONFIG';
            console.log(`使用${keySource}中的高德地图API密钥`);
        }

        // 如果使用默认测试密钥，记录警告
        if (keySource === '默认测试密钥') {
            console.warn('⚠️ 使用默认测试API密钥，地图功能可能受限。建议设置AMAP_API_KEY环境变量。');
        }

        // 动态创建script标签加载高德地图
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
        script.async = true;

        script.onload = () => {
            console.log('高德地图API加载成功');
            resolve(true);
        };

        script.onerror = (error) => {
            console.error('高德地图API加载失败:', error);
            reject(new Error('高德地图API加载失败，请检查API密钥和网络连接'));
        };

        document.head.appendChild(script);
    });
}

/**
 * 初始化应用
 */
async function initApp() {
    console.log('初始化养老院目录应用...');

    // 绑定事件监听器
    bindEvents();

    // 初始化筛选器
    await initFilters();

    // 加载数据
    await loadElderlyHomes();

    // 初始化高德地图（在详情模态框中初始化）
    console.log('应用初始化完成');
}

/**
 * 绑定事件监听器
 */
function bindEvents() {
    // 搜索按钮点击事件
    DOM.searchBtn.addEventListener('click', handleSearch);

    // 搜索输入框回车事件
    DOM.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 搜索输入框实时搜索（防抖）
    let searchTimeout;
    DOM.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch();
        }, 500);
    });

    // 筛选器变更事件
    if (DOM.cityFilter) {
        DOM.cityFilter.addEventListener('change', handleSearch);
    }
    if (DOM.serviceFilter) {
        DOM.serviceFilter.addEventListener('change', handleSearch);
    }
    if (DOM.ratingFilter) {
        DOM.ratingFilter.addEventListener('change', handleSearch);
    }

    // 清除筛选按钮
    if (DOM.clearFiltersBtn) {
        DOM.clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // 关闭模态框事件
    DOM.closeModal.addEventListener('click', closeDetailModal);
    DOM.detailModal.addEventListener('click', (e) => {
        if (e.target === DOM.detailModal) {
            closeDetailModal();
        }
    });

    // 键盘ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.detailModal.classList.contains('show')) {
            closeDetailModal();
        }
    });
}

/**
 * 加载养老院数据
 */
async function loadElderlyHomes() {
    setLoading(true);

    try {
        const homes = await dataService.getElderlyHomes();
        AppState.currentHomes = homes;

        updateElderlyList(homes);
        updateResultCount(homes.length);
    } catch (error) {
        console.error('加载养老院数据失败:', error);
        showError('加载数据失败，请稍后重试');
    } finally {
        setLoading(false);
    }
}

/**
 * 处理搜索
 */
async function handleSearch() {
    const query = DOM.searchInput.value.trim();

    // 获取筛选条件
    const filters = {};
    console.log('handleSearch called, query:', query, 'filters initial:', filters);

    if (DOM.cityFilter && DOM.cityFilter.value) {
        filters.city = DOM.cityFilter.value;
    }

    if (DOM.serviceFilter && DOM.serviceFilter.value) {
        filters.service = DOM.serviceFilter.value;
    }

    if (DOM.ratingFilter && DOM.ratingFilter.value && DOM.ratingFilter.value !== '0') {
        filters.minRating = parseFloat(DOM.ratingFilter.value);
    }

    console.log('Filters after collection:', filters);

    // 如果既没有搜索词也没有筛选条件，且当前无数据，则重新加载所有数据
    if (!query && Object.keys(filters).length === 0 && AppState.currentHomes.length === 0) {
        await loadElderlyHomes();
        return;
    }

    setLoading(true);

    try {
        // 先进行文本搜索
        let results = await dataService.searchElderlyHomes(query);

        // 然后应用筛选条件
        if (Object.keys(filters).length > 0) {
            results = await dataService.filterElderlyHomes(filters, results);
        }

        AppState.currentHomes = results;

        updateElderlyList(results);
        updateResultCount(results.length);
    } catch (error) {
        console.error('搜索失败:', error);
        showError('搜索失败，请稍后重试');
    } finally {
        setLoading(false);
    }
}

/**
 * 更新养老院列表显示
 * @param {Array} homes 养老院数组
 */
function updateElderlyList(homes) {
    if (homes.length === 0) {
        DOM.elderlyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>未找到相关养老院</h3>
                <p>请尝试其他搜索关键词</p>
            </div>
        `;
        return;
    }

    const cardsHTML = homes.map(home => createElderlyCard(home)).join('');
    DOM.elderlyList.innerHTML = cardsHTML;

    // 为每个卡片添加点击事件
    homes.forEach(home => {
        const card = document.querySelector(`[data-id="${home.id}"]`);
        if (card) {
            card.addEventListener('click', () => showDetailModal(home.id));

            // 详情按钮点击事件
            const detailBtn = card.querySelector('.view-details');
            if (detailBtn) {
                detailBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    showDetailModal(home.id);
                });
            }
        }
    });
}

/**
 * 创建养老院卡片HTML
 * @param {Object} home 养老院对象
 * @returns {string} 卡片HTML
 */
function createElderlyCard(home) {
    // 转义所有用户数据，防止XSS攻击
    const escapedName = escapeHtml(home.name);
    const escapedAddress = escapeHtml(home.address);
    const escapedPhone = escapeHtml(home.phone);
    const escapedDescription = escapeHtml(home.description);
    const escapedPriceRange = escapeHtml(home.priceRange);
    const escapedRating = escapeHtml(home.rating.toString());

    // 生成服务标签HTML（服务名称也需要转义）
    const servicesHTML = home.services
        .slice(0, 3) // 只显示前3个服务
        .map(service => `<span class="service-tag">${escapeHtml(service)}</span>`)
        .join('');

    // 生成星级评分HTML
    const starsHTML = generateStarRating(home.rating);

    return `
        <div class="elderly-card" data-id="${home.id}">
            <div class="card-image">
                <i class="fas fa-home"></i>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${escapedName}</h3>
                        <div class="card-address">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapedAddress}</span>
                        </div>
                    </div>
                    <div class="card-price">${escapedPriceRange}</div>
                </div>

                <div class="card-info">
                    <div class="card-phone">
                        <i class="fas fa-phone"></i>
                        <span>${escapedPhone}</span>
                    </div>
                </div>

                <p class="card-description">${escapedDescription}</p>

                <div class="card-services">
                    ${servicesHTML}
                    ${home.services.length > 3 ? '<span class="service-tag">...</span>' : ''}
                </div>

                <div class="card-footer">
                    <div class="card-rating">
                        ${starsHTML}
                        <span>${escapedRating}</span>
                    </div>
                    <button class="view-details">查看详情</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 生成星级评分HTML
 * @param {number} rating 评分（0-5）
 * @returns {string} 星星HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';

    // 满星
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    // 半星
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    // 空星
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

/**
 * 显示详情模态框
 * @param {number} id 养老院ID
 */
async function showDetailModal(id) {
    setLoading(true, '加载详情...');

    try {
        const home = await dataService.getElderlyHomeById(id);
        if (!home) {
            throw new Error('未找到该养老院');
        }

        AppState.currentDetailId = id;
        updateDetailModal(home);
        DOM.detailModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // 防止背景滚动

        // 初始化地图
        await initAmapMap(home.coordinates, home.name);
    } catch (error) {
        console.error('加载详情失败:', error);
        showError('加载详情失败');
    } finally {
        setLoading(false);
    }
}

/**
 * 更新详情模态框内容
 * @param {Object} home 养老院对象
 */
function updateDetailModal(home) {
    DOM.modalTitle.textContent = home.name;

    // 转义所有用户数据，防止XSS攻击
    const escapedAddress = escapeHtml(home.address);
    const escapedPhone = escapeHtml(home.phone);
    const escapedPriceRange = escapeHtml(home.priceRange);
    const escapedRating = escapeHtml(home.rating.toString());
    const escapedCapacity = escapeHtml(home.capacity.toString());
    const escapedEstablishedYear = escapeHtml(home.establishedYear.toString());
    const escapedDescription = escapeHtml(home.description);

    // 生成服务标签HTML
    const servicesHTML = home.services
        .map(service => `<span class="service-tag-large">${escapeHtml(service)}</span>`)
        .join('');

    // 生成图片HTML（模拟）
    const imagesHTML = home.images && home.images.length > 0
        ? home.images.map((img, index) => `
            <div class="detail-image">
                <i class="fas fa-image"></i>
            </div>
        `).join('')
        : `
            <div class="detail-image">
                <i class="fas fa-home"></i>
                <p>暂无图片</p>
            </div>
        `;

    // 生成设施HTML
    const featuresHTML = home.features
        ? home.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join('')
        : '<li>暂无设施信息</li>';

    DOM.modalBody.innerHTML = `
        <div class="detail-section">
            <h4><i class="fas fa-info-circle"></i> 基本信息</h4>
            <div class="detail-info-grid">
                <div class="detail-info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <strong>地址：</strong>
                        <p>${escapedAddress}</p>
                    </div>
                </div>
                <div class="detail-info-item">
                    <i class="fas fa-phone"></i>
                    <div>
                        <strong>电话：</strong>
                        <p>${escapedPhone}</p>
                    </div>
                </div>
                <div class="detail-info-item">
                    <i class="fas fa-yen-sign"></i>
                    <div>
                        <strong>价格范围：</strong>
                        <p>${escapedPriceRange}</p>
                    </div>
                </div>
                <div class="detail-info-item">
                    <i class="fas fa-star"></i>
                    <div>
                        <strong>评分：</strong>
                        <p>${escapedRating} / 5.0</p>
                    </div>
                </div>
                <div class="detail-info-item">
                    <i class="fas fa-user-friends"></i>
                    <div>
                        <strong>容量：</strong>
                        <p>${escapedCapacity} 人</p>
                    </div>
                </div>
                <div class="detail-info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <strong>成立年份：</strong>
                        <p>${escapedEstablishedYear}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-file-alt"></i> 详细描述</h4>
            <p>${escapedDescription}</p>
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-concierge-bell"></i> 服务项目</h4>
            <div class="detail-services">
                ${servicesHTML}
            </div>
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-th-large"></i> 设施配套</h4>
            <ul style="padding-left: 1.5rem; line-height: 1.8;">
                ${featuresHTML}
            </ul>
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-images"></i> 环境图片</h4>
            <div class="detail-images">
                ${imagesHTML}
            </div>
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-map"></i> 地理位置</h4>
            <div id="detail-map" style="height: 300px;"></div>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
                <i class="fas fa-info-circle"></i> 地图显示养老院大致位置
            </p>
        </div>
    `;
}

/**
 * 初始化高德地图
 * @param {Array} coordinates 坐标数组 [经度, 纬度]
 * @param {string} title 标记标题
 */
async function initAmapMap(coordinates, title) {
    // 清除之前的地图实例
    if (AppState.amapMarker) {
        AppState.amapMarker.setMap(null);
        AppState.amapMarker = null;
    }

    if (AppState.amap) {
        AppState.amap.destroy();
        AppState.amap = null;
    }

    // 检查高德地图API是否加载，如果没有则尝试加载
    if (typeof AMap === 'undefined') {
        console.log('高德地图API未加载，尝试动态加载...');

        try {
            // 显示加载状态
            const mapContainer = document.getElementById('detail-map');
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                        <div style="text-align: center;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>正在加载地图...</p>
                        </div>
                    </div>
                `;
            }

            await loadAmap();
            console.log('高德地图API加载成功，继续初始化地图');
        } catch (error) {
            console.error('高德地图API加载失败:', error);
            const mapContainer = document.getElementById('detail-map');
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                        <div style="text-align: center;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p>地图加载失败</p>
                            <p style="font-size: 0.9rem;">${error.message || '请检查API密钥和网络连接'}</p>
                        </div>
                    </div>
                `;
            }
            return;
        }
    }

    // 初始化地图
    try {
        const mapContainer = document.getElementById('detail-map');
        if (!mapContainer) return;

        AppState.amap = new AMap.Map('detail-map', {
            zoom: 17,  // 增加缩放级别，显示更多细节
            center: coordinates,
            viewMode: '2D',
            resizeEnable: true,
            features: ['bg', 'road', 'building', 'point'],  // 启用更多地图要素
            mapStyle: 'amap://styles/normal'  // 使用标准地图样式
        });

        // 添加标记
        AppState.amapMarker = new AMap.Marker({
            position: coordinates,
            title: title,
            map: AppState.amap
        });

        // 添加地图控件
        // 1. 工具栏控件（缩放、定位等）
        const toolBar = new AMap.ToolBar({
            position: 'RT'  // 右上角
        });
        AppState.amap.addControl(toolBar);

        // 2. 比例尺控件
        const scale = new AMap.Scale({
            position: 'LB'  // 左下角
        });
        AppState.amap.addControl(scale);

        // 3. 地图类型切换控件
        const mapType = new AMap.MapType({
            defaultType: 0,  // 默认显示普通地图
            position: 'RT'   // 右上角，在工具栏下方
        });
        AppState.amap.addControl(mapType);

        // 添加信息窗口
        const infoWindow = new AMap.InfoWindow({
            content: `<div style="padding: 0.5rem;">
                <strong>${escapeHtml(title)}</strong>
                <p style="margin: 0.3rem 0 0; font-size: 0.9rem;">点击查看详情</p>
            </div>`,
            offset: new AMap.Pixel(0, -30)
        });

        infoWindow.open(AppState.amap, coordinates);

    } catch (error) {
        console.error('初始化高德地图失败:', error);
        document.getElementById('detail-map').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>地图初始化失败</p>
                    <p style="font-size: 0.9rem;">${error.message}</p>
                </div>
            </div>
        `;
    }
}

/**
 * 清除所有筛选条件
 */
function clearFilters() {
    if (DOM.cityFilter) DOM.cityFilter.value = '';
    if (DOM.serviceFilter) DOM.serviceFilter.value = '';
    if (DOM.ratingFilter) DOM.ratingFilter.value = '0';

    // 触发搜索以更新结果
    handleSearch();
}

/**
 * 初始化筛选器
 */
async function initFilters() {
    try {
        // 获取城市列表
        const cities = dataService.getCities();
        if (DOM.cityFilter) {
            // 清空现有选项（保留"全部城市"选项）
            while (DOM.cityFilter.options.length > 1) {
                DOM.cityFilter.remove(1);
            }

            // 添加城市选项
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                DOM.cityFilter.appendChild(option);
            });
        }

        // 获取服务类型列表
        const services = dataService.getServiceTypes();
        if (DOM.serviceFilter) {
            // 清空现有选项（保留"全部服务"选项）
            while (DOM.serviceFilter.options.length > 1) {
                DOM.serviceFilter.remove(1);
            }

            // 添加服务选项
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service;
                option.textContent = service;
                DOM.serviceFilter.appendChild(option);
            });
        }

        console.log('筛选器初始化完成');
    } catch (error) {
        console.error('初始化筛选器失败:', error);
    }
}

/**
 * 关闭详情模态框
 */
function closeDetailModal() {
    DOM.detailModal.classList.remove('show');
    document.body.style.overflow = 'auto'; // 恢复滚动

    // 清理地图实例
    if (AppState.amapMarker) {
        AppState.amapMarker.setMap(null);
        AppState.amapMarker = null;
    }

    if (AppState.amap) {
        AppState.amap.destroy();
        AppState.amap = null;
    }

    AppState.currentDetailId = null;
}

/**
 * 更新结果计数
 * @param {number} count 结果数量
 */
function updateResultCount(count) {
    DOM.totalCount.textContent = count;
}

/**
 * 设置加载状态
 * @param {boolean} isLoading 是否正在加载
 * @param {string} message 加载消息
 */
function setLoading(isLoading, message = '正在加载...') {
    AppState.isLoading = isLoading;

    if (isLoading) {
        DOM.loading.style.display = 'flex';
        DOM.loading.querySelector('p').textContent = message;
    } else {
        DOM.loading.style.display = 'none';
    }
}

/**
 * 显示错误消息
 * @param {string} message 错误消息
 */
function showError(message) {
    // 创建错误消息元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 100px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        ">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-exclamation-circle"></i>
                <strong>错误</strong>
            </div>
            <p style="margin: 0.5rem 0 0; font-size: 0.95rem;">${escapeHtml(message)}</p>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // 3秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }
    }, 3000);
}

/**
 * 添加错误消息的CSS动画
 */
function addErrorStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}


// 添加错误消息样式
addErrorStyles();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initApp().catch(error => {
        console.error('应用初始化失败:', error);
        showError('应用初始化失败，请刷新页面重试');
    });
});

// 导出全局函数（用于调试）
window.appDebug = {
    reloadData: loadElderlyHomes,
    showDetail: showDetailModal,
    getState: () => AppState,
    getDataService: () => dataService,
    initFilters: initFilters,
    clearFilters: clearFilters,
    handleSearch: handleSearch,
    updateElderlyList: updateElderlyList,
    // 为测试添加额外函数
    initAmapMap: initAmapMap,
    showError: showError,
    initApp: initApp,
    bindEvents: bindEvents,
    closeDetailModal: closeDetailModal,
    escapeHtml: escapeHtml
};