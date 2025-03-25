document.addEventListener('DOMContentLoaded', function() {
    // 获取文章内容区域中的所有图片
    const images = document.querySelectorAll('.Content-Type img');
    
    images.forEach(img => {
        // 获取图片的 alt 属性内容
        const altText = img.getAttribute('alt');
        
        if (altText) {
            // 创建注释文本元素
            const caption = document.createElement('div');
            caption.className = 'image-caption';
            caption.textContent = altText;
            
            // 将注释插入到图片后面
            img.parentNode.insertBefore(caption, img.nextSibling);
        }
    });
}); 