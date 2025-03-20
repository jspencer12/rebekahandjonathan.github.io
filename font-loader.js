// Font loading detection
document.documentElement.classList.add('fonts-loading');

if ('fonts' in document) {
    Promise.all([
        // Load Cormorant Garamond fonts
        document.fonts.load('1em "Cormorant Garamond"'),
        document.fonts.load('700 1em "Cormorant Garamond"'),
        // Load Lato fonts
        document.fonts.load('300 1em "Lato"'),
        document.fonts.load('400 1em "Lato"'),
        document.fonts.load('700 1em "Lato"')
    ]).then(() => {
        document.documentElement.classList.remove('fonts-loading');
    });
} else {
    // Fallback for browsers that don't support the Font Loading API
    setTimeout(() => {
        document.documentElement.classList.remove('fonts-loading');
    }, 300);
} 