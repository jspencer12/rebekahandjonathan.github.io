// Helper function to safely get DOM elements
const getElement = (id) => document.getElementById(id);

// Helper function to safely add event listeners
const addSafeEventListener = (element, event, handler) => {
    if (element) {
        element.addEventListener(event, handler);
    }
};

// Flag to track if nav menu has been initialized
let navMenuInitialized = false;

// Initialize mobile navigation menu
function initNavMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    
    if (!navLinks || !mobileMenuButton || navMenuInitialized) {
        return;
    }

    console.log('Initializing mobile menu');
    
    // Add click event to mobile menu button
    mobileMenuButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mobile menu button clicked');
        navLinks.classList.toggle('open');
    });

    // Close menu when clicking links
    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            navLinks.classList.remove('open');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav') && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
        }
    });

    // Mark as initialized
    navMenuInitialized = true;
}

// Initialize countdown timer
function initCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    const eventDate = new Date('2025-06-28T00:00:00');
    const now = new Date();
    const diff = eventDate - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdownElement.textContent = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds until we say "I do"!`;
}

// Check and initialize components that might be loaded dynamically
function checkAndInitializeComponents() {
    console.log('Checking for components to initialize...');
    
    // If navigation components exist, initialize the nav menu
    if (document.querySelector('.mobile-menu-button') && document.querySelector('.nav-links')) {
        console.log('Found navigation components, initializing...');
        initNavMenu();
    }
    
    // If countdown exists, initialize it
    if (document.getElementById('countdown')) {
        initCountdown();
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    checkAndInitializeComponents();
    
    // Set up observer to watch for dynamic content loading
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                console.log('DOM changed, checking components...');
                checkAndInitializeComponents();
            }
        });
    });
    
    // Start observing the body for changes
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Update countdown every second
    setInterval(initCountdown, 1000);
});

// Legacy headerLoaded event support
document.addEventListener('headerLoaded', () => {
    console.log('headerLoaded event fired');
    checkAndInitializeComponents();
});