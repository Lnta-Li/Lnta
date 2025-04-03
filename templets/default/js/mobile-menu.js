// 移动端菜单控制脚本
document.addEventListener('DOMContentLoaded', function() {
    // 获取菜单切换按钮和导航菜单
    var menuToggle = document.querySelector('.mobile-menu-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    var pageBody = document.getElementById('pagebody');
    
    // 初始化transform-origin
    updateTransformOrigin();
    
    // 监听页面滚动，实时更新transform-origin
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // 更新transform-origin的函数
    function updateTransformOrigin() {
        if (pageBody) {
            var x = window.pageXOffset + window.innerWidth / 2;
            var y = window.pageYOffset + window.innerHeight / 2;
            pageBody.style.transformOrigin = x + 'px ' + y + 'px';
        }
    }
    
    // 使用防抖函数包装updateTransformOrigin，设置200ms的延迟
    window.addEventListener('scroll', debounce(updateTransformOrigin, 200));
    
    if (menuToggle && mobileNav) {
        // 点击菜单按钮时切换导航菜单的显示状态
        menuToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            if (pageBody) {
                pageBody.classList.toggle('nav');
            }
            
            // 切换菜单按钮的样式
            var spans = menuToggle.querySelectorAll('span');
            if (mobileNav.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // 点击页面其他区域关闭菜单
        document.addEventListener('click', function(event) {
            if (!mobileNav.contains(event.target) && !menuToggle.contains(event.target) && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                if (pageBody) {
                    pageBody.classList.remove('nav');
                }
                
                // 恢复菜单按钮样式
                var spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
});