class ImageCarousel {
    constructor(container) {
        this.container = container;
        this.items = container.querySelectorAll('.carousel-item');
        this.currentIndex = 0;
        this.totalItems = this.items.length;
        
        // Create navigation buttons
        this.createNavigationButtons();
        
        // Create dots
        this.createDots();
        
        // Initialize carousel
        this.updateCarousel();
        
        // Add event listeners
        this.addEventListeners();
        
        // Optional: Auto-play
        this.startAutoPlay();
    }
    
    createNavigationButtons() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-nav carousel-prev';
        prevBtn.innerHTML = '&lt;';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-nav carousel-next';
        nextBtn.innerHTML = '&gt;';
        
        this.container.appendChild(prevBtn);
        this.container.appendChild(nextBtn);
        
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
    }
    
    createDots() {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'carousel-dots';
        
        for (let i = 0; i < this.totalItems; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        }
        
        this.container.appendChild(dotsContainer);
        this.dots = dotsContainer.querySelectorAll('.carousel-dot');
    }
    
    updateCarousel() {
        // Update container position
        const container = this.container.querySelector('.carousel-container');
        container.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        
        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    addEventListeners() {
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        
        this.dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.goToSlide(index);
            });
        });
        
        // Pause auto-play on hover
        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
    }
    
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
        this.updateCarousel();
    }
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.totalItems;
        this.updateCarousel();
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => this.next(), 5000);
    }
    
    pauseAutoPlay() {
        clearInterval(this.autoPlayInterval);
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const carouselContainers = document.querySelectorAll('.image-carousel');
    carouselContainers.forEach(container => {
        new ImageCarousel(container);
    });
}); 