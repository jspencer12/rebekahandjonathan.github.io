// Helper function to safely get DOM elements
const getElement = (id) => document.getElementById(id);

// Helper function to safely add event listeners
const addSafeEventListener = (element, event, handler) => {
    if (element) {
        element.addEventListener(event, handler);
    }
};

// Initialize countdown timer
function initializeCountdown() {
    const countdownDisplay = getElement('countdown');
    if (!countdownDisplay) return;

    const eventDate = new Date("June 28, 2025 13:45:00").getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = eventDate - now;

        if (distance < 0) {
            countdownDisplay.textContent = "Event has passed!";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownDisplay.textContent = `${days} DAYS, ${hours} HRS, ${minutes} MIN, ${seconds} SEC TO GO!`;
    }

    // Initial call to avoid delay
    updateCountdown();
    // Update every second
    setInterval(updateCountdown, 1000);
}

// Initialize mobile navigation menu
function initNavMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    if (!navLinks || !mobileMenuButton) return;

    // Add click event to mobile menu button
    mobileMenuButton.addEventListener('click', () => {
        if (!navLinks.classList.contains('open')) {
            navLinks.classList.add('open');
        } else {
            navLinks.classList.remove('open');
        }
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
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation menu
    initNavMenu();

    // Initialize countdown timer
    initializeCountdown();
});

// Re-initialize countdown when header is loaded
document.addEventListener('headerLoaded', () => {
    initializeCountdown();
});