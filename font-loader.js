// Font loading detection
document.documentElement.classList.add('fonts-loading');

if ('fonts' in document) {
    Promise.all([
      // Load Cinzel fonts
      document.fonts.load('1em "Cinzel"'),
      document.fonts.load('600 1em "Cinzel"'),
      // Load Lato fonts
      document.fonts.load('300 1em "Lato"'),
      document.fonts.load('400 1em "Lato"'),
      document.fonts.load('600 1em "Lato"'),
      // Load EB Garamond fonts
      document.fonts.load('400 1em "EB Garamond"'),
      document.fonts.load('500 1em "EB Garamond"'),
      document.fonts.load('600 1em "EB Garamond"'),
      document.fonts.load('400 italic 1em "EB Garamond"'),
    ]).then(() => {
      document.documentElement.classList.remove("fonts-loading");
    });
} else {
    // Fallback for browsers that don't support the Font Loading API
    setTimeout(() => {
        document.documentElement.classList.remove('fonts-loading');
    }, 300);
} 