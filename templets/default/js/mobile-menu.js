// 移动端菜单控制脚本
document.addEventListener('DOMContentLoaded', function() {
    // 获取菜单切换按钮和导航菜单
    var menuToggle = document.querySelector('.mobile-menu-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    
    if (menuToggle && mobileNav) {
        // 点击菜单按钮时切换导航菜单的显示状态
        menuToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            var pageBody = document.getElementById('pagebody');
            
            // 切换菜单按钮的样式
            var spans = menuToggle.querySelectorAll('span');
            if (mobileNav.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
                pageBody.classList.add('navopen');
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                pageBody.classList.remove('navopen');
            }
        });
        
        // 点击页面其他区域关闭菜单
        document.addEventListener('click', function(event) {
            if (!mobileNav.contains(event.target) && !menuToggle.contains(event.target) && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.getElementById('indexbody').classList.remove('navmenuopen');
                
                // 恢复菜单按钮样式
                var spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                document.getElementById('pagebody').classList.remove('navopen');
            }
        });
    }
});