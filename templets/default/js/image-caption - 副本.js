// 引入CSS样式文件
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/templets/default/style/image-caption.css';
document.head.appendChild(link);

document.addEventListener('DOMContentLoaded', function() {
    // 获取文章内容区域中的所有图片
    const images = Array.from(document.querySelectorAll('.Content-Type img')).filter(img => img.id !== 'no-title');
    
    // 存储small-img的高度，用于后续点击事件使用
    let smallImgHeight = 0;
    
    // 计算过渡时间的函数（1000px/1s）
    const calculateTransitionDuration = (height) => {
        return (height / 5000).toFixed(2) + 's';
    };
    
    // 处理普通图片
    images.forEach(img => {
        // 创建外层包裹div
        const wrapper = document.createElement('div');
        wrapper.className = 'image-box';
        // 将图片包裹在新div中
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        // 获取图片的 title 属性内容并创建标题（如果存在）
        const titleText = img.getAttribute('title');
        if (titleText) {
            // 创建注释文本元素
            const caption = document.createElement('div');
            caption.className = 'image-caption';
            caption.textContent = titleText;
            wrapper.appendChild(caption);
        }
        // 父容器需设置相对定位
        wrapper.style.position = 'relative';
    });
    // 统一为所有图片切换按钮添加事件监听（改为页面已有按钮）
    const switchBtn = document.getElementById('switch-img-mode');
    const updateAllImageBox = (toSmall) => {
        const allWrappers = document.querySelectorAll('.image-box');
        if(!switchBtn) return;
        allWrappers.forEach(w => {
            if(toSmall){
                w.classList.add('small-box');
            }else{
                w.classList.remove('small-box');
            }
        });
        switchBtn.innerHTML = toSmall ? '<i class="iconfontb">&#xe628;</i> 切换大图模式' : '<i class="iconfontb">&#xe6d2;</i> 切换小图模式';
    };
    if(switchBtn){
        switchBtn.addEventListener('click', function() {
            const anyBox = document.querySelector('.image-box');
            const isSmall = anyBox && anyBox.classList.contains('small-box');
            updateAllImageBox(!isSmall);
        });
    }
    
    // 处理所有small-img的图片
    const smallImgs = document.querySelectorAll('img[id="small-img"]');
    smallImgs.forEach(smallImg => {
        // 获取图片高度并计算过渡时间
        let smallImgHeight = smallImg.offsetHeight;
        const transitionDuration = calculateTransitionDuration(smallImgHeight);
        
        // 创建small-img-box容器
        const smallImgBox = document.createElement('div');
        smallImgBox.className = 'samll-img-box';
        smallImgBox.style.transition = `all ${transitionDuration} ease`;
        
        // 创建title-bar容器
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        
        // 创建展开长图按钮
        const expandButton = document.createElement('div');
        expandButton.id = 'click-expand';
        
        // 创建图标元素
        const icon = document.createElement('i');
        icon.className = 'iconfontb';
        icon.innerHTML = '&#xe615;';
        
        // 创建文本节点
        const textNode = document.createTextNode('展开长图');
        
        // 将图标和文本添加到按钮中
        expandButton.appendChild(icon);
        expandButton.appendChild(textNode);
        
        // 重组DOM结构
        const wrapper = smallImg.parentNode;
        wrapper.insertBefore(smallImgBox, smallImg);
        wrapper.insertBefore(titleBar, smallImg);
        smallImgBox.appendChild(smallImg);
        
        // 获取已存在的image-caption并移动到title-bar中
        const existingCaption = wrapper.querySelector('.image-caption');
        if (existingCaption) {
            titleBar.appendChild(existingCaption);
        }
        titleBar.appendChild(expandButton);
        
        // 添加点击展开功能
        expandButton.addEventListener('click', function() {
            if (smallImgBox.classList.contains('caption-img')) {
                smallImgBox.classList.remove('caption-img');
                smallImgBox.style.removeProperty('max-height');
                icon.style.transform = 'rotate(0deg)';
                expandButton.lastChild.textContent = '展开长图';
            } else {
                smallImgBox.style.maxHeight = smallImgHeight + 'px';
                smallImgBox.classList.add('caption-img');
                icon.style.transform = 'rotate(180deg)';
                expandButton.lastChild.textContent = '收起长图';
            }
        });
    });
});