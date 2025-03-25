/**
 * 图片预览功能
 * 允许用户点击图片查看大图，支持鼠标滚轮缩放、拖拽平移和图片切换
 */
document.addEventListener('DOMContentLoaded', function() {
    // 创建模态框元素
    const modal = document.createElement('div');
    modal.className = 'img-preview-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'img-preview-content';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'img-preview-close';
    closeBtn.innerHTML = '&times;';
    
    const previewImg = document.createElement('img');
    previewImg.className = 'img-preview-img';
    
    // 添加图片描述文本元素
    const captionText = document.createElement('div');
    captionText.className = 'img-preview-caption';
    
    // 添加切换按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'img-preview-nav prev';
    prevBtn.innerHTML = '&#10094;';
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'img-preview-nav next';
    nextBtn.innerHTML = '&#10095;';
    
    // 添加缩略图容器
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'img-preview-thumbnails';
    
    // 添加缩略图拖动功能
    let isThumbDragging = false;
    let startThumbX = 0;
    let scrollLeft = 0;
    let hasDragged = false;
    
    thumbnailsContainer.addEventListener('mousedown', (e) => {
        isThumbDragging = true;
        hasDragged = false;
        thumbnailsContainer.style.cursor = 'grabbing';
        startThumbX = e.clientX;
        scrollLeft = thumbnailsContainer.scrollLeft;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isThumbDragging) return;
        e.preventDefault();
        const x = e.clientX;
        const walk = x - startThumbX;
        if (Math.abs(walk) > 5) { // 添加一个小的阈值，只有移动超过5像素才认为是拖动
            hasDragged = true;
        }
        thumbnailsContainer.scrollLeft = scrollLeft - walk;
    });
    
    document.addEventListener('mouseup', () => {
        isThumbDragging = false;
        thumbnailsContainer.style.cursor = 'grab';
    });
    
    document.addEventListener('mouseleave', () => {
        isThumbDragging = false;
        thumbnailsContainer.style.cursor = 'grab';
    });
    
    modalContent.appendChild(previewImg);
    modalContent.appendChild(captionText);
    modal.appendChild(closeBtn);
    modal.appendChild(prevBtn);
    modal.appendChild(nextBtn);
    modal.appendChild(modalContent);
    modal.appendChild(thumbnailsContainer);
    document.body.appendChild(modal);
    
    // 获取所有Content-Type类下的图片
    const images = Array.from(document.querySelectorAll('.Content-Type img'));
    
    // 当前缩放比例和位置
    let scale = 1;
    let originalWidth = 0;
    let originalHeight = 0;
    let currentImageIndex = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    
    // 创建缩略图
    const thumbnailsWrapper = document.createElement('div');
    thumbnailsWrapper.className = 'img-preview-thumbnails-wrapper';
    
    images.forEach((img, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = img.src;
        thumbnail.className = 'img-preview-thumbnail';
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
        previewImg.src = images[index].src;
        // 更新描述文本
        const altText = images[index].getAttribute('alt');
        if (altText && altText.trim() !== '') {
            captionText.style.display = 'block';
            captionText.textContent = altText;
        } else {
            captionText.style.display = 'none';
        }
        previewImg.onload = function() {
            originalWidth = this.width;
            originalHeight = this.height;
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateImageTransform();
            modal.classList.add('active');
            
            // 更新缩略图状态
            const thumbnails = thumbnailsWrapper.querySelectorAll('.img-preview-thumbnail');
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
            
            // 滚动缩略图到当前图片位置
            const activeThumb = thumbnails[index];
            const containerWidth = thumbnailsContainer.offsetWidth;
            const thumbWidth = activeThumb.offsetWidth;
            const thumbLeft = activeThumb.offsetLeft;
            const scrollLeft = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);
            
            // 添加平滑滚动效果
            thumbnailsContainer.style.scrollBehavior = 'smooth';
            thumbnailsContainer.scrollLeft = scrollLeft;
            
            // 滚动完成后移除平滑效果，以便拖动时保持即时响应
            setTimeout(() => {
                thumbnailsContainer.style.scrollBehavior = 'auto';
            }, 500);
        };
    }
    
    // 更新图片变换
    function updateImageTransform() {
        previewImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    
    // 为每个图片添加点击事件
    images.forEach((img, index) => {
        img.addEventListener('click', () => showImage(index));
        // 禁用默认拖拽行为
        img.draggable = false;
    });
    
    // 禁用预览图片的默认拖拽行为
    previewImg.draggable = false;
    
    // 关闭模态框
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 按ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // 鼠标滚轮缩放
    modal.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        if (!modal.classList.contains('active')) return;
        
        // 确定缩放方向
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        
        // 限制缩放范围
        const newScale = Math.max(0.1, Math.min(5, scale + delta));
        
        if (newScale !== scale) {
            scale = newScale;
            updateImageTransform();
        }
    });
    
    // 拖拽功能
    previewImg.addEventListener('mousedown', function(e) {
        if (!modal.classList.contains('active')) return;
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateImageTransform();
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // 切换图片
    prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showImage(currentImageIndex - 1);
    });
    
    nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showImage(currentImageIndex + 1);
    });
    
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            previewImg.src = '';
        }, 300);
    }
});