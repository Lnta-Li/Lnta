/**
 * 图片轮播组件
 * 实现了一个可自动播放的图片轮播效果，包含以下功能：
 * - 上一张/下一张导航按钮
 * - 轮播指示器圆点
 * - 自动播放功能
 * - 鼠标悬停暂停
 * - 点击图片全屏显示
 */

class ImageCarousel {
    constructor(container) {
        this.container = container;
        this.items = container.querySelectorAll('.carousel-item');
        this.currentIndex = 0;
        this.totalItems = this.items.length;
        
        // 全屏模式相关变量
        this.isFullscreen = false;
        this.fullscreenEl = null;
        this.fullscreenStartY = 0;
        this.fullscreenDragData = {
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0,
            isDragging: false,
            isClick: true // 是否是点击而非拖拽
        };
        
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
            
            // 添加图片点击事件
            this.addImageClickListeners();
            
            // 创建全屏容器
            this.createFullscreenContainer();
            
            // 添加键盘事件监听
            this.addKeyboardListeners();
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
            // 从img标签的alt属性获取描述文本
            const img = this.items[i].querySelector('img');
            if (img && img.alt) {
                dot.textContent = img.alt;
            }
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
            // 根据alt文本长度设置宽度和样式
            if (index === this.currentIndex) {
                const img = this.items[index].querySelector('img');
                const altLength = img && img.alt ? img.alt.length : 0;
                if (altLength === 0) {
                    dot.style.cssText = 'padding: 0;background: #fff; border: none;';
                } else {
                    const width = Math.min(altLength * 14, 200);
                    dot.style.width = `${width}px`;
                }
            } else {
                dot.style.cssText = '';
            }
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
        let startTime = 0;
        
        // 通用事件处理函数
        const handleStart = (pos, e) => {
            isDragging = true;
            startPos = pos;
            startTime = Date.now();
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
            
            // 判断是否是点击而非拖拽
            const timeElapsed = Date.now() - startTime;
            const isClick = Math.abs(delta) < 5 && timeElapsed < 300;
            
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
            
            return isClick;
        };
        
        // 鼠标事件
        container.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.fullscreenDragData.isClick = true; // 初始状态认为是点击
            handleStart(e.clientX, e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                // 如果移动距离超过5px，则不再认为是点击
                if (Math.abs(e.clientX - startPos) > 5) {
                    this.fullscreenDragData.isClick = false;
                }
                handleMove(e.clientX);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            handleEnd(e.clientX);
        });
        
        // 触摸事件
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchMoving = false;
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isTouchMoving = false;
                this.fullscreenDragData.isClick = true; // 初始状态认为是点击
                handleStart(e.touches[0].clientX, e);
            }
        }, { passive: false });
        this.container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (!isTouchMoving && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                    isTouchMoving = true;
                    // 如果移动距离超过5px，则不再认为是点击
                    this.fullscreenDragData.isClick = false;
                }
                // 仅在左右滑动时阻止默认，允许上下滑动页面
                if (isTouchMoving && Math.abs(dx) > Math.abs(dy)) {
                    e.preventDefault();
                    handleMove(e.touches[0].clientX);
                }
            }
        }, { passive: false });
        container.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                const dx = e.changedTouches[0].clientX - touchStartX;
                const dy = e.changedTouches[0].clientY - touchStartY;
                // 仅在左右滑动时处理切换
                if (Math.abs(dx) > Math.abs(dy)) {
                    e.preventDefault();
                    handleEnd(e.changedTouches[0].clientX);
                }
            }
        });
    }
    
    // 添加图片点击事件
    addImageClickListeners() {
        this.items.forEach((item, index) => {
            const img = item.querySelector('img');
            if (!img) return;
            
            img.addEventListener('click', (e) => {
                // 判断是否真的是点击而非拖拽
                if (this.fullscreenDragData.isClick) {
                    // 显示全屏
                    this.showFullscreen(index);
                }
            });
        });
    }
    
    // 创建全屏容器
    createFullscreenContainer() {
        // 创建全屏容器元素
        const fullscreenContainer = document.createElement('div');
        fullscreenContainer.className = 'carousel-fullscreen';
        fullscreenContainer.style.display = 'none';
        
        // 创建全屏轮播容器
        const fullscreenInner = document.createElement('div');
        fullscreenInner.className = 'carousel-fullscreen-inner';
        fullscreenContainer.appendChild(fullscreenInner);
        
        // 为每张图片创建一个全屏项
        this.items.forEach((item, index) => {
            const fullscreenItem = document.createElement('div');
            fullscreenItem.className = 'carousel-fullscreen-item';
            
            const img = item.querySelector('img');
            if (img) {
                const fullscreenImg = document.createElement('img');
                fullscreenImg.src = img.src;
                fullscreenImg.alt = img.alt || '';
                fullscreenItem.appendChild(fullscreenImg);
            }
            
            fullscreenInner.appendChild(fullscreenItem);
        });
        
        // 添加到body
        document.body.appendChild(fullscreenContainer);
        this.fullscreenEl = fullscreenContainer;
        
        // 添加全屏模式事件监听
        this.addFullscreenEventListeners();
    }
    
    // 显示全屏
    showFullscreen(index) {
        if (!this.fullscreenEl) return;
        
        this.isFullscreen = true;
        this.fullscreenEl.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 重置背景颜色为不透明黑色
        this.fullscreenEl.style.backgroundColor = 'rgba(0, 0, 0, 1)';
        
        // 重置所有图片位置
        const fullscreenItems = this.fullscreenEl.querySelectorAll('.carousel-fullscreen-item img');
        fullscreenItems.forEach(img => {
            img.style.transform = '';
        });
        
        // 设置当前显示的图片
        const fullscreenInner = this.fullscreenEl.querySelector('.carousel-fullscreen-inner');
        fullscreenInner.style.transform = `translateX(-${index * 100}%)`;
        this.currentFullscreenIndex = index;
        
        // 重置拖拽数据
        this.fullscreenDragData = {
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0,
            isDragging: false,
            isClick: true
        };
    }
    
    // 关闭全屏
    closeFullscreen() {
        if (!this.fullscreenEl) return;
        
        // 同步普通轮播位置到全屏轮播位置
        this.goToSlide(this.currentFullscreenIndex);
        
        this.isFullscreen = false;
        this.fullscreenEl.style.display = 'none';
        document.body.style.overflow = ''; // 恢复背景滚动
    }
    
    // 添加键盘事件监听
    addKeyboardListeners() {
        this.handleKeyDown = (e) => {
            if (this.isFullscreen) {
                if (e.key === 'ArrowLeft') {
                    if (this.currentFullscreenIndex > 0) {
                        this.currentFullscreenIndex--;
                        // 同步普通轮播位置
                        this.currentIndex = this.currentFullscreenIndex;
                        const fullscreenInner = this.fullscreenEl.querySelector('.carousel-fullscreen-inner');
                        fullscreenInner.style.transform = `translateX(-${this.currentFullscreenIndex * 100}%)`;
                    }
                } else if (e.key === 'ArrowRight') {
                    if (this.currentFullscreenIndex < this.totalItems - 1) {
                        this.currentFullscreenIndex++;
                        // 同步普通轮播位置
                        this.currentIndex = this.currentFullscreenIndex;
                        const fullscreenInner = this.fullscreenEl.querySelector('.carousel-fullscreen-inner');
                        fullscreenInner.style.transform = `translateX(-${this.currentFullscreenIndex * 100}%)`;
                    }
                } else if (e.key === 'Escape') {
                    this.closeFullscreen();
                }
            } else {
                if (e.key === 'ArrowLeft') {
                    this.prev();
                } else if (e.key === 'ArrowRight') {
                    this.next();
                }
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    // 添加全屏模式事件监听
    addFullscreenEventListeners() {
        if (!this.fullscreenEl) return;
        
        // 添加全屏键盘事件
        document.addEventListener('keydown', this.handleKeyDown);
        
        const fullscreenInner = this.fullscreenEl.querySelector('.carousel-fullscreen-inner');
        const fullscreenItems = this.fullscreenEl.querySelectorAll('.carousel-fullscreen-item');
        
        // 点击关闭全屏
        fullscreenItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // 判断是否真的是点击而非拖拽
                if (this.fullscreenDragData.isClick) {
                    this.closeFullscreen();
                }
            });
        });
        
        // 处理全屏模式下的拖拽
        let startX = 0;
        let startY = 0;
        let currentTranslateX = 0;
        let startTime = 0;
        let moveDirection = null; // 初始化移动方向标记，null表示尚未确定方向
        
        // 触摸开始
        this.fullscreenEl.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.fullscreenDragData.isDragging = true;
                this.fullscreenDragData.isClick = true;
                this.fullscreenDragData.startX = e.touches[0].clientX;
                this.fullscreenDragData.startY = e.touches[0].clientY;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTime = Date.now();
                
                currentTranslateX = -this.currentFullscreenIndex * 100;
                fullscreenInner.style.transition = 'none';
                
                // 重置移动方向
                moveDirection = null;
            }
        }, { passive: false });
        
        // 触摸移动
        this.fullscreenEl.addEventListener('touchmove', (e) => {
            if (!this.fullscreenDragData.isDragging || e.touches.length !== 1) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - this.fullscreenDragData.startX;
            const deltaY = currentY - this.fullscreenDragData.startY;
            
            // 如果移动距离超过5px，则不再认为是点击
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                this.fullscreenDragData.isClick = false;
                
                // 仅在第一次有效移动时确定移动方向
                if (moveDirection === null) {
                    moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
                }
            }
            
            // 存储移动距离
            this.fullscreenDragData.moveX = deltaX;
            this.fullscreenDragData.moveY = deltaY;
            
            // 根据确定的方向执行相应的操作
            if (moveDirection === 'horizontal') {
                // 左右滑动 - 切换图片
                e.preventDefault();
                const movePercentX = (deltaX / window.innerWidth) * 100;
                fullscreenInner.style.transform = `translateX(${currentTranslateX + movePercentX}%)`;
            } else if (moveDirection === 'vertical' && deltaY > 0) {
                // 下滑 - 缩放并关闭
                e.preventDefault();
                
                // 计算缩放比例，最小为0.7
                const scale = Math.max(0.7, 1 - Math.min(deltaY, 150) / 300);
                
                // 应用变换
                const currentImg = fullscreenItems[this.currentFullscreenIndex].querySelector('img');
                currentImg.style.transform = `translateY(${deltaY}px) scale(${scale})`;
                
                // 同时调整透明度
                this.fullscreenEl.style.backgroundColor = `rgba(0, 0, 0, ${Math.max(0.5, 1 - deltaY / 400)})`;
            }
            // 上滑不响应
        }, { passive: false });
        
        // 触摸结束
        this.fullscreenEl.addEventListener('touchend', (e) => {
            if (!this.fullscreenDragData.isDragging) return;
            
            const deltaX = this.fullscreenDragData.moveX;
            const deltaY = this.fullscreenDragData.moveY;
            const timeElapsed = Date.now() - startTime;
            
            fullscreenInner.style.transition = 'transform 0.3s';
            this.fullscreenEl.style.transition = 'background-color 0.3s';
            
            if (moveDirection === 'horizontal') {
                // 左右滑动 - 切换图片
                const movePercentX = (deltaX / window.innerWidth) * 100;
                
                if (Math.abs(movePercentX) > 20 || (Math.abs(deltaX) > 50 && timeElapsed < 300)) {
                    if (deltaX > 0 && this.currentFullscreenIndex > 0) {
                        // 右滑 - 上一张
                        this.currentFullscreenIndex--;
                        // 同步普通轮播位置
                        this.currentIndex = this.currentFullscreenIndex;
                    } else if (deltaX < 0 && this.currentFullscreenIndex < this.totalItems - 1) {
                        // 左滑 - 下一张
                        this.currentFullscreenIndex++;
                        // 同步普通轮播位置
                        this.currentIndex = this.currentFullscreenIndex;
                    }
                }
                
                // 更新位置
                fullscreenInner.style.transform = `translateX(-${this.currentFullscreenIndex * 100}%)`;
                const currentImg = fullscreenItems[this.currentFullscreenIndex].querySelector('img');
                currentImg.style.transform = '';
                
                // 同步更新普通轮播图位置，但不触发动画
                this.updateCarouselSilently(this.currentFullscreenIndex);
            } else if (moveDirection === 'vertical' && deltaY > 100) {
                // 下滑超过150px - 关闭全屏
                this.closeFullscreen();
            } else {
                // 恢复原始状态
                fullscreenInner.style.transform = `translateX(-${this.currentFullscreenIndex * 100}%)`;
                const currentImg = fullscreenItems[this.currentFullscreenIndex].querySelector('img');
                currentImg.style.transform = '';
                this.fullscreenEl.style.backgroundColor = 'rgba(0, 0, 0, 1)';
            }
            
            this.fullscreenDragData.isDragging = false;
            moveDirection = null; // 重置移动方向
        });
        
        // 鼠标事件
        this.fullscreenEl.addEventListener('mousedown', (e) => {
            this.fullscreenDragData.isDragging = true;
            this.fullscreenDragData.isClick = true;
            this.fullscreenDragData.startX = e.clientX;
            this.fullscreenDragData.startY = e.clientY;
            startX = e.clientX;
            startY = e.clientY;
            startTime = Date.now();
            
            currentTranslateX = -this.currentFullscreenIndex * 100;
            fullscreenInner.style.transition = 'none';
            
            // 重置移动方向
            moveDirection = null;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isFullscreen || !this.fullscreenDragData.isDragging) return;
            
            const deltaX = e.clientX - this.fullscreenDragData.startX;
            const deltaY = e.clientY - this.fullscreenDragData.startY;
            
            // 如果移动距离超过5px，则不再认为是点击
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                this.fullscreenDragData.isClick = false;
                
                // 仅在第一次有效移动时确定移动方向
                if (moveDirection === null) {
                    moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
                }
            }
            
            // 存储移动距离
            this.fullscreenDragData.moveX = deltaX;
            this.fullscreenDragData.moveY = deltaY;
            
            // 根据确定的方向执行相应的操作
            if (moveDirection === 'horizontal') {
                // 左右滑动 - 切换图片
                const movePercentX = (deltaX / window.innerWidth) * 100;
                fullscreenInner.style.transform = `translateX(${currentTranslateX + movePercentX}%)`;
            } else if (moveDirection === 'vertical' && deltaY > 0) {
                // 下滑 - 缩放并关闭
                // 计算缩放比例，最小为0.7
                const scale = Math.max(0.7, 1 - Math.min(deltaY, 150) / 300);
                
                // 应用变换
                const currentImg = fullscreenItems[this.currentFullscreenIndex].querySelector('img');
                currentImg.style.transform = `translateY(${deltaY}px) scale(${scale})`;
                
                // 同时调整透明度
                this.fullscreenEl.style.backgroundColor = `rgba(0, 0, 0, ${Math.max(0.5, 1 - deltaY / 400)})`;
            }
            // 上滑不响应
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!this.isFullscreen || !this.fullscreenDragData.isDragging) return;
            
            const deltaX = this.fullscreenDragData.moveX;
            const deltaY = this.fullscreenDragData.moveY;
            const timeElapsed = Date.now() - startTime;
            
            fullscreenInner.style.transition = 'transform 0.3s';
            this.fullscreenEl.style.transition = 'background-color 0.3s';
            
            if (moveDirection === 'horizontal') {
                // 左右滑动 - 切换图片
                const movePercentX = (deltaX / window.innerWidth) * 100;
                
                if (Math.abs(movePercentX) > 20 || (Math.abs(deltaX) > 50 && timeElapsed < 300)) {
                    if (deltaX > 0 && this.currentFullscreenIndex > 0) {
                        // 右滑 - 上一张
                        this.currentFullscreenIndex--;
                        // 同步普通轮播位置
                        this.currentIndex = this.currentFullscreenIndex;
                    } else if (deltaX < 0 && this.currentFullscreenIndex < this.totalItems - 1) {
                        // 左滑 - 下一张
                        this.currentFullscreenIndex++;
                        // 同步普通轮播位置
                        this.currentIndex = this.currentFullscreenIndex;
                    }
                }
                
                // 更新位置
                fullscreenInner.style.transform = `translateX(-${this.currentFullscreenIndex * 100}%)`;
                const currentImg = fullscreenItems[this.currentFullscreenIndex].querySelector('img');
                currentImg.style.transform = '';
                
                // 同步更新普通轮播图位置，但不触发动画
                this.updateCarouselSilently(this.currentFullscreenIndex);
            } else if (moveDirection === 'vertical' && deltaY > 150) {
                // 下滑超过150px - 关闭全屏
                this.closeFullscreen();
            } else {
                // 恢复原始状态
                fullscreenInner.style.transform = `translateX(-${this.currentFullscreenIndex * 100}%)`;
                const currentImg = fullscreenItems[this.currentFullscreenIndex].querySelector('img');
                currentImg.style.transform = '';
                this.fullscreenEl.style.backgroundColor = 'rgba(0, 0, 0, 1)';
            }
            
            this.fullscreenDragData.isDragging = false;
            moveDirection = null; // 重置移动方向
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
    
    // 更新轮播而不触发动画
    updateCarouselSilently(index) {
        // 保存当前索引
        this.currentIndex = index;
        
        // 更新容器位置（无动画）
        const container = this.container.querySelector('.carousel-container');
        
        // 临时移除过渡效果
        const originalTransition = container.style.transition;
        container.style.transition = 'none';
        
        // 更新位置
        container.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        
        // 更新指示器圆点
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
            if (i === this.currentIndex) {
                const img = this.items[i].querySelector('img');
                const altLength = img && img.alt ? img.alt.length : 0;
                if (altLength === 0) {
                    dot.style.cssText = 'padding: 0;background: #fff; border: none;';
                } else {
                    const width = Math.min(altLength * 14, 200);
                    dot.style.width = `${width}px`;
                }
            } else {
                dot.style.cssText = '';
            }
        });
        
        // 强制浏览器重排
        void container.offsetWidth;
        
        // 恢复过渡效果
        setTimeout(() => {
            container.style.transition = originalTransition;
        }, 50);
    }
}

// DOM加载完成后初始化轮播
document.addEventListener('DOMContentLoaded', () => {
    const carouselContainers = document.querySelectorAll('.image-carousel');
    carouselContainers.forEach(container => {
        new ImageCarousel(container);
    });
});