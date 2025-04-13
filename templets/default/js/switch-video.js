/**
 * 视频检测与替换功能
 * 检查id为switch-video的图片元素，如果链接是视频格式则替换为视频元素
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有带有id="switch-video"的图片元素
    const switchElements = document.querySelectorAll('img[id="switch-video"]');
    
    // 视频格式的文件扩展名
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'm4v'];
    
    // 遍历所有找到的元素
    switchElements.forEach(function(imgElement) {
        // 获取图片的src属性
        const src = imgElement.getAttribute('src');
        
        // 如果没有src属性，则跳过
        if (!src) return;
        
        // 获取文件扩展名
        const fileExtension = src.split('.').pop().toLowerCase();
        
        // 检查是否为视频格式
        if (videoExtensions.includes(fileExtension)) {
            // 创建video元素
            const videoElement = document.createElement('video');
            
            // 设置video属性
            videoElement.id = 'switch-video';
            videoElement.className = imgElement.className;
            videoElement.setAttribute('autoplay', '');
            videoElement.setAttribute('loop', '');
            videoElement.setAttribute('muted', '');
            videoElement.setAttribute('playsinline', ''); // 支持iOS内联播放
            
            // 创建source元素
            const sourceElement = document.createElement('source');
            sourceElement.src = src;
            sourceElement.type = 'video/' + fileExtension;
            
            // 将source添加到video中
            videoElement.appendChild(sourceElement);
            
            // 替换原始的img元素
            imgElement.parentNode.replaceChild(videoElement, imgElement);
        }
    });
});