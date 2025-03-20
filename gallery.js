// Gallery Lightbox Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const gallery = document.querySelector('.gallery-grid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    
    // Variables
    let galleryImages = [];
    let currentImageIndex = 0;
    let preloadedImages = {};
    
    // Initialize
    function init() {
        // Get all gallery images
        galleryImages = Array.from(gallery.querySelectorAll('img'));
        
        // Add click event to each gallery image
        galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => {
                openLightbox(index);
            });
            
            // Preload images
            const preloadImg = new Image();
            preloadImg.src = img.src;
            preloadedImages[img.src] = preloadImg;
        });
        
        // Add event listeners
        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', showPrevImage);
        nextBtn.addEventListener('click', showNextImage);
        lightbox.addEventListener('click', handleLightboxClick);
        
        // Keyboard navigation
        document.addEventListener('keydown', handleKeyDown);
    }
    
    // Open lightbox with specific image
    function openLightbox(index) {
        currentImageIndex = index;
        const img = galleryImages[index];
        
        // Apply animations
        lightboxImg.classList.remove('fade-in');
        lightboxImg.classList.remove('scale-in');
        
        // Force reflow to restart animations
        void lightboxImg.offsetWidth;
        
        lightboxImg.classList.add('fade-in');
        lightboxImg.classList.add('scale-in');
        
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Preload adjacent images
        preloadAdjacentImages(index);
    }
    
    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
    }
    
    // Show previous image
    function showPrevImage(e) {
        if (e) e.stopPropagation();
        
        lightboxImg.classList.remove('fade-in');
        void lightboxImg.offsetWidth;
        lightboxImg.classList.add('fade-in');
        
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        const img = galleryImages[currentImageIndex];
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        
        // Preload adjacent images
        preloadAdjacentImages(currentImageIndex);
    }
    
    // Show next image
    function showNextImage(e) {
        if (e) e.stopPropagation();
        
        lightboxImg.classList.remove('fade-in');
        void lightboxImg.offsetWidth;
        lightboxImg.classList.add('fade-in');
        
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        const img = galleryImages[currentImageIndex];
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        
        // Preload adjacent images
        preloadAdjacentImages(currentImageIndex);
    }
    
    // Preload adjacent images for smoother navigation
    function preloadAdjacentImages(index) {
        const nextIndex = (index + 1) % galleryImages.length;
        const prevIndex = (index - 1 + galleryImages.length) % galleryImages.length;
        
        const nextImage = galleryImages[nextIndex];
        const prevImage = galleryImages[prevIndex];
        
        if (!preloadedImages[nextImage.src]) {
            const nextImg = new Image();
            nextImg.src = nextImage.src;
            preloadedImages[nextImage.src] = nextImg;
        }
        
        if (!preloadedImages[prevImage.src]) {
            const prevImg = new Image();
            prevImg.src = prevImage.src;
            preloadedImages[prevImage.src] = prevImg;
        }
    }
    
    // Handle clicks on lightbox
    function handleLightboxClick(e) {
        // Close lightbox when clicking outside the image
        if (e.target === lightbox) {
            closeLightbox();
        }
    }
    
    // Handle keyboard navigation
    function handleKeyDown(e) {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    }
    
    // Add touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightboxImg.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    lightboxImg.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const threshold = 50; // Minimum distance to register as swipe
        if (touchStartX - touchEndX > threshold) {
            // Swiped left - show next image
            showNextImage();
        } else if (touchEndX - touchStartX > threshold) {
            // Swiped right - show previous image
            showPrevImage();
        }
    }
    
    // Initialize gallery
    init();
}); 