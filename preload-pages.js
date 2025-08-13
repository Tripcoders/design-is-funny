/**
 * Page Preloader using fetch (similar to wget)
 * Pre-loads all project pages to eliminate loading delays
 */

(function() {
    'use strict';
    
    // List of all project pages to preload
    const PROJECT_PAGES = [
        'project/synththeatre.html',
        'project/headspace.html',
        'project/insider.html',
        'project/fresco.html',
        'project/web3-misc.html',
        'project/the-yes.html',
        'project/google-arts-culture.html'
    ];
    
    // Cache for preloaded content
    const pageCache = new Map();
    
    // Preload a single page
    async function preloadPage(url) {
        try {
            console.log(`🔄 Preloading: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                cache: 'force-cache' // Use browser cache if available
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            pageCache.set(url, html);
            
            console.log(`✅ Preloaded: ${url}`);
            return html;
            
        } catch (error) {
            console.warn(`❌ Failed to preload ${url}:`, error);
            return null;
        }
    }
    
    // Preload all project pages
    async function preloadAllPages() {
        console.log('🚀 Starting page preloading...');
        
        const startTime = performance.now();
        
        // Preload pages in parallel
        const preloadPromises = PROJECT_PAGES.map(url => preloadPage(url));
        
        try {
            await Promise.allSettled(preloadPromises);
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            console.log(`🎉 Preloading completed in ${duration}ms`);
            console.log(`📦 Cached ${pageCache.size} pages`);
            
            // Dispatch custom event to notify that preloading is complete
            window.dispatchEvent(new CustomEvent('pagesPreloaded', {
                detail: {
                    cachedPages: Array.from(pageCache.keys()),
                    duration: duration
                }
            }));
            
        } catch (error) {
            console.error('❌ Error during preloading:', error);
        }
    }
    
    // Get cached page content
    function getCachedPage(url) {
        return pageCache.get(url);
    }
    
    // Check if page is cached
    function isPageCached(url) {
        return pageCache.has(url);
    }
    
    // Expose functions globally for use by transition script
    window.pagePreloader = {
        getCachedPage,
        isPageCached,
        preloadPage,
        cache: pageCache
    };
    
    // Start preloading when DOM is ready
    function initPreloader() {
        // Wait a bit for the main page to finish loading
        setTimeout(() => {
            preloadAllPages();
        }, 1000);
    }
    
    // Initialize preloader
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPreloader);
    } else {
        initPreloader();
    }
    
    // Preload pages on hover for instant loading
    function setupHoverPreloading() {
        const projectLinks = document.querySelectorAll('a[href*="project/"]');
        
        projectLinks.forEach(link => {
            link.addEventListener('mouseenter', function() {
                const url = this.getAttribute('href');
                
                if (!isPageCached(url)) {
                    preloadPage(url);
                }
            });
        });
    }
    
    // Setup hover preloading after a delay
    setTimeout(setupHoverPreloading, 2000);
    
})();

/**
 * Enhanced transition script integration
 */
(function() {
    'use strict';
    
    // Wait for preloader to be available
    function waitForPreloader() {
        if (window.pagePreloader) {
            enhanceTransitions();
        } else {
            setTimeout(waitForPreloader, 100);
        }
    }
    
    function enhanceTransitions() {
        // Listen for preloading completion
        window.addEventListener('pagesPreloaded', function(e) {
            console.log('🎯 Pages preloaded, enhancing transitions...');
            
            // Update the smooth transitions to use cached content
            if (window.smoothTransitions) {
                window.smoothTransitions.useCache = true;
            }
        });
        
        // Override the loadPageContent function if it exists
        const originalLoadPageContent = window.loadPageContent;
        
        window.loadPageContent = async function(url) {
            // Try to get from cache first
            const cachedContent = window.pagePreloader.getCachedPage(url);
            
            if (cachedContent) {
                console.log(`⚡ Using cached content for: ${url}`);
                return cachedContent;
            }
            
            // Fallback to original loading method
            if (originalLoadPageContent) {
                return await originalLoadPageContent(url);
            }
            
            // Final fallback
            try {
                const response = await fetch(url);
                return await response.text();
            } catch (error) {
                console.error('Error loading page:', error);
                return null;
            }
        };
    }
    
    // Start enhancement
    waitForPreloader();
    
})();
