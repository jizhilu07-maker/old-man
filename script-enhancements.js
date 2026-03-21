// 温馨家园 - 增强交互脚本
// 为养老院目录网站添加现代交互功能

document.addEventListener('DOMContentLoaded', function() {
    console.log('温馨家园增强脚本加载完成');

    // 1. 移动端菜单切换
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            mainNav.classList.toggle('mobile-open');

            // 切换图标
            const icon = this.querySelector('i');
            if (icon) {
                if (mainNav.classList.contains('mobile-open')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // 2. 搜索标签点击事件
    const searchTags = document.querySelectorAll('.tag');
    const searchInput = document.getElementById('search-input');

    searchTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const searchText = this.getAttribute('data-search');
            if (searchInput && searchText) {
                searchInput.value = searchText;
                searchInput.focus();

                // 触发搜索（如果存在搜索函数）
                if (window.AppState && window.AppState.filterElderlyHomes) {
                    window.AppState.filterElderlyHomes();
                }
            }
        });
    });

    // 3. 视图切换功能
    const viewButtons = document.querySelectorAll('.view-btn');
    const elderlyList = document.getElementById('elderly-list');

    if (viewButtons.length > 0 && elderlyList) {
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const view = this.getAttribute('data-view');

                // 更新按钮状态
                viewButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // 切换视图类
                elderlyList.className = 'elderly-list';
                elderlyList.classList.add(`view-${view}`);
            });
        });
    }

    // 4. 滚动到顶部按钮
    const scrollTopBtn = document.querySelector('.scroll-top');

    if (scrollTopBtn) {
        // 显示/隐藏按钮
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        // 点击滚动到顶部
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 5. 模态框关闭增强
    const closeModalBtn = document.getElementById('close-modal');
    const modalOverlay = document.getElementById('detail-modal');

    if (closeModalBtn && modalOverlay) {
        // 点击模态框外部关闭
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.setAttribute('aria-hidden', 'true');
                this.style.display = 'none';
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalOverlay.getAttribute('aria-hidden') === 'false') {
                modalOverlay.setAttribute('aria-hidden', 'true');
                modalOverlay.style.display = 'none';
            }
        });
    }

    // 6. 筛选器应用按钮
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            // 触发筛选功能
            if (window.AppState && window.AppState.filterElderlyHomes) {
                window.AppState.filterElderlyHomes();
            }

            // 添加视觉反馈
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 300);
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // 清空筛选器
            const filters = ['city-filter', 'service-filter', 'rating-filter'];
            filters.forEach(id => {
                const filter = document.getElementById(id);
                if (filter) filter.value = '';
            });

            // 触发筛选
            if (window.AppState && window.AppState.filterElderlyHomes) {
                window.AppState.filterElderlyHomes();
            }
        });
    }

    // 7. 搜索建议功能（简化版）
    if (searchInput) {
        let debounceTimer;

        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = this.value.trim();
                if (query.length >= 2) {
                    showSearchSuggestions(query);
                }
            }, 300);
        });

        // 点击外部隐藏建议
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-input-wrapper')) {
                hideSearchSuggestions();
            }
        });
    }

    // 8. 卡片悬停效果增强
    const elderlyCards = document.querySelectorAll('.elderly-card');
    elderlyCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 9. 响应式导航样式
    function updateNavForMobile() {
        if (window.innerWidth <= 768) {
            // 移动端样式
            if (mainNav) {
                mainNav.style.position = 'absolute';
                mainNav.style.top = '100%';
                mainNav.style.left = '0';
                mainNav.style.right = '0';
                mainNav.style.background = 'linear-gradient(135deg, rgba(230, 126, 97, 0.98), rgba(78, 205, 196, 0.98))';
                mainNav.style.backdropFilter = 'blur(10px)';
                mainNav.style.padding = '1rem';
                mainNav.style.borderRadius = '0 0 var(--radius-lg) var(--radius-lg)';
                mainNav.style.boxShadow = 'var(--shadow-lg)';

                if (navList) {
                    navList.style.flexDirection = 'column';
                    navList.style.gap = '0.5rem';
                }
            }
        } else {
            // 桌面端样式
            if (mainNav) {
                mainNav.style.position = '';
                mainNav.style.top = '';
                mainNav.style.left = '';
                mainNav.style.right = '';
                mainNav.style.background = '';
                mainNav.style.backdropFilter = '';
                mainNav.style.padding = '';
                mainNav.style.borderRadius = '';
                mainNav.style.boxShadow = '';

                if (navList) {
                    navList.style.flexDirection = '';
                    navList.style.gap = '';
                }
            }
        }
    }

    // 初始调用和窗口调整
    updateNavForMobile();
    window.addEventListener('resize', updateNavForMobile);
});

// 搜索建议函数
function showSearchSuggestions(query) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer) return;

    // 模拟建议数据
    const suggestions = [
        '杭州养老院',
        '护理型机构',
        '医养结合',
        '西湖区',
        '滨江区',
        '专业护理',
        '康复中心',
        '老年公寓'
    ];

    const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length > 0) {
        suggestionsContainer.innerHTML = filtered.map(s =>
            `<div class="suggestion-item" data-suggestion="${s}">${s}</div>`
        ).join('');
        suggestionsContainer.style.display = 'block';

        // 添加点击事件
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = this.getAttribute('data-suggestion');
                    suggestionsContainer.style.display = 'none';

                    // 触发搜索
                    if (window.AppState && window.AppState.filterElderlyHomes) {
                        window.AppState.filterElderlyHomes();
                    }
                }
            });
        });
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

function hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}