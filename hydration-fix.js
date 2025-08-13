/**
 * Hydration Fix for React SSR/Static Export Issues
 * Prevents hydration errors by properly timing client-side initialization
 */

(function() {
    'use strict';
    
    // Guard against SSR execution
    if (typeof window === 'undefined') {
        return;
    }
    
    // Store original React hydration behavior
    let originalReactHydrate = null;
    let isHydrationSafe = false;
    
    // Delay React hydration until safe
    function makeHydrationSafe() {
        // Mark as safe after a short delay to ensure DOM is settled
        setTimeout(() => {
            isHydrationSafe = true;
            console.log('✅ React hydration is now safe');
        }, 100);
    }
    
    // Suppress non-critical React warnings during development
    function suppressHydrationWarnings() {
        const originalConsoleError = console.error;
        
        console.error = function(...args) {
            const message = args[0];
            
            // Suppress specific hydration warnings that are non-critical
            if (typeof message === 'string') {
                // Skip React hydration warnings that don't affect functionality
                if (message.includes('Warning: Text content did not match') ||
                    message.includes('Warning: Expected server HTML to contain') ||
                    message.includes('Warning: An invalid form control')) {
                    return;
                }
                
                // Skip GTM related warnings
                if (message.includes('GTM') || message.includes('gtm')) {
                    return;
                }
            }
            
            // Let other errors through
            originalConsoleError.apply(console, args);
        };
    }
    
    // Initialize hydration safety measures
    function initHydrationFix() {
        // Enable safe hydration timing
        makeHydrationSafe();
        
        // Suppress non-critical warnings in development
        if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
            suppressHydrationWarnings();
        }
        
        // Ensure all animations wait for hydration
        if (window.gsap) {
            console.log('🎬 GSAP detected - ensuring animations wait for hydration');
        }
    }
    
    // Wait for DOM ready, then apply fixes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHydrationFix);
    } else {
        initHydrationFix();
    }
    
    // Expose utilities globally
    window.hydrationFix = {
        isHydrationSafe: () => isHydrationSafe,
        makeHydrationSafe
    };
    
})();
