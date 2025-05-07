/**
 * 图片处理模块
 * 处理文章中的图片显示、长图展开收起、小图模式提示等功能
 */
document.addEventListener('DOMContentLoaded', () => {
    // 配置常量
    const CONFIG = {
        transition: { // 过渡时间配置
            base: 2000, // 过渡时间计算基数（2000px/1s）
            fadeInOut: '0.3s', // 淡入淡出过渡时间
            hide: '0.5s' // 隐藏元素过渡时间
        },
        
        timeout: { // 延时配置
            domComplete: 500, // DOM结构创建完成后的检查延时
            noticeShow: 5000, // 提示条显示延时
            noticeAutoHide: 10, // 提示条自动消失倒计时
            noticeRemove: 1000 // 提示条消失后的延时
        },
        
        selector: { // 选择器配置
            contentImages: '.Content-Type img', // 内容区域图片选择器
            longImg: 'img[id="long-img"]', // 长图选择器
            excludeImgId: 'no-title', // 不处理的图片ID
        },
        
        longImg: { // 长图配置
            expandIcon: '&#xe615;', // 展开按钮图标编码
            expandText: '展开长图', // 展开按钮文本
            collapseText: '收起长图' // 收起按钮文本
        },
        
        smallImgUI: { // 小图模式UI配置
            noticeIcon: '&#xe651;', // 提示图标编码
            noticeText: '  当前文章作者设置了小图预览模式', // 提示文本
            keepIcon: '&#xe6d2;', // 保持预览按钮图标编码
            keepText: '  保持预览模式', // 保持预览按钮文本
            switchIcon: '&#xe628;', // 切换大图按钮图标编码
            switchText: '  切换大图浏览', // 切换大图按钮文本
            floatKeepTitle: '保持预览模式', // 悬浮栏保持预览按钮标题
            floatSwitchTitle: '切换大图浏览' // 悬浮栏切换大图按钮标题
        }
    };
    
    // 工具函数模块
    const utils = {
        calculateTransitionDuration(height) { // 计算过渡时间
            return (height / CONFIG.transition.base).toFixed(2) + 's';
        },
        
        waitForImagesLoaded(imgs) { // 等待所有图片加载完成
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
        },
        
        createElement(tag, attrs = {}, children = []) { // 创建DOM元素并设置属性
            const element = document.createElement(tag);
            
            Object.entries(attrs).forEach(([key, value]) => { // 设置属性
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'style') {
                    Object.entries(value).forEach(([prop, val]) => {
                        element.style[prop] = val;
                    });
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            if (children) { // 添加子元素
                if (Array.isArray(children)) {
                    children.forEach(child => {
                        if (child) element.appendChild(child);
                    });
                } else {
                    element.appendChild(children);
                }
            }
            
            return element;
        }
    };
    
    // 小图模式检测模块
    const smallImgMode = {
        detect() { // 检测是否为小图模式
            const userAgent = navigator.userAgent.toLowerCase(); // 检查是否为iPhone设备
            if (userAgent.indexOf('iphone') > -1) {
                return true;
            }
            
            const smallImgMeta = document.querySelector('meta[name="small_img"]'); // 通过meta标签检查是否为小图模式
            return smallImgMeta ? smallImgMeta.getAttribute('content') === '1' : false;
        },
        
        applyToContainers(isSmallImg) { // 应用小图模式到图片容器
            if (!isSmallImg) return;
            
            setTimeout(() => { // 延迟执行，确保所有DOM结构都已创建完成
                document.querySelectorAll('.image-box').forEach((box) => {
                    if (!box.classList.contains('small-box')) {
                        box.classList.add('small-box');
                    }
                });
            }, CONFIG.timeout.domComplete);
        },
        
        toggleMode(toSmallMode) { // 切换图片显示模式
            document.querySelectorAll('.image-box').forEach(box => {
                if (toSmallMode) {
                    box.classList.add('small-box');
                } else {
                    box.classList.remove('small-box');
                }
            });
        }
    };
    
    // 普通图片处理模块
    const normalImageProcessor = {
        process(isSmallImg) { // 处理普通图片
            const images = Array.from(document.querySelectorAll(CONFIG.selector.contentImages)) // 获取文章内容区域中的所有图片，并排除特定ID的图片
                .filter(img => img.id !== CONFIG.selector.excludeImgId && img.id !== 'long-img');
                
            images.forEach(img => {
                const wrapperClass = isSmallImg ? // 创建外层包裹div
                    'image-box small-box' : 
                    'image-box';
                    
                const wrapper = utils.createElement('div', {
                    className: wrapperClass
                });
                
                img.parentNode.insertBefore(wrapper, img); // 将图片包裹在新div中
                wrapper.appendChild(img);
                
                const titleText = img.getAttribute('title'); // 获取图片的title属性内容并创建标题（如果存在）
                if (titleText) {
                    const caption = utils.createElement('div', {
                        className: 'image-caption',
                        textContent: titleText
                    });
                    wrapper.appendChild(caption);
                }
            });
        }
    };
    
    // 长图处理模块
    const longImageProcessor = {
         processLongImage(longImg, isSmallImg) { // 处理单个长图
            const imgHeight = longImg.offsetHeight; // 获取图片高度并计算过渡时间
            const transitionDuration = utils.calculateTransitionDuration(imgHeight);
            
            const longImgBox = utils.createElement('div', { // 创建长图容器
                className: 'long-img-box',
                style: {
                    transition: `all ${transitionDuration} ease`,
                    WebkitTransition: `all ${transitionDuration} ease`
                }
            });
            
            const titleBar = utils.createElement('div', { // 创建标题栏
                className: 'title-bar',
                style: {
                    cursor: 'pointer'
                }
            });
            
            const icon = utils.createElement('i', { // 创建展开按钮
                className: 'iconfontb',
                innerHTML: CONFIG.longImg.expandIcon
            });
            
            const expandButton = utils.createElement('div', {
                id: 'click-expand'
            }, [
                icon,
                document.createTextNode(CONFIG.longImg.expandText)
            ]);
            
            const wrapper = longImg.parentNode; // 重组DOM结构
            wrapper.insertBefore(longImgBox, longImg);
            wrapper.insertBefore(titleBar, longImg);
            longImgBox.appendChild(longImg);
            
            const existingCaption = wrapper.querySelector('.image-caption'); // 获取已存在的image-caption并移动到title-bar中
            if (existingCaption) {
                titleBar.appendChild(existingCaption);
            }
            
            titleBar.appendChild(expandButton);
            
            titleBar.addEventListener('click', () => { // 添加点击展开功能
                if (longImgBox.classList.contains('caption-img')) {
                    longImgBox.classList.remove('caption-img');
                    longImgBox.style.removeProperty('max-height');
                    icon.style.transform = 'rotate(0deg)';
                    expandButton.lastChild.textContent = CONFIG.longImg.expandText;
                } else {
                    longImgBox.style.maxHeight = imgHeight + 'px';
                    longImgBox.classList.add('caption-img');
                    icon.style.transform = 'rotate(180deg)';
                    expandButton.lastChild.textContent = CONFIG.longImg.collapseText;
                }
            });
            
            if (isSmallImg && wrapper.classList.contains('image-box')) { // 如果是小图模式，添加small-box类
                wrapper.classList.add('small-box');
            }
        }
    };
    
    // 小图模式UI模块
    const smallImgUI = {
        create(isSmallImg) { // 创建小图模式UI
            if (!isSmallImg) return;
            this.createNoticeBar();
        },
        
        createNoticeBar() { // 创建提示条
            const noticeBar = utils.createElement('div', { // 创建提示条容器
                className: 'small-img-notice',
                style: {
                    opacity: '0',
                    transition: `opacity ${CONFIG.transition.fadeInOut} ease`
                }
            });
            
            const noticeIcon = utils.createElement('i', { // 创建左侧文本
                className: 'iconfontb',
                innerHTML: CONFIG.smallImgUI.noticeIcon
            });
            
            const noticeText = utils.createElement('div', {
                className: 'notice-text'
            }, [
                noticeIcon,
                document.createTextNode(CONFIG.smallImgUI.noticeText)
            ]);
            
            const buttonContainer = utils.createElement('div', { // 创建按钮容器
                className: 'notice-buttons'
            });
            
            const keepPreviewIcon = utils.createElement('i', { // 创建保持预览按钮
                className: 'iconfontb',
                innerHTML: CONFIG.smallImgUI.keepIcon
            });
            
            const keepPreviewBtn = utils.createElement('button', {
                className: 'notice-btn keep-preview'
            }, [
                keepPreviewIcon,
                document.createTextNode(CONFIG.smallImgUI.keepText)
            ]);
            
            const switchLargeIcon = utils.createElement('i', { // 创建切换大图按钮
                className: 'iconfontb',
                innerHTML: CONFIG.smallImgUI.switchIcon
            });
            
            const switchLargeBtn = utils.createElement('button', {
                className: 'notice-btn switch-large'
            }, [
                switchLargeIcon,
                document.createTextNode(CONFIG.smallImgUI.switchText)
            ]);
            
            buttonContainer.appendChild(keepPreviewBtn); // 组装提示条
            buttonContainer.appendChild(switchLargeBtn);
            noticeBar.appendChild(noticeText);
            noticeBar.appendChild(buttonContainer);
            
            document.body.appendChild(noticeBar); // 添加到页面
            
            setTimeout(() => { // 延迟显示
                noticeBar.style.opacity = '1';
                
                let countdown = CONFIG.timeout.noticeAutoHide; // 设置倒计时
                const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                        this.hideNoticeBar(noticeBar, true);
                    }
                }, 1000);
                
                const handleButtonClick = () => clearInterval(countdownInterval); // 添加按钮事件
                
                keepPreviewBtn.addEventListener('click', () => {
                    handleButtonClick();
                    this.hideNoticeBar(noticeBar, true);
                });
                
                switchLargeBtn.addEventListener('click', () => {
                    handleButtonClick();
                    smallImgMode.toggleMode(false);
                    this.hideNoticeBar(noticeBar, true);
                });
            }, CONFIG.timeout.noticeShow);
        },
        
        hideNoticeBar(noticeBar, createFloat = false) { // 隐藏提示条并创建悬浮栏
            noticeBar.style.opacity = '0';
            noticeBar.style.transition = `opacity ${CONFIG.transition.hide} ease`;
            
            setTimeout(() => {
                noticeBar.remove();
                if (createFloat) this.createFloatBar();
            }, CONFIG.timeout.noticeRemove);
        },
        
        createFloatBar() { // 创建悬浮栏
            if (document.querySelector('.img-float-bar')) return;
            
            const floatBar = utils.createElement('div', { // 创建悬浮栏
                className: 'img-float-bar'
            });
            
            const floatKeepIcon = utils.createElement('i', { // 创建保持预览按钮
                className: 'iconfontb',
                innerHTML: CONFIG.smallImgUI.keepIcon
            });
            
            const floatKeepBtn = utils.createElement('button', {
                className: 'float-btn keep-preview',
                title: CONFIG.smallImgUI.floatKeepTitle
            }, floatKeepIcon);
            
            const floatSwitchIcon = utils.createElement('i', { // 创建切换大图按钮
                className: 'iconfontb',
                innerHTML: CONFIG.smallImgUI.switchIcon
            });
            
            const floatSwitchBtn = utils.createElement('button', {
                className: 'float-btn switch-large',
                title: CONFIG.smallImgUI.floatSwitchTitle
            }, floatSwitchIcon);
            
            floatKeepBtn.addEventListener('click', () => smallImgMode.toggleMode(true)); // 绑定事件
            floatSwitchBtn.addEventListener('click', () => smallImgMode.toggleMode(false));
            
            floatBar.appendChild(floatKeepBtn); // 组装悬浮栏
            floatBar.appendChild(floatSwitchBtn);
            document.body.appendChild(floatBar);
        }
    };
    
    // 主程序初始化
    const init = () => {
        const isSmallImg = smallImgMode.detect(); // 检测是否为小图模式
        
        normalImageProcessor.process(isSmallImg); // 处理普通图片
        
        smallImgMode.applyToContainers(isSmallImg); // 应用小图模式到容器
        
        smallImgUI.create(isSmallImg); // 创建小图模式UI
    };
    
    init(); // 启动程序

    // 使用window.onload确保在所有图片和资源加载完成后再处理长图
    window.addEventListener('load', () => {
        const isSmallImg = smallImgMode.detect();
        
        // 处理长图
        const longImgs = Array.from(document.querySelectorAll(CONFIG.selector.longImg))
            .filter(img => img.id !== CONFIG.selector.excludeImgId);
            
        if (longImgs.length > 0) {
            longImgs.forEach(longImg => longImageProcessor.processLongImage(longImg, isSmallImg));
        }
    });
});