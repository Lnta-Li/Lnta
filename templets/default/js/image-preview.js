/**
 * 图片预览功能
 * 允许用户点击图片查看大图
 */
window.addEventListener('load', function() {
    // 添加CSS样式链接
    const cssLink = document.createElement('link');
    cssLink.href = '/templets/default/style/image-preview.css';
    cssLink.rel = 'stylesheet';
    cssLink.media = 'screen';
    cssLink.type = 'text/css';
    document.head.appendChild(cssLink);
    
    // 创建模态框元素
    const modal = document.createElement('div');
    modal.className = 'img-preview-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'img-preview-content';
    
    // 添加缩略图容器
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'img-preview-thumbnails';
    
    // 添加标题栏容器
    const captionContainer = document.createElement('div');
    captionContainer.className = 'img-preview-caption-container';
    
    // 添加缩略图拖动功能
    let isThumbDragging = false;
    let startThumbX = 0;
    let scrollLeft = 0;
    let hasDragged = false;
    
    thumbnailsContainer.addEventListener('mousedown', (e) => {
        isThumbDragging = true;
        hasDragged = false;
        thumbnailsContainer.classList.add('grabbing');
        thumbnailsContainer.style.scrollBehavior = 'auto'; // 拖拽时禁用平滑滚动
        startThumbX = e.clientX;
        scrollLeft = thumbnailsContainer.scrollLeft;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isThumbDragging) return;
        e.preventDefault();
        const x = e.clientX;
        const walk = x - startThumbX;
        if (Math.abs(walk) > 5) { // 添加一个小的阈值，只有移动超过5像素才被认为是拖动
            hasDragged = true;
        }
        thumbnailsContainer.scrollLeft = scrollLeft - walk;
    });
    
    document.addEventListener('mouseup', () => {
        isThumbDragging = false;
        thumbnailsContainer.classList.remove('grabbing');
        thumbnailsContainer.style.scrollBehavior = 'smooth'; // 拖拽结束后恢复平滑滚动
    });
    
    document.addEventListener('mouseleave', () => {
        isThumbDragging = false;
        thumbnailsContainer.classList.remove('grabbing');
    });
    
    modal.appendChild(captionContainer);
    modal.appendChild(modalContent);
    modal.appendChild(thumbnailsContainer);
    document.body.appendChild(modal);
    
    // 点击模态框内容区域关闭预览
    let modalContentStartX = 0;
    let modalContentStartY = 0;
    let isModalContentDragging = false;
    
    // 鼠标事件
    modalContent.addEventListener('mousedown', (e) => {
        modalContentStartX = e.clientX;
        modalContentStartY = e.clientY;
        isModalContentDragging = false;
    });
    
    modalContent.addEventListener('mousemove', (e) => {
        if (Math.abs(e.clientX - modalContentStartX) > 5 || Math.abs(e.clientY - modalContentStartY) > 5) {
            isModalContentDragging = true;
        }
    });
    
    modalContent.addEventListener('click', function(e) {
        if (!isModalContentDragging) {
            closeModal();
        }
    });
    
    // 触摸事件支持
    modalContent.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            modalContentStartX = e.touches[0].clientX;
            modalContentStartY = e.touches[0].clientY;
            isModalContentDragging = false;
        }
    }, { passive: true });
    
    modalContent.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            if (Math.abs(e.touches[0].clientX - modalContentStartX) > 5 || 
                Math.abs(e.touches[0].clientY - modalContentStartY) > 5) {
                isModalContentDragging = true;
            }
        }
    }, { passive: true });
    
    modalContent.addEventListener('touchend', (e) => {
        if (!isModalContentDragging && e.changedTouches.length === 1) {
            closeModal();
        }
    });
    
    // 获取.image-carousel内所有图片和Content-Type类下的图片
    const carouselImages = Array.from(document.querySelectorAll('.image-carousel img'));
    const contentTypeImages = Array.from(document.querySelectorAll('.Content-Type img'));
    // 合并两组图片，carousel图片在前
    const images = [...carouselImages, ...contentTypeImages];
    
    // 存储图片比例信息的缓存对象
    const imageAspectRatios = {};
    
    // 用于计算图片比例并返回对应的aspect-ratio值的函数
    function getImageAspectRatio(img) {
        const imgIndex = images.indexOf(img);
        
        // 如果已经计算过，直接返回缓存的结果
        if (imageAspectRatios[imgIndex]) {
            return imageAspectRatios[imgIndex];
        }
        
        // 计算图片的宽高比并缓存结果
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;
        
        // 保存原始宽高比和预设比例
        imageAspectRatios[imgIndex] = {
            original: `${imgWidth} / ${imgHeight}`,
            isPortrait: imgWidth / imgHeight < 1,
            preset: imgWidth / imgHeight < 1 ? '9 / 16' : '1 / 1'
        };
        
        return imageAspectRatios[imgIndex];
    }
    
    // 当前图片索引
    let currentImageIndex = 0;
    // ★★★ 添加标志：是否为首次加载 ★★★
    let isInitialLoad = true;
    
    // 创建图片滑动容器
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'img-preview-slides';
    modalContent.appendChild(slidesContainer);
    
    // 为每张图片创建独立的slide元素
    images.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.className = 'img-preview-slide';
        slide.dataset.index = index;
        slide.style.marginRight = '50px'; // 添加右侧间距
        
        const previewImg = document.createElement('img');
        previewImg.className = 'img-preview-img';
        previewImg.src = img.src;
        previewImg.draggable = false;
        
        // 保存描述文本到dataset，不再创建caption元素
        let descriptionText = '';
        if (carouselImages.includes(img)) {
            descriptionText = img.getAttribute('alt');
        } else {
            descriptionText = img.getAttribute('title');
        }
        
        // 将描述文本保存到slide的dataset中
        if (descriptionText && descriptionText.trim() !== '') {
            slide.dataset.caption = descriptionText;
        }
        
        slide.appendChild(previewImg);
        slidesContainer.appendChild(slide);
    });
    
    // 创建缩略图
    const thumbnailsWrapper = document.createElement('div');
    thumbnailsWrapper.className = 'img-preview-thumbnails-wrapper';
    
    images.forEach((img, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = img.src;
        thumbnail.className = 'img-preview-thumbnail';
        thumbnail.dataset.index = index;
        
        // 获取图片的比例信息
        const aspectRatio = getImageAspectRatio(img);
        // 设置缩略图比例为预设值
        thumbnail.style.aspectRatio = aspectRatio.preset;
        
        thumbnail.addEventListener('click', (e) => {
            if (!hasDragged) {
                showImage(index);
            }
        });
        // 禁用缩略图的默认拖拽行为
        thumbnail.draggable = false;
        thumbnailsWrapper.appendChild(thumbnail);
    });
    
    thumbnailsContainer.appendChild(thumbnailsWrapper);
    
    // 显示指定索引的图片
    function showImage(index) {
        if (index < 0 || index >= images.length) return;
        currentImageIndex = index;
        
        // 先激活模态框再获取宽度
        modal.classList.add('active');
        
        // ★★★ 决定是否应用过渡 ★★★
        const applyTransition = !isInitialLoad;
        
        // 异步获取准确宽度并应用变换
        requestAnimationFrame(() => {
            const slideWidth = modalContent.offsetWidth;

            if (applyTransition) {
                // 后续切换：应用过渡
                slidesContainer.style.transition = 'transform 0.3s ease';
            } else {
                // 首次加载：禁用过渡，并更新标志
                slidesContainer.style.transition = 'none';
                isInitialLoad = false;
            }

            // 计算位移时考虑每个slide的右侧间距50px
            slidesContainer.style.transform = `translateX(${-index * (slideWidth + 50)}px)`;

            if (applyTransition) {
                // ★★★ 动画结束后移除过渡，避免干扰拖动 ★★★
                setTimeout(() => {
                    slidesContainer.style.transition = '';
                }, 300); // 匹配过渡时间
            }
        });
        
        // 重置垂直位移和缩放
        slidesContainer.style.transformOrigin = 'center';
        slidesContainer.classList.remove('vertical-dragging');
        
        // 重置所有图片的垂直位置
        slidesContainer.querySelectorAll('.img-preview-img').forEach(img => {
            img.style.transform = '';
        });
        
        // 更新活动状态
        const slides = slidesContainer.querySelectorAll('.img-preview-slide');
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        // 更新标题栏内容
        const activeSlide = slides[index];
        const captionText = activeSlide.dataset.caption;
        
        if (captionText && captionText.trim() !== '') {
            captionContainer.textContent = captionText;
            captionContainer.style.display = 'block';
        } else {
            captionContainer.style.display = 'none';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 禁用背景页面滚动
        
        // 更新缩略图状态
        const thumbnails = thumbnailsWrapper.querySelectorAll('.img-preview-thumbnail');
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
            
            // 获取图片的比例信息
            const aspectRatio = getImageAspectRatio(images[i]);
            
            // 设置正确的aspect-ratio
            if (i === index) {
                // 激活状态的缩略图使用原图的宽高比
                thumb.style.aspectRatio = aspectRatio.original;
            } else {
                // 非激活状态的缩略图使用预设比例
                thumb.style.aspectRatio = aspectRatio.preset;
            }
        });
        
        // 滚动缩略图到当前图片位置
        const activeThumb = thumbnails[index];
        const containerWidth = thumbnailsContainer.offsetWidth;
        const thumbWidth = activeThumb.offsetWidth;
        const thumbLeft = activeThumb.offsetLeft;
        const scrollLeft = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);
        
        // 添加平滑滚动效果
        thumbnailsContainer.classList.add('img-preview-smooth-scroll');
        thumbnailsContainer.scrollLeft = scrollLeft;
        
        // 滚动完成后移除平滑效果，以便拖动时保持即时响应
        setTimeout(() => {
            thumbnailsContainer.classList.remove('img-preview-smooth-scroll');
            thumbnailsContainer.classList.add('img-preview-auto-scroll');
        }, 500);

        // 同步背景网页位置
        const currentImg = images[index];
        
        // 移除之前可能的动画类和样式类
        images.forEach(img => {
            img.classList.remove('img-preview-zoom-animation');
            img.classList.remove('img-preview-zoom-initial');
            img.classList.remove('img-preview-zoom-reset');
        });
        
        // 预先设置背景图片的2倍缩放
        currentImg.classList.add('img-preview-zoom-initial');
        
        if (currentImg.closest('.image-carousel')) {
            // 如果是轮播图，滚动到顶部并切换到对应图片
            window.scrollTo(0, 0);
            const carousel = currentImg.closest('.image-carousel');
            const carouselImgs = Array.from(carousel.querySelectorAll('.carousel-item img'));
            const carouselIndex = carouselImgs.indexOf(currentImg);
            if (carouselIndex !== -1 && carousel._carouselInstance) {
                // 使用实例方法更新轮播图状态
                carousel._carouselInstance.currentIndex = carouselIndex;
                carousel._carouselInstance.updateCarousel();
            }
        } else if (currentImg.closest('.Content-Type')) {
            // 如果是普通图片，滚动到图片位置，使图片位于视口中间
            const imgRect = currentImg.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const scrollTop = window.pageYOffset + imgRect.top - (windowHeight / 2) + (imgRect.height / 2);
            window.scrollTo(0, scrollTop);
        }
    }
    
    // 监听窗口大小变化，保持当前图片居中
    window.addEventListener('resize', () => {
        if (modal.classList.contains('active')) {
            const slideWidth = modalContent.offsetWidth;
            slidesContainer.style.transition = 'none';
            slidesContainer.style.transform = `translateX(${-currentImageIndex * (slideWidth + 50)}px)`;
            slidesContainer.querySelectorAll('.img-preview-img').forEach(img => img.style.transform = '');
            // 恢复过渡效果
            setTimeout(() => {
                slidesContainer.style.transition = '';
            }, 50);
        }
    });
    
    // 为每个图片添加点击事件
    images.forEach((img, index) => {
        // 跟踪触摸/点击起始位置和是否发生拖动
        let startPosX = 0;
        let startPosY = 0;
        let isDraggingImg = false;
        
        // 添加鼠标按下事件
        img.addEventListener('mousedown', (e) => {
            startPosX = e.clientX;
            startPosY = e.clientY;
            isDraggingImg = false;
        });
        
        // 添加鼠标移动事件
        img.addEventListener('mousemove', (e) => {
            // 如果移动距离超过5px，视为拖拽
            if (Math.abs(e.clientX - startPosX) > 5 || Math.abs(e.clientY - startPosY) > 5) {
                isDraggingImg = true;
            }
        });
        
        // 鼠标点击事件
        img.addEventListener('click', (e) => {
            if (!isDraggingImg) {
                showImage(index);
            }
        });
        
        // 触摸开始事件
        img.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startPosX = e.touches[0].clientX;
                startPosY = e.touches[0].clientY;
                isDraggingImg = false;
            }
        });
        
        // 触摸移动事件
        img.addEventListener('touchmove', (e) => {
            // 如果移动距离超过5px，视为拖拽
            if (e.touches.length === 1 && 
                (Math.abs(e.touches[0].clientX - startPosX) > 5 || 
                 Math.abs(e.touches[0].clientY - startPosY) > 5)) {
                isDraggingImg = true;
            }
        });
        
        // 触摸结束事件
        img.addEventListener('touchend', (e) => {
            if (!isDraggingImg) {
                e.preventDefault();
                showImage(index);
            }
        });
        
        // 禁用默认拖拽行为
        img.draggable = false;
    });
    
    // 实现水平滑动功能
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let isDragging = false;
    let isVerticalDragging = false;
    let verticalTranslate = 0;
    let verticalDistance = 0;
    
    slidesContainer.addEventListener('mousedown', (e) => {
        if (!modal.classList.contains('active')) return;
        
        isDragging = true;
        isVerticalDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        startTranslate = getTranslateX(slidesContainer);
        verticalTranslate = 0;
        slidesContainer.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const x = e.clientX;
        const y = e.clientY;
        const diffX = x - startX;
        const diffY = y - startY;
        
        // 判断拖动方向
        if (!isVerticalDragging && Math.abs(diffY) > Math.abs(diffX) && diffY > 0) {
            // 向下拖动且角度大于45度
            isVerticalDragging = true;
            slidesContainer.classList.add('vertical-dragging');
            thumbnailsContainer.classList.add('img-preview-hidden');
            // 隐藏标题栏
            captionContainer.classList.add('img-preview-hidden');
        }
        
        if (isVerticalDragging) {
            // 垂直拖动 - 向下移动并缩小
            verticalDistance = diffY;
            if (verticalDistance > 0) { // 只在向下拖动时执行
                const scale = Math.max(0.2, 1 - verticalDistance / 1000);
                const blurValue = Math.max(0, 20 - (verticalDistance / 500) * 20);
                verticalTranslate = verticalDistance;
                const horizontalTranslate = diffX; // 水平方向跟随鼠标移动

                // 应用变换
                const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
                // 同时应用水平和垂直位移以及缩放
                activeImg.style.transform = `translate(${horizontalTranslate}px, ${verticalTranslate}px) scale(${scale})`;
                activeImg.style.transformOrigin = 'center';

                // 调整模态框透明度和模糊效果
                const opacity = Math.max(0.3, 1 - verticalDistance / 300);
                modal.style.backgroundColor = `rgba(51, 51, 51, ${opacity})`;
                modal.style.backdropFilter = `blur(${blurValue}px)`;
                modal.style.webkitBackdropFilter = `blur(${blurValue}px)`;
            }
        } else {
            // 水平拖动 - 切换图片
            slidesContainer.style.transform = `translateX(${startTranslate + diffX}px)`;
        }
    });
    
    // 处理拖动结束的公共函数
    function handleDragEnd(verticalDistance, isVerticalDragging) {
        if (isVerticalDragging) {
            // 处理垂直拖动结束
            if (verticalDistance > 150) {
                // 如果拖动距离超过150px，关闭预览
                closeModal();
            } else {
                // 否则回到原位，添加平滑过渡
                const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);

                // 为图片和模态框背景添加过渡效果
                activeImg.style.transition = 'transform 0.3s ease';
                modal.style.transition = 'background-color 0.3s ease, backdrop-filter 0.3s ease, -webkit-backdrop-filter 0.3s ease';

                // 重置图片位置和缩放
                activeImg.style.transform = '';
                // 重置模态框背景和模糊效果
                modal.style.backgroundColor = '';
                modal.style.backdropFilter = ''; // 重置模糊
                modal.style.webkitBackdropFilter = ''; // 重置模糊 (Safari)

                // 水平容器回到正确位置（这个已有过渡）
                slidesContainer.style.transition = 'transform 0.3s ease';
                slidesContainer.style.transform = `translateX(${-currentImageIndex * (modalContent.offsetWidth + 50)}px)`;

                // 移除样式类和恢复元素显示
                slidesContainer.classList.remove('vertical-dragging');
                thumbnailsContainer.classList.remove('img-preview-hidden');
                captionContainer.classList.remove('img-preview-hidden');

                // 动画结束后移除过渡，避免影响后续拖动
                setTimeout(() => {
                    if (activeImg) {
                      activeImg.style.transition = '';
                    }
                    modal.style.transition = '';
                }, 300); // 匹配过渡时间
            }
        } else {
            // 处理水平拖动结束
            const finalTranslate = getTranslateX(slidesContainer);
            const diff = finalTranslate - startTranslate;
            const slideWidth = modalContent.offsetWidth;
            
            slidesContainer.style.transition = 'transform 0.3s ease';
            
            if (Math.abs(diff) > 100) {
                // 如果拖动超过100px，切换到下一张或上一张
                if (diff > 0 && currentImageIndex > 0) {
                    showImage(currentImageIndex - 1);
                } else if (diff < 0 && currentImageIndex < images.length - 1) {
                    showImage(currentImageIndex + 1);
                } else {
                    // 回到当前图片
                    slidesContainer.style.transform = `translateX(${-currentImageIndex * (slideWidth + 50)}px)`;
                    slidesContainer.querySelectorAll('.img-preview-img').forEach(img => img.style.transform = '');
                }
            } else {
                // 回到当前图片
                slidesContainer.style.transform = `translateX(${-currentImageIndex * (slideWidth + 50)}px)`;
                slidesContainer.querySelectorAll('.img-preview-img').forEach(img => img.style.transform = '');
            }
        }
        
        isDragging = false;
        isVerticalDragging = false;
    }

    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        handleDragEnd(verticalDistance, isVerticalDragging);
    });
    
    // 触摸滑动支持
    slidesContainer.addEventListener('touchstart', (e) => {
        if (!modal.classList.contains('active')) return;
        
        if (e.touches.length === 1) {
            isDragging = true;
            isVerticalDragging = false;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTranslate = getTranslateX(slidesContainer);
            verticalTranslate = 0;
            slidesContainer.style.transition = 'none';
        }
        
        // 解决iOS Safari触摸事件问题
        e.preventDefault();
    }, { passive: false });
    
    // 确保整个modalContent区域可以响应触摸事件 - 解决iOS Safari上的触摸事件问题
    modalContent.addEventListener('touchstart', (e) => {
        // 仅阻止默认行为，不执行其他操作
        e.preventDefault();
    }, { passive: false });
    
    slidesContainer.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const diffX = x - startX;
        const diffY = y - startY;
        
        // 判断拖动方向
        if (!isVerticalDragging && Math.abs(diffY) > Math.abs(diffX) && diffY > 0) {
            // 向下拖动且角度大于45度
            isVerticalDragging = true;
            slidesContainer.classList.add('vertical-dragging');
            thumbnailsContainer.classList.add('img-preview-hidden');
            // 隐藏标题栏
            captionContainer.classList.add('img-preview-hidden');
        }
        
        if (isVerticalDragging) {
            // 垂直拖动 - 向下移动并缩小
            verticalDistance = diffY;
            if (verticalDistance > 0) { // 只在向下拖动时执行
                const scale = Math.max(0.5, 1 - verticalDistance / 500);
                const blurValue = Math.max(0, 20 - (verticalDistance / 300) * 20);
                verticalTranslate = verticalDistance;
                const horizontalTranslate = diffX; // 水平方向跟随手指移动

                // 应用变换
                const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
                // 同时应用水平和垂直位移以及缩放
                activeImg.style.transform = `translate(${horizontalTranslate}px, ${verticalTranslate}px) scale(${scale})`;
                activeImg.style.transformOrigin = 'center';

                // 调整模态框透明度和模糊效果
                const opacity = Math.max(0.3, 1 - verticalDistance / 300);
                modal.style.backgroundColor = `rgba(51, 51, 51, ${opacity})`;
                modal.style.backdropFilter = `blur(${blurValue}px)`;
                modal.style.webkitBackdropFilter = `blur(${blurValue}px)`;
            }
            
            // 阻止页面滚动
            e.preventDefault();
        } else {
            // 水平拖动 - 切换图片
            slidesContainer.style.transform = `translateX(${startTranslate + diffX}px)`;
            
            // 阻止页面滚动
            e.preventDefault();
        }
    }, { passive: false });
    
    slidesContainer.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        handleDragEnd(verticalDistance, isVerticalDragging);
    });
    
    // 获取元素的translateX值
    function getTranslateX(element) {
        const style = window.getComputedStyle(element);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41;
    }
    
    // 按ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        } else if (e.key === 'ArrowLeft' && modal.classList.contains('active')) {
            // 左箭头键显示上一张图片
            if (currentImageIndex > 0) {
                showImage(currentImageIndex - 1);
            }
        } else if (e.key === 'ArrowRight' && modal.classList.contains('active')) {
            // 右箭头键显示下一张图片
            if (currentImageIndex < images.length - 1) {
                showImage(currentImageIndex + 1);
            }
        }
    });
    
    function closeModal() {
        // 获取当前显示的图片
        const currentImg = images[currentImageIndex];
        
        // 添加缩放动画类
        if (currentImg) {
            // 确保背景图片已经设置了初始缩放
            if (!currentImg.classList.contains('img-preview-zoom-initial')) {
                currentImg.classList.add('img-preview-zoom-initial');
            }
            
            // 添加CSS动画类
            currentImg.classList.add('img-preview-zoom-animation');
            
            // 动画结束后清理样式
            currentImg.addEventListener('animationend', function onAnimEnd() {
                currentImg.classList.remove('img-preview-zoom-initial');
                currentImg.classList.remove('img-preview-zoom-animation');
                currentImg.classList.add('img-preview-zoom-reset');
                
                // 延迟一小段时间后移除重置类，确保样式已应用
                setTimeout(() => {
                    currentImg.classList.remove('img-preview-zoom-reset');
                }, 100);
                
                currentImg.removeEventListener('animationend', onAnimEnd);
            }, { once: true });
        }
        
        modal.classList.remove('active');
        document.body.style.overflow = ''; // 恢复背景页面滚动
        
        // 重置模态框样式
        setTimeout(() => {
            slidesContainer.style.transform = '';
            slidesContainer.classList.remove('vertical-dragging');
            thumbnailsContainer.classList.remove('img-preview-hidden');
            // 恢复标题栏显示
            captionContainer.classList.remove('img-preview-hidden');
            modal.style.backgroundColor = '';
            
            // 处理iOS Safari触摸事件可能的残留状态
            isDragging = false;
            isVerticalDragging = false;
            isModalContentDragging = false;

            // ★★★ 重置首次加载标志 ★★★
            isInitialLoad = true;
        }, 300);
    }
});