/**
 * 图片轮播组件
 * 实现了一个可自动播放的图片轮播效果，包含以下功能：
 * - 上一张/下一张导航按钮
 * - 轮播指示器圆点
 * - 自动播放功能
 * - 鼠标悬停暂停
 */

class ImageCarousel {
    constructor(container) {
        this.container = container;
        this.items = container.querySelectorAll('.carousel-item');
        this.currentIndex = 0;
        this.totalItems = this.items.length;
        
        // 等待所有图片加载完成后初始化
        this.waitForImages().then(() => {
            // 计算图片比例并添加标签
            this.calculateAspectRatios();
            
            // 创建导航按钮
            this.createNavigationButtons();
            
            // 创建指示器圆点
            this.createDots();
            
            // 初始化轮播
            this.updateCarousel();
            
            // 添加事件监听
            this.addEventListeners();
        });
    }
    
    createNavigationButtons() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-nav carousel-prev';
        prevBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>`;
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-nav carousel-next';
        nextBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" fill="currentColor"/></svg>`;
        
        this.container.appendChild(prevBtn);
        this.container.appendChild(nextBtn);
        
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
    }
    
    createDots() {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'carousel-dots';
        
        for (let i = 0; i < this.totalItems; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        }
        
        this.container.appendChild(dotsContainer);
        this.dots = dotsContainer.querySelectorAll('.carousel-dot');
    }
    
    updateCarousel() {
        // 更新容器位置
        const container = this.container.querySelector('.carousel-container');
        container.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        
        // 更新指示器圆点
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    addEventListeners() {
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        
        this.dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.goToSlide(index);
            });
        });

        // 统一处理拖拽和触摸事件
        const container = this.container.querySelector('.carousel-container');
        container.setAttribute('draggable', 'false');
        container.style.userSelect = 'none';
        
        let isDragging = false;
        let startPos = 0;
        let currentTranslate = 0;
        
        // 通用事件处理函数
        const handleStart = (pos) => {
            isDragging = true;
            startPos = pos;
            currentTranslate = -this.currentIndex * 100;
            container.style.transition = 'none';
        };
        
        const handleMove = (pos) => {
            if (!isDragging) return;
            const delta = pos - startPos;
            const movePercent = (delta / container.offsetWidth) * 100;
            container.style.transform = `translateX(${currentTranslate + movePercent}%)`;
        };
        
        const handleEnd = (pos) => {
            if (!isDragging) return;
            isDragging = false;
            container.style.transition = 'transform 0.3s';
            
            const delta = pos - startPos;
            const movePercent = (delta / container.offsetWidth) * 100;
            
            if (Math.abs(movePercent) > 20) {
                if (movePercent > 0 && this.currentIndex > 0) {
                    this.prev();
                } else if (movePercent < 0 && this.currentIndex < this.totalItems - 1) {
                    this.next();
                } else {
                    this.updateCarousel();
                }
            } else {
                this.updateCarousel();
            }
        };
        
        // 鼠标事件
        container.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleStart(e.clientX);
        });
        
        document.addEventListener('mousemove', (e) => {
            handleMove(e.clientX);
        });
        
        document.addEventListener('mouseup', (e) => {
            handleEnd(e.clientX);
        });
        
        // 触摸事件
        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleStart(e.touches[0].clientX);
        }, { passive: false });
        
        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleEnd(e.changedTouches[0].clientX);
        });
    }
    
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }
    
    next() {
        if (this.currentIndex < this.totalItems - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    // 等待所有图片加载完成
    async waitForImages() {
        const images = Array.from(this.items).map(item => item.querySelector('img'));
        const promises = images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });
        await Promise.all(promises);
    }
    
    // 计算所有图片的长宽比例并添加标签
    calculateAspectRatios() {
        const images = Array.from(this.items).map(item => item.querySelector('img'));
        const ratios = images.map(img => img.naturalWidth / img.naturalHeight);
        
        // 找出最大和最小比例
        const maxRatio = Math.max(...ratios);
        const minRatio = Math.min(...ratios);
        
        // 检查是否存在竖版图片（高度大于宽度）
        const hasPortraitImage = images.some(img => img.naturalHeight > img.naturalWidth);
        
        // 计算最大差异百分比
        const difference = Math.abs(maxRatio - minRatio) / minRatio * 100;
        
        // 根据差异和竖版图片判断添加标签
        const className = (difference > 30 || hasPortraitImage) ? 'no-fill' : 'fill';
        this.items.forEach(item => item.classList.add(className));
    }
}

// DOM加载完成后初始化轮播
document.addEventListener('DOMContentLoaded', () => {
    const carouselContainers = document.querySelectorAll('.image-carousel');
    carouselContainers.forEach(container => {
        new ImageCarousel(container);
    });
});