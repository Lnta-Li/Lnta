document.addEventListener('DOMContentLoaded', function() {
    // 获取文章内容区域中的所有图片
    const images = document.querySelectorAll('.Content-Type img');
    
    images.forEach(img => {
        // 获取图片的 title 属性内容
        const titleText = img.getAttribute('title');
        
        if (titleText) {
            // 创建注释文本元素
            const caption = document.createElement('div');
            caption.className = 'image-caption';
            caption.textContent = titleText;
            
            // 创建外层包裹div
            const wrapper = document.createElement('div');
            wrapper.className = 'image-box';
            
            // 将图片和标题包裹在新div中
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
            wrapper.appendChild(caption);
        }
    });
});