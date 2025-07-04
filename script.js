// Initialize mobile navigation menu
function initNavMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    
    if (!navLinks || !mobileMenuButton) return;
    
    // Toggle menu on button click
    mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav') && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
        }
    });
}

// Initialize countdown timer
function initCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    const eventDate = new Date('2025-06-28T00:00:00');
    
    function updateCountdown() {
        const now = new Date();
        const diff = eventDate - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // countdownElement.textContent = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds until we say "I do"!`;
        countdownElement.textContent = `${days} day${
          days === 1 ? "" : "s"
        } until we say "I do"!`;
    }

    // Initial update and set interval
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

initNavMenu();
initCountdown();
