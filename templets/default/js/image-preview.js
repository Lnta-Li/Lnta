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
    // 添加触摸追踪变量
    let wasTouchingWithMultipleFingers = false;  // 追踪之前是否有多点触摸
    
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
        // 记录多点触摸状态
        if (e.touches.length > 1) {
            wasTouchingWithMultipleFingers = true;
        }
        
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
        // 如果处于放大模式，或者正在进行 pinch 操作，或者从多点触摸变为单点触摸，则不关闭模态框
        // 同时也检查 isModalContentDragging，确保单击非拖拽时仍能关闭
        if (!isZoomMode && !isModalContentDragging && e.touches.length === 0 && !wasTouchingWithMultipleFingers) {
            closeModal();
        }
        
        // 只有当所有手指都离开屏幕时，才重置多点触摸标志
        if (e.touches.length === 0) {
            wasTouchingWithMultipleFingers = false;
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
            preset: imgWidth / imgHeight < 1 ? '1/1' : '4/3'
        };
        
        return imageAspectRatios[imgIndex];
    }
    
    // 当前图片索引
    let currentImageIndex = 0;
    // ★★★ 添加标志：是否为首次加载 ★★★
    let isInitialLoad = true;
    // ★★★ 添加状态变量：当前缩放级别和是否处于放大模式 ★★★
    let currentZoomLevel = 1;
    let isZoomMode = false;
    
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
    
    // 实现水平滑动功能
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let isDragging = false;
    let isVerticalDragging = false;
    let verticalTranslate = 0;
    let verticalDistance = 0;
    
    // ★★★ 添加放大模式下图片拖拽的变量 ★★★
    let zoomDragging = false;
    let zoomStartX = 0;
    let zoomStartY = 0;
    let zoomCurrentTranslateX = 0;
    let zoomCurrentTranslateY = 0;

    slidesContainer.addEventListener('mousedown', (e) => {
        if (!modal.classList.contains('active')) return;
        
        // ★★★ 放大模式下的拖动图片逻辑 ★★★
        if (isZoomMode) {
            zoomDragging = true;
            zoomStartX = e.clientX;
            zoomStartY = e.clientY;
            
            // 获取当前显示的图片
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            
            // 解析当前的transform值，提取已有的translate部分
            const transform = window.getComputedStyle(activeImg).transform;
            const matrix = new DOMMatrix(transform);
            
            // 获取当前的平移值（如果有的话）
            const translateRegex = /translate\((.+?)px,\s*(.+?)px\)/;
            const transformValue = activeImg.style.transform;
            const translateMatch = transformValue.match(translateRegex);
            
            if (translateMatch) {
                zoomCurrentTranslateX = parseFloat(translateMatch[1]);
                zoomCurrentTranslateY = parseFloat(translateMatch[2]);
            } else {
                zoomCurrentTranslateX = 0;
                zoomCurrentTranslateY = 0;
            }
            
            // 更改鼠标样式为抓取状态
            modalContent.style.cursor = 'grabbing';
            
            // 禁用图片的默认拖拽行为
            e.preventDefault();
            return;
        }

        isDragging = true;
        isVerticalDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        startTranslate = getTranslateX(slidesContainer);
        verticalTranslate = 0;
        slidesContainer.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        // ★★★ 处理放大模式下的拖拽移动 ★★★
        if (zoomDragging && isZoomMode) {
            e.preventDefault();
            
            // 计算移动距离
            const diffX = e.clientX - zoomStartX;
            const diffY = e.clientY - zoomStartY;
            
            // 获取当前显示的图片
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            
            // 新的平移位置 = 当前平移位置 + 移动距离
            const newTranslateX = zoomCurrentTranslateX + diffX;
            const newTranslateY = zoomCurrentTranslateY + diffY;
            
            // 应用平移和当前缩放
            activeImg.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${currentZoomLevel})`;
            
            // 更新起始位置
            zoomStartX = e.clientX;
            zoomStartY = e.clientY;
            
            // 更新当前平移位置
            zoomCurrentTranslateX = newTranslateX;
            zoomCurrentTranslateY = newTranslateY;
            
            return;
        }

        if (!isDragging) return;
        
        // 放大模式下不允许拖动切换/关闭
        if (isZoomMode) {
            return;
        }

        const x = e.clientX;
        const y = e.clientY;
        const diffX = x - startX;
        const diffY = y - startY;
        
        // 判断拖动方向
        if (!isVerticalDragging && Math.abs(diffY) > Math.abs(diffX)) {
            // 垂直拖动且角度大于45度（不再限制只有向下拖动）
            isVerticalDragging = true;
            slidesContainer.classList.add('vertical-dragging');
            
            // 仅在向下拖动时隐藏缩略图和标题
            if (diffY > 0) {
                thumbnailsContainer.classList.add('img-preview-hidden');
                captionContainer.classList.add('img-preview-hidden');
            }
        }
        
        if (isVerticalDragging) {
            // 垂直拖动 - 始终跟随鼠标移动
            verticalDistance = diffY;
            
            // 获取当前显示的图片
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            
            // 图片位置始终跟随鼠标移动
            if (diffY > 0) {
                // 向下拖动时，应用缩放和透明度变化效果
                const scale = Math.max(0.2, 1 - diffY / 1000);
                const blurValue = Math.max(0, 20 - (diffY / 500) * 20);
                const opacity = Math.max(0.3, 1 - diffY / 300);
                
                // 应用位移和缩放
                activeImg.style.transform = `translate(${diffX}px, ${diffY}px) scale(${scale})`;
                
                // 调整模态框透明度和模糊效果
                modal.style.backgroundColor = `rgba(51, 51, 51, ${opacity})`;
                modal.style.backdropFilter = `blur(${blurValue}px)`;
                modal.style.webkitBackdropFilter = `blur(${blurValue}px)`;
                
                // 向下拖动时隐藏缩略图和标题（确保动态响应方向变化）
                thumbnailsContainer.classList.add('img-preview-hidden');
                captionContainer.classList.add('img-preview-hidden');
            } else {
                // 向上拖动时，只应用位移，不改变其他效果
                activeImg.style.transform = `translate(${diffX}px, ${diffY}px)`;
                
                // 保持背景不变
                modal.style.backgroundColor = 'rgba(51, 51, 51, 1)';
                modal.style.backdropFilter = 'blur(20px)';
                modal.style.webkitBackdropFilter = 'blur(20px)';
                
                // 向上拖动时保持缩略图和标题可见
                thumbnailsContainer.classList.remove('img-preview-hidden');
                captionContainer.classList.remove('img-preview-hidden');
            }
            
            activeImg.style.transformOrigin = 'center';
            verticalTranslate = verticalDistance;
        } else {
            // 水平拖动 - 切换图片
            slidesContainer.style.transform = `translateX(${startTranslate + diffX}px)`;
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        // ★★★ 处理放大模式下的拖拽结束 ★★★
        if (zoomDragging) {
            zoomDragging = false;
            // 恢复手势为抓手状态
            modalContent.style.cursor = 'grab';
            return;
        }

        if (!isDragging) return;
        handleDragEnd(verticalDistance, isVerticalDragging);
    });
    
    // ★★★ 确保鼠标离开窗口时也能结束拖拽 ★★★
    document.addEventListener('mouseleave', () => {
        if (zoomDragging) {
            zoomDragging = false;
            modalContent.style.cursor = 'grab';
        }
    });
    
    // ★★★ 优化双指缩放变量 ★★★
    let initialPinchDistance = 0;
    let isPinching = false;
    let pinchStartZoom = 1;
    let pinchStartTranslateX = 0;
    let pinchStartTranslateY = 0;
    let initialTouchMidpoint = { x: 0, y: 0 };  // 记录初始双指中点在屏幕上的位置
    let initialImagePosition = { x: 0, y: 0 };  // 记录初始图片位置

    // 触摸滑动支持
    slidesContainer.addEventListener('touchstart', (e) => {
        if (!modal.classList.contains('active')) return;
        
        // 检测是否为双指缩放
        if (e.touches.length === 2) {
            e.preventDefault();
            
            // 启动双指缩放模式
            isPinching = true;
            
            // 计算两个触摸点之间的初始距离
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            initialPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            // 获取当前图片元素和其位置信息
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            const rect = activeImg.getBoundingClientRect();

            // 记录初始图片的变换状态
            pinchStartZoom = currentZoomLevel;
            pinchStartTranslateX = zoomCurrentTranslateX;
            pinchStartTranslateY = zoomCurrentTranslateY;

            // 计算初始双指中点在屏幕上的坐标
            initialTouchMidpoint = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };

            // 记录图片初始位置（中心点坐标）
            initialImagePosition = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            return;
        }
        
        // ★★★ 放大模式下的触摸拖拽开始 ★★★
        if (isZoomMode) {
            if (e.touches.length === 1) {
                zoomDragging = true;
                zoomStartX = e.touches[0].clientX;
                zoomStartY = e.touches[0].clientY;
                
                // 获取当前显示的图片
                const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
                
                // 解析当前的transform值，提取已有的translate部分
                const translateRegex = /translate\((.+?)px,\s*(.+?)px\)/;
                const transformValue = activeImg.style.transform;
                const translateMatch = transformValue.match(translateRegex);
                
                if (translateMatch) {
                    zoomCurrentTranslateX = parseFloat(translateMatch[1]);
                    zoomCurrentTranslateY = parseFloat(translateMatch[2]);
                } else {
                    zoomCurrentTranslateX = 0;
                    zoomCurrentTranslateY = 0;
                }
            }
            
            // 阻止默认行为（滚动、缩放等）
            e.preventDefault();
            return;
        }
        
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
        // 处理双指缩放
        if (isPinching && e.touches.length === 2) {
            e.preventDefault();
            
            // 获取当前双指距离
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            // 计算缩放比例变化
            const pinchRatio = currentDistance / initialPinchDistance;
            
            // 新的缩放级别 = 开始缩放时的级别 * 手指距离比例
            // 允许临时缩放至小于100%，但最小不低于50%
            let newZoom = pinchStartZoom * pinchRatio;
            newZoom = Math.max(0.5, Math.min(newZoom, 5));
            
            // 获取当前图片元素
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            if (!activeImg) return;
            
            // 计算当前双指中点
            const currentTouchMidpoint = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            
            // 获取图片原始尺寸和当前渲染尺寸
            const imgNaturalWidth = activeImg.naturalWidth;
            const imgNaturalHeight = activeImg.naturalHeight;
            const imageRect = activeImg.getBoundingClientRect();
            
            // 计算缩放前后的图片物理尺寸变化
            const preScaledWidth = imageRect.width / currentZoomLevel;
            const preScaledHeight = imageRect.height / currentZoomLevel;
            const newScaledWidth = preScaledWidth * newZoom;
            const newScaledHeight = preScaledHeight * newZoom;
            const deltaWidth = newScaledWidth - imageRect.width;
            const deltaHeight = newScaledHeight - imageRect.height;
            
            // 计算手指中点相对于当前图片中心的位置向量
            const imgCenterX = imageRect.left + imageRect.width / 2;
            const imgCenterY = imageRect.top + imageRect.height / 2;
            
            // 计算向量，从图片中心指向触摸中点
            const vectorX = currentTouchMidpoint.x - imgCenterX;
            const vectorY = currentTouchMidpoint.y - imgCenterY;
            
            // 计算这个向量相对于图片宽高的比例
            const relativeX = vectorX / (imageRect.width / 2);
            const relativeY = vectorY / (imageRect.height / 2);
            
            // 综合计算平移位置：
            // 1. 基本平移：手指位置变化导致的平移
            // 2. 缩放补偿：由于缩放导致的位移需要补偿
            let newTranslateX, newTranslateY;

            // 考虑手指中点移动
            const midpointDeltaX = currentTouchMidpoint.x - initialTouchMidpoint.x;
            const midpointDeltaY = currentTouchMidpoint.y - initialTouchMidpoint.y;
            
            // 计算在当前点缩放所需的补偿位移
            // 对于位于图片右侧的点，向右缩放时需要向左补偿，反之亦然
            const scaleCompensationX = -deltaWidth * relativeX * 0.5;
            const scaleCompensationY = -deltaHeight * relativeY * 0.5;
            
            // 结合手指移动和缩放补偿计算最终位置
            newTranslateX = pinchStartTranslateX + midpointDeltaX + scaleCompensationX;
            newTranslateY = pinchStartTranslateY + midpointDeltaY + scaleCompensationY;
            
            // 获取可移动边界信息
            const boundaries = calculateImageBoundaries(activeImg, newZoom);
            
            // 智能边界限制：只在图片尺寸超过容器时限制相应方向
            if (newZoom > 1) {
                // 只有当允许水平移动时才限制X轴
                if (boundaries.allowHorizontal) {
                    newTranslateX = Math.max(-boundaries.bounds.x, Math.min(boundaries.bounds.x, newTranslateX));
                } else {
                    // 不允许水平移动时强制居中
                    newTranslateX = 0;
                }
                
                // 只有当允许垂直移动时才限制Y轴
                if (boundaries.allowVertical) {
                    newTranslateY = Math.max(-boundaries.bounds.y, Math.min(boundaries.bounds.y, newTranslateY));
                } else {
                    // 不允许垂直移动时强制居中
                    newTranslateY = 0;
                }
            }
            
            // 更新缩放状态 - 即使缩放小于1也临时允许
            currentZoomLevel = newZoom;
            // 只有实际大于1时才标记为缩放模式
            const actualZoomMode = newZoom > 1;
            // 但我们不更新isZoomMode，仅在touchend时更新

            // 应用变换，不添加过渡效果以保持流畅感
            if (activeImg) {
                    activeImg.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${newZoom})`;
            }

            // 记录位置信息供结束时使用
            zoomCurrentTranslateX = newTranslateX;
            zoomCurrentTranslateY = newTranslateY;

            return;
        }
        
        // ★★★ 处理放大模式下的触摸拖拽移动 ★★★
        if (!isDragging || e.touches.length !== 1) return;
        
        // 放大模式下不允许拖动切换/关闭
        if (isZoomMode) {
            // ★★★ 添加单指拖拽平移逻辑 ★★★
            e.preventDefault(); // 阻止页面滚动

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            // 计算移动距离
            const diffX = currentX - zoomStartX;
            const diffY = currentY - zoomStartY;

            // 获取当前显示的图片
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            if (!activeImg) return;

            // 获取可移动边界信息
            const boundaries = calculateImageBoundaries(activeImg, currentZoomLevel);

            // 新的平移位置 = 当前平移位置 + 移动距离
            let newTranslateX = zoomCurrentTranslateX + diffX;
            let newTranslateY = zoomCurrentTranslateY + diffY;

            // 智能边界限制
            if (boundaries.allowHorizontal) {
                newTranslateX = Math.max(-boundaries.bounds.x, Math.min(boundaries.bounds.x, newTranslateX));
            } else {
                newTranslateX = 0;  // 如果图片宽度小于容器，强制水平居中
            }
            
            if (boundaries.allowVertical) {
                newTranslateY = Math.max(-boundaries.bounds.y, Math.min(boundaries.bounds.y, newTranslateY));
            } else {
                newTranslateY = 0;  // 如果图片高度小于容器，强制垂直居中
            }

            // 应用平移和当前缩放 (无过渡效果)
            activeImg.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${currentZoomLevel})`;

            // 更新起始位置以进行下一次移动计算
            zoomStartX = currentX;
            zoomStartY = currentY;

            // 更新当前的平移值
            zoomCurrentTranslateX = newTranslateX;
            zoomCurrentTranslateY = newTranslateY;
            // ★★★ 单指拖拽平移逻辑结束 ★★★

            return;
        }

        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const diffX = x - startX;
        const diffY = y - startY;
        
        // 判断拖动方向
        if (!isVerticalDragging && Math.abs(diffY) > Math.abs(diffX)) {
            // 垂直拖动且角度大于45度（不再限制只有向下拖动）
            isVerticalDragging = true;
            slidesContainer.classList.add('vertical-dragging');
            
            // 仅在向下拖动时隐藏缩略图和标题
            if (diffY > 0) {
                thumbnailsContainer.classList.add('img-preview-hidden');
                captionContainer.classList.add('img-preview-hidden');
            }
        }
        
        if (isVerticalDragging) {
            // 垂直拖动 - 始终跟随手指移动
            verticalDistance = diffY;
            
            // 获取当前显示的图片
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            
            // 图片位置始终跟随手指移动
            if (diffY > 0) {
                // 向下拖动时，应用缩放和透明度变化效果
                const scale = Math.max(0.5, 1 - diffY / 500);
                const blurValue = Math.max(0, 20 - (diffY / 300) * 20);
                const opacity = Math.max(0.3, 1 - diffY / 300);
                
                // 应用位移和缩放
                activeImg.style.transform = `translate(${diffX}px, ${diffY}px) scale(${scale})`;
                
                // 调整模态框透明度和模糊效果
                modal.style.backgroundColor = `rgba(51, 51, 51, ${opacity})`;
                modal.style.backdropFilter = `blur(${blurValue}px)`;
                modal.style.webkitBackdropFilter = `blur(${blurValue}px)`;
                
                // 向下拖动时隐藏缩略图和标题（确保动态响应方向变化）
                thumbnailsContainer.classList.add('img-preview-hidden');
                captionContainer.classList.add('img-preview-hidden');
            } else {
                // 向上拖动时，只应用位移，不改变其他效果
                activeImg.style.transform = `translate(${diffX}px, ${diffY}px)`;
                
                // 保持背景不变
                modal.style.backgroundColor = 'rgba(51, 51, 51, 1)';
                modal.style.backdropFilter = 'blur(20px)';
                modal.style.webkitBackdropFilter = 'blur(20px)';
                
                // 向上拖动时保持缩略图和标题可见
                thumbnailsContainer.classList.remove('img-preview-hidden');
                captionContainer.classList.remove('img-preview-hidden');
            }
            
            activeImg.style.transformOrigin = 'center';
            verticalTranslate = verticalDistance;
            
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
        // 处理双指缩放结束
        if (isPinching) {
            isPinching = false; // 结束缩放模式

            // 标记为曾经有多点触摸，防止误触发关闭
            wasTouchingWithMultipleFingers = true;
            
            // 获取当前图片
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            if (!activeImg) {
                return;
            }
            
            // 检查当前实际缩放级别
            if (currentZoomLevel < 1) {
                // 如果低于100%，添加平滑过渡回弹到100%并居中
                activeImg.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                activeImg.style.transform = '';
                
                // 重置缩放信息
                currentZoomLevel = 1;
                isZoomMode = false;
                zoomCurrentTranslateX = 0;
                zoomCurrentTranslateY = 0;
                
                // 移除过渡效果
                setTimeout(() => {
                    activeImg.style.transition = '';
                }, 300);
            } else if (currentZoomLevel > 1) {
                // 大于100%，保持缩放状态
                isZoomMode = true;
            } else {
                // 正好100%，重置所有变换
                activeImg.style.transform = '';
                isZoomMode = false;
                zoomCurrentTranslateX = 0;
                zoomCurrentTranslateY = 0;
            }

            if (e.touches.length === 1) { // 从 Pinch 变为单指
                if (isZoomMode) {
                    // 仍然处于放大模式，需要平滑过渡到单指拖拽
                    isDragging = true; // 允许拖拽
                    zoomDragging = true; // 进入放大拖拽模式

                    // 关键：重置拖拽起始点为当前剩余手指的位置
                    zoomStartX = e.touches[0].clientX;
                    zoomStartY = e.touches[0].clientY;
                    // zoomCurrentTranslateX/Y 保持不变，它们是 Pinch 操作的最终结果

                    // 可选：如果需要，也可以重置非缩放模式的拖拽起始点
                    startX = zoomStartX;
                    startY = zoomStartY;
                } else {
                    // 如果缩放刚好在手指抬起时结束 (newZoom <= 1)
                    // 则不进入拖拽模式，但仍标记为多点触摸过
                    isDragging = false;
                    zoomDragging = false;
                }
            } else if (e.touches.length === 0) { // 两指都已抬起
                // Pinch 完全结束
                isDragging = false;
                zoomDragging = false;
                // 根据是否仍在缩放状态设置光标
                if (isZoomMode) {
                    modalContent.style.cursor = 'grab';
                } else {
                    modalContent.style.cursor = '';
                }
            }
            // 已经处理了 Pinch 结束的逻辑，直接返回
            return;
        }

        // 处理放大模式下的触摸拖拽结束
        if (zoomDragging) {
            zoomDragging = false;
            // 拖拽结束，保持最终的 zoomCurrentTranslateX/Y
            // 如果仍在 Zoom 模式，设置光标为 grab
            if (isZoomMode) {
                 modalContent.style.cursor = 'grab';
            }
            return;
        }

        // 处理非 Pinch、非 Zoom Drag 的普通拖拽结束
        if (!isDragging) return;
        handleDragEnd(verticalDistance, isVerticalDragging);
        
        // 如果所有手指都离开屏幕，重置多点触摸标志
        if (e.touches.length === 0) {
            wasTouchingWithMultipleFingers = false;
        }
    });
    
    // 处理触摸取消事件
    slidesContainer.addEventListener('touchcancel', (e) => {
        isPinching = false;
        
        if (zoomDragging) {
            zoomDragging = false;
        }
        
        // 如果所有手指都离开屏幕，重置多点触摸标志
        if (e.touches.length === 0) {
            wasTouchingWithMultipleFingers = false;
        }
    });
    
    // ★★★ 优化鼠标滚轮缩放功能 ★★★
    slidesContainer.addEventListener('wheel', (e) => {
        if (!modal.classList.contains('active')) return;

        e.preventDefault(); // 阻止页面滚动

        const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
        if (!activeImg) return;

        // 获取图片原始尺寸和当前渲染尺寸
        const imgNaturalWidth = activeImg.naturalWidth;
        const imgNaturalHeight = activeImg.naturalHeight;
        const rect = activeImg.getBoundingClientRect();
        
        // 计算缩放前图片的实际渲染尺寸（移除当前缩放影响）
        const preScaledWidth = rect.width / currentZoomLevel;
        const preScaledHeight = rect.height / currentZoomLevel;

        // 获取鼠标在屏幕上的绝对位置
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // 计算鼠标相对于图片中心的位置
        const imgCenterX = rect.left + rect.width / 2;
        const imgCenterY = rect.top + rect.height / 2;
        
        // 计算鼠标相对于图片中心的向量
        const vectorX = mouseX - imgCenterX;
        const vectorY = mouseY - imgCenterY;
        
        // 计算这个向量相对于图片宽高的比例
        const relativeX = vectorX / (rect.width / 2);
        const relativeY = vectorY / (rect.height / 2);

        const delta = -e.deltaY; // 获取滚轮方向和幅度
        const zoomFactor = delta > 0 ? 0.1 : 0.1; // 缩放因子

        // 计算新的缩放级别，允许临时缩放低于100%
        let newZoom = currentZoomLevel + (delta > 0 ? zoomFactor : -zoomFactor);
        // 限制缩放范围在 50% 到 500%
        newZoom = Math.max(0.5, Math.min(newZoom, 5));

        // 如果缩放级别没有变化，则不执行后续操作
        if (newZoom === currentZoomLevel) return;
        
        // 计算缩放前后的图片物理尺寸变化
        const newScaledWidth = preScaledWidth * newZoom;
        const newScaledHeight = preScaledHeight * newZoom;
        const deltaWidth = newScaledWidth - rect.width;
        const deltaHeight = newScaledHeight - rect.height;
        
        // 计算缩放补偿
        const scaleCompensationX = -deltaWidth * relativeX * 0.5;
        const scaleCompensationY = -deltaHeight * relativeY * 0.5;
        
        // 计算最终位置
        let newTranslateX = zoomCurrentTranslateX + scaleCompensationX;
        let newTranslateY = zoomCurrentTranslateY + scaleCompensationY;
        
        // 获取可移动边界信息
        const boundaries = calculateImageBoundaries(activeImg, newZoom);
        
        // 智能边界限制
        if (newZoom > 1) {
            // 只有当允许水平移动时才限制X轴
            if (boundaries.allowHorizontal) {
                newTranslateX = Math.max(-boundaries.bounds.x, Math.min(boundaries.bounds.x, newTranslateX));
        } else {
                // 不允许水平移动时强制居中
                newTranslateX = 0;
            }
            
            // 只有当允许垂直移动时才限制Y轴
            if (boundaries.allowVertical) {
                newTranslateY = Math.max(-boundaries.bounds.y, Math.min(boundaries.bounds.y, newTranslateY));
            } else {
                // 不允许垂直移动时强制居中
                newTranslateY = 0;
            }
        }
        
        // 更新当前缩放级别
        currentZoomLevel = newZoom;
        
        // 应用变换，添加过渡效果使缩放更平滑
        activeImg.style.transition = 'transform 0.1s ease';
        
        if (newZoom < 1) {
            // 如果缩放小于100%，应用缩放但不更新isZoomMode状态
            activeImg.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${newZoom})`;
            // 保存位置信息，但不更改缩放模式
        zoomCurrentTranslateX = newTranslateX;
        zoomCurrentTranslateY = newTranslateY;
        
            // 设置一个定时器，在缩放停止后检查是否需要弹回
            clearTimeout(activeImg._zoomTimer);
            activeImg._zoomTimer = setTimeout(() => {
                // 如果仍处于低于100%的缩放状态，则弹回
                if (currentZoomLevel < 1) {
                    activeImg.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    activeImg.style.transform = '';
                    
                    // 重置缩放信息
                    currentZoomLevel = 1;
                    isZoomMode = false;
                    zoomCurrentTranslateX = 0;
                    zoomCurrentTranslateY = 0;
                    
                    // 恢复默认鼠标样式
                    modalContent.style.cursor = '';
                    
                    // 移除过渡效果
                    setTimeout(() => {
                        activeImg.style.transition = '';
                    }, 300);
                }
            }, 300);  // 300ms无滚轮操作后触发弹回
        } else if (newZoom > 1) {
            // 如果缩放大于100%，则进入缩放模式
            isZoomMode = true;
            activeImg.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${newZoom})`;
            zoomCurrentTranslateX = newTranslateX;
            zoomCurrentTranslateY = newTranslateY;
            
            // 进入放大模式，设置鼠标样式为抓手
            modalContent.style.cursor = 'grab';
        } else {
            // 缩放恰好等于100%，重置所有变换
            activeImg.style.transform = '';
            isZoomMode = false;
            zoomCurrentTranslateX = 0;
            zoomCurrentTranslateY = 0;
            
            // 重置所有拖拽状态
            zoomDragging = false;
            isDragging = false;
            isVerticalDragging = false;
            
            // 恢复默认鼠标样式
            modalContent.style.cursor = '';
        }
        
        // 移除过渡效果，避免干扰后续操作
        setTimeout(() => {
            if (currentZoomLevel >= 1) {  // 只在不需要弹回动画时清除过渡
            activeImg.style.transition = '';
            }
        }, 100);
    }, { passive: false });
    
    // ★★★ 处理鼠标拖动缩放后的图片 ★★★
    slidesContainer.addEventListener('mousedown', (e) => {
        if (!isZoomMode || !modal.classList.contains('active')) return;
        
        // 只有在缩放模式下才处理拖拽
        const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
        if (!activeImg) return;
        
        e.preventDefault(); // 防止选中文本
        
        zoomDragging = true;
        zoomStartX = e.clientX;
        zoomStartY = e.clientY;
        
        // 更改鼠标样式为抓取状态
        modalContent.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!zoomDragging) return;
        
        e.preventDefault();
        
        // 获取当前显示的图片
        const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
        if (!activeImg) return;
        
        // 计算移动距离
        const diffX = e.clientX - zoomStartX;
        const diffY = e.clientY - zoomStartY;
        
        // 获取可移动边界信息
        const boundaries = calculateImageBoundaries(activeImg, currentZoomLevel);
        
        // 新的平移位置
        let newTranslateX = zoomCurrentTranslateX + diffX;
        let newTranslateY = zoomCurrentTranslateY + diffY;
        
        // 智能边界限制
        if (boundaries.allowHorizontal) {
            newTranslateX = Math.max(-boundaries.bounds.x, Math.min(boundaries.bounds.x, newTranslateX));
        } else {
            newTranslateX = 0;  // 如果图片宽度小于容器，强制水平居中
        }
        
        if (boundaries.allowVertical) {
            newTranslateY = Math.max(-boundaries.bounds.y, Math.min(boundaries.bounds.y, newTranslateY));
        } else {
            newTranslateY = 0;  // 如果图片高度小于容器，强制垂直居中
        }
        
        // 应用平移
        activeImg.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${currentZoomLevel})`;
        
        // 更新起始位置以进行下一次移动计算
        zoomStartX = e.clientX;
        zoomStartY = e.clientY;
        
        // 更新当前平移值
        zoomCurrentTranslateX = newTranslateX;
        zoomCurrentTranslateY = newTranslateY;
    });
    
    document.addEventListener('mouseup', (e) => {
        if (zoomDragging) {
            zoomDragging = false;
            // 恢复手势为抓手状态
            if (isZoomMode) {
                modalContent.style.cursor = 'grab';
            } else {
                modalContent.style.cursor = '';
            }
        }
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

            // ★★★ 重置首次加载标志和缩放状态 ★★★
            isInitialLoad = true;
            currentZoomLevel = 1;
            isZoomMode = false;
            zoomCurrentTranslateX = 0;
            zoomCurrentTranslateY = 0;
            // ★★★ 重置鼠标样式 ★★★
            modalContent.style.cursor = '';
        }, 300);
    }
    
    // 监听窗口大小变化，保持当前图片居中
    window.addEventListener('resize', () => {
        if (modal.classList.contains('active')) {
            const slideWidth = modalContent.offsetWidth;
            slidesContainer.style.transition = 'none';
            slidesContainer.style.transform = `translateX(${-currentImageIndex * (slideWidth + 50)}px)`;
            
            // 获取当前图片元素
            const activeImg = slidesContainer.querySelector(`.img-preview-slide[data-index="${currentImageIndex}"] .img-preview-img`);
            if (!activeImg) return;
            
            // 暂存当前缩放状态
            const wasZoomMode = isZoomMode;
            const oldZoomLevel = currentZoomLevel;
            const oldTranslateX = zoomCurrentTranslateX;
            const oldTranslateY = zoomCurrentTranslateY;
            
            if (isZoomMode) {
                // 如果在缩放模式，计算相对位置的平移值
                const rect = activeImg.getBoundingClientRect();
                const imgWidth = rect.width / oldZoomLevel;
                const imgHeight = rect.height / oldZoomLevel;
                
                // 计算调整后的图片尺寸
                const viewportWidth = modalContent.offsetWidth;
                const viewportHeight = modalContent.offsetHeight;
                
                // 计算调整后的平移值，尽量保持相对于窗口的相对位置
                const relativeTranslateX = oldTranslateX / rect.width;
                const relativeTranslateY = oldTranslateY / rect.height;
                
                // 应用缩放但更新平移值
                zoomCurrentTranslateX = relativeTranslateX * rect.width;
                zoomCurrentTranslateY = relativeTranslateY * rect.height;
                
                // 应用变换，保持缩放级别但调整平移
                activeImg.style.transform = `translate(${zoomCurrentTranslateX}px, ${zoomCurrentTranslateY}px) scale(${oldZoomLevel})`;
                
                // 设置抓手样式
                modalContent.style.cursor = 'grab';
            } else {
                // 如果不在缩放模式，完全重置所有图片样式
                slidesContainer.querySelectorAll('.img-preview-img').forEach(img => {
                    img.style.transform = '';
                    img.style.transformOrigin = '';
                });
                
                // 重置所有拖拽状态
                zoomDragging = false;
                isDragging = false;
                isVerticalDragging = false;
                
                // 恢复默认鼠标样式
                modalContent.style.cursor = '';
            }
            
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
        
        // ★★★ 重置缩放状态和样式 ★★★
        currentZoomLevel = 1;
        isZoomMode = false;
        zoomCurrentTranslateX = 0;
        zoomCurrentTranslateY = 0;
        const activeImgForReset = slidesContainer.querySelector(`.img-preview-slide[data-index="${index}"] .img-preview-img`);
        if (activeImgForReset) {
            activeImgForReset.style.transform = '';
            activeImgForReset.style.transformOrigin = '';
        }
        // 重置所有图片的垂直位置和缩放
        slidesContainer.querySelectorAll('.img-preview-img').forEach(img => {
            img.style.transform = '';
            img.style.transformOrigin = ''; // ★★★ 确保重置 transform-origin
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

    // ★★★ 修改 handleDragEnd 函数，补充完整定义 ★★★
    // 处理拖动结束的公共函数
    function handleDragEnd(verticalDistance, isVerticalDragging) {
        // 如果处于放大模式，则不执行切换/关闭逻辑
        if (isZoomMode) {
            isDragging = false; // 仅重置拖动状态
            isVerticalDragging = false;
            // 未来添加平移后的处理逻辑
            return;
        }

        if (isVerticalDragging) {
            // 处理垂直拖动结束
            if (verticalDistance > 150) {
                // 只有向下拖动超过150px时才关闭预览
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
        
        // 确保重置所有拖动状态
        isDragging = false;
        isVerticalDragging = false;
    }

    // ★★★ 确保在缩放模式改变时正确重置状态 ★★★
    modalContent.addEventListener('click', function(e) {
        // ★★★ 如果处于放大模式，不关闭模态框 ★★★
        if (isZoomMode) {
            return;
        }
        
        if (!isModalContentDragging) {
            closeModal();
        }
    });

    // 计算图片边界限制的辅助函数
    function calculateImageBoundaries(img, zoom) {
        if (!img) return { allowHorizontal: false, allowVertical: false, bounds: { x: 0, y: 0 } };
        
        // 获取图片和容器的尺寸
        const rect = img.getBoundingClientRect();
        const containerRect = modalContent.getBoundingClientRect();
        
        // 计算缩放后的图片尺寸
        const scaledWidth = rect.width / currentZoomLevel * zoom;
        const scaledHeight = rect.height / currentZoomLevel * zoom;
        
        // 判断是否允许水平和垂直移动
        const allowHorizontal = scaledWidth > containerRect.width;
        const allowVertical = scaledHeight > containerRect.height;
        
        // 计算最大可移动范围（从中心点算起）
        const maxX = allowHorizontal ? Math.max(0, (scaledWidth - containerRect.width) / 2) : 0;
        const maxY = allowVertical ? Math.max(0, (scaledHeight - containerRect.height) / 2) : 0;
        
        return {
            allowHorizontal,
            allowVertical,
            bounds: { x: maxX, y: maxY }
        };
    }
});