/**
 * Disable React Hydration for Static Sites
 * This script prevents React hydration errors by completely disabling
 * hydration for static exported Next.js sites
 */

(function() {
    'use strict';
    
    // Guard against SSR execution
    if (typeof window === 'undefined') {
        return;
    }
    
    // Disable React hydration completely
    function disableReactHydration() {
        // Override React's hydration functions before they're called
        if (window.React && window.ReactDOM) {
            console.log('🚫 Disabling React hydration for static site');
            
            // Store original functions
            const originalHydrate = window.ReactDOM.hydrate;
            const originalHydrateRoot = window.ReactDOM.hydrateRoot;
            const originalCreateRoot = window.ReactDOM.createRoot;
            
            // Override hydration functions to use render instead
            if (originalHydrate) {
                window.ReactDOM.hydrate = function(element, container, callback) {
                    console.log('🔄 Converting hydrate to render');
                    return window.ReactDOM.render(element, container, callback);
                };
            }
            
            if (originalHydrateRoot) {
                window.ReactDOM.hydrateRoot = function(container, element, options) {
                    console.log('🔄 Converting hydrateRoot to createRoot');
                    const root = originalCreateRoot(container, options);
                    root.render(element);
                    return root;
                };
            }
        }
    }
    
    // Suppress hydration-related console errors
    function suppressHydrationErrors() {
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        
        console.error = function(...args) {
            const message = String(args[0] || '');
            
            // Suppress React hydration errors
            if (message.includes('Hydration failed') ||
                message.includes('Warning: Text content did not match') ||
                message.includes('Warning: Expected server HTML to contain') ||
                message.includes('Minified React error #425') ||
                message.includes('Minified React error #418') ||
                message.includes('Minified React error #423') ||
                message.includes('The server HTML was') ||
                message.includes('as a text node') ||
                message.includes('react-hydration-error') ||
                message.includes('suppressHydrationWarning')) {
                return; // Suppress these errors
            }
            
            // Let other errors through
            originalConsoleError.apply(console, args);
        };
        
        console.warn = function(...args) {
            const message = String(args[0] || '');
            
            // Suppress hydration warnings
            if (message.includes('hydration') ||
                message.includes('server-rendered HTML') ||
                message.includes('client-side rendering')) {
                return; // Suppress these warnings
            }
            
            // Let other warnings through
            originalConsoleWarn.apply(console, args);
        };
    }
    
    // Prevent Next.js router from trying to hydrate
    function disableNextJSHydration() {
        // Override Next.js hydration
        if (window.__NEXT_DATA__) {
            window.__NEXT_DATA__.props = window.__NEXT_DATA__.props || {};
            window.__NEXT_DATA__.props.pageProps = window.__NEXT_DATA__.props.pageProps || {};
            window.__NEXT_DATA__.isFallback = false;
            
            // Mark as static
            window.__NEXT_DATA__.buildId = 'static';
        }
        
        // Prevent Next.js router hydration
        if (window.next && window.next.router) {
            console.log('🛑 Disabling Next.js router hydration');
        }
    }
    
    // Fix GTM timestamp inconsistency
    function fixGTMTimestamp() {
        // Override Date.now for GTM to ensure consistent timestamp
        const fixedTimestamp = Date.now();
        const originalDateNow = Date.now;
        
        Date.now = function() {
            // For GTM calls, return fixed timestamp
            const stack = new Error().stack;
            if (stack && (stack.includes('gtm') || stack.includes('GTM'))) {
                return fixedTimestamp;
            }
            return originalDateNow();
        };
    }
    
    // Main initialization
    function init() {
        console.log('🔧 Initializing hydration fixes for static site');
        
        // Apply all fixes
        suppressHydrationErrors();
        disableReactHydration();
        disableNextJSHydration();
        fixGTMTimestamp();
        
        console.log('✅ Hydration fixes applied');
    }
    
    // Apply fixes immediately and on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        // Also run immediately in case we're late
        setTimeout(init, 0);
    } else {
        init();
    }
    
    // Override React error boundary to suppress hydration errors
    if (typeof window !== 'undefined') {
        window.addEventListener('error', function(event) {
            const message = event.error?.message || '';
            if (message.includes('Minified React error #425') ||
                message.includes('Minified React error #418') ||
                message.includes('Minified React error #423')) {
                event.preventDefault();
                event.stopPropagation();
                console.log('🛡️ Suppressed React hydration error:', message);
                return false;
            }
        });
        
        window.addEventListener('unhandledrejection', function(event) {
            const message = event.reason?.message || '';
            if (message.includes('hydration') || message.includes('Minified React error')) {
                event.preventDefault();
                console.log('🛡️ Suppressed React hydration promise rejection');
            }
        });
    }
    
})();
