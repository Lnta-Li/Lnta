// 引入CSS样式文件
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/templets/default/style/image-caption.css';
document.head.appendChild(link);

document.addEventListener('DOMContentLoaded', function() {    
    // 检查是否为iPhone设备，这里的检查是为了解决\js\image-preview.js里面的一个不知道原因的bug即：iphone上只有小图模式背景网页的位置才能跟随图片浏览器切换，但也有例外，比如在/a/Orther/2025/0417/49.html这个页面，虽然是小图模式，但还是无法正常切换
    let isSmallImg = false;
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('iphone') > -1) {
        // 如果是iPhone设备，直接启用小图模式
        isSmallImg = true;
    } else {
        // 不是iPhone设备，再检查是否为小图模式
        // 方法1：通过meta标签获取
        const smallImgMeta = document.querySelector('meta[name="small_img"]');
        if (smallImgMeta) {
            isSmallImg = smallImgMeta.getAttribute('content') === '1';
        }
    }
    // 获取文章内容区域中的所有图片，并排除id为no-title的图片
    const images = Array.from(document.querySelectorAll('.Content-Type img')).filter(img => img.id !== 'no-title');
    // 存储small-img的高度，用于后续点击事件使用
    let smallImgHeight = 0;
    // 计算过渡时间的函数（1000px/1s）
    const calculateTransitionDuration = (height) => {
        return (height / 2000).toFixed(2) + 's';
    };
    // 处理普通图片
    images.forEach((img, index) => {
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
        // 如果是小图模式，添加small-box类
        if (isSmallImg) {
            wrapper.classList.add('small-box');
        }
    });
    // 延迟执行，确保所有DOM结构都已创建完成
    setTimeout(() => {
        // 再次检查并确保所有image-box在小图模式下都添加了small-box类
        if (isSmallImg) {
            document.querySelectorAll('.image-box').forEach((box) => {
                if (!box.classList.contains('small-box')) {
                    box.classList.add('small-box');
                }
            });
        }
    }, 500);
    // 处理所有small-img的图片，并排除id为no-title的图片
    const smallImgs = Array.from(document.querySelectorAll('img[id="small-img"]')).filter(img => img.id !== 'no-title');
    // 优化：等待所有small-img图片加载完成后再处理
    const waitForImagesLoaded = (imgs) => {
        return Promise.all(imgs.map(img => {
            if (img.complete && img.naturalHeight !== 0) {
                return Promise.resolve();
            } else {
                return new Promise(resolve => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
            }
        }));
    };
    waitForImagesLoaded(smallImgs).then(() => {
        smallImgs.forEach(smallImg => {
            // 获取图片高度并计算过渡时间
            let smallImgHeight = smallImg.offsetHeight;
            const transitionDuration = calculateTransitionDuration(smallImgHeight);
            // 创建small-img-box容器
            const smallImgBox = document.createElement('div');
            smallImgBox.className = 'small-img-box';
            smallImgBox.style.transition = `all ${transitionDuration} ease`;
            smallImgBox.style.WebkitTransition = `all ${transitionDuration} ease`;
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

    // 如果是小图模式，添加提示条
    if (isSmallImg) {
        // 创建右下角悬浮窗的函数
        function createFloatBar() {
            if (!document.querySelector('.img-float-bar')) {
                const floatBar = document.createElement('div');
                floatBar.className = 'img-float-bar';
                // 保持预览按钮
                const floatKeepBtn = document.createElement('button');
                floatKeepBtn.className = 'float-btn keep-preview';
                floatKeepBtn.title = '保持预览模式';
                const floatKeepIcon = document.createElement('i');
                floatKeepIcon.className = 'iconfontb';
                floatKeepIcon.innerHTML = '&#xe6d2;';
                floatKeepBtn.appendChild(floatKeepIcon);
                // 切换大图按钮
                const floatSwitchBtn = document.createElement('button');
                floatSwitchBtn.className = 'float-btn switch-large';
                floatSwitchBtn.title = '切换大图浏览';
                const floatSwitchIcon = document.createElement('i');
                floatSwitchIcon.className = 'iconfontb';
                floatSwitchIcon.innerHTML = '&#xe628;';
                floatSwitchBtn.appendChild(floatSwitchIcon);
                // 绑定事件
                floatKeepBtn.addEventListener('click', () => {
                    document.querySelectorAll('.image-box').forEach(box => {
                        box.classList.add('small-box');
                    });
                });
                floatSwitchBtn.addEventListener('click', () => {
                    document.querySelectorAll('.image-box').forEach(box => {
                        box.classList.remove('small-box');
                    });
                });
                floatBar.appendChild(floatKeepBtn);
                floatBar.appendChild(floatSwitchBtn);
                document.body.appendChild(floatBar);
            }
        }
        // 创建提示条容器
        const noticeBar = document.createElement('div');
        noticeBar.className = 'small-img-notice';
        
        // 创建左侧文本
        const noticeText = document.createElement('div');
        noticeText.className = 'notice-text';
        const noticeIcon = document.createElement('i');
        noticeIcon.className = 'iconfontb';
        noticeIcon.innerHTML = '&#xe651;';
        noticeText.appendChild(noticeIcon);
        noticeText.appendChild(document.createTextNode('  当前文章作者设置了小图预览模式'));
        
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'notice-buttons';
        
        // 创建保持预览按钮
        const keepPreviewBtn = document.createElement('button');
        keepPreviewBtn.className = 'notice-btn keep-preview';
        const keepPreviewIcon = document.createElement('i');
        keepPreviewIcon.className = 'iconfontb';
        keepPreviewIcon.innerHTML = '&#xe6d2;';
        keepPreviewBtn.appendChild(keepPreviewIcon);
        keepPreviewBtn.appendChild(document.createTextNode('  保持预览模式'));
        
        // 创建切换大图按钮
        const switchLargeBtn = document.createElement('button');
        switchLargeBtn.className = 'notice-btn switch-large';
        const switchLargeIcon = document.createElement('i');
        switchLargeIcon.className = 'iconfontb';
        switchLargeIcon.innerHTML = '&#xe628;';
        switchLargeBtn.appendChild(switchLargeIcon);
        switchLargeBtn.appendChild(document.createTextNode('  切换大图浏览'));
        
        // 组装提示条
        buttonContainer.appendChild(keepPreviewBtn);
        buttonContainer.appendChild(switchLargeBtn);
        noticeBar.appendChild(noticeText);
        noticeBar.appendChild(buttonContainer);
        
        // 添加到页面
        document.body.appendChild(noticeBar);
        // 初始状态设置为透明
        noticeBar.style.opacity = '0';
        noticeBar.style.transition = 'opacity 0.3s ease';
        
        // 延迟5秒后显示
        setTimeout(() => {
            noticeBar.style.opacity = '1';
            // 设置10秒倒计时（不显示倒计时文本）
            let countdown = 10;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    // 执行保持预览模式的操作
                    noticeBar.style.opacity = '0';
                    noticeBar.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        noticeBar.remove();
                        createFloatBar();
                    }, 1000);
                }
            }, 1000);
            // 添加按钮事件监听
            const handleButtonClick = () => {
                clearInterval(countdownInterval);
            };
            keepPreviewBtn.addEventListener('click', () => {
                handleButtonClick();
                noticeBar.style.opacity = '0';
                noticeBar.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    noticeBar.remove();
                    createFloatBar();
                }, 1000);
            });
            switchLargeBtn.addEventListener('click', () => {
                handleButtonClick();
                document.querySelectorAll('.small-box').forEach(box => {
                    box.classList.remove('small-box');
                });
                noticeBar.style.opacity = '0';
                noticeBar.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    noticeBar.remove();
                    createFloatBar();
                }, 1000);
            });
        }, 5000);
    }
});