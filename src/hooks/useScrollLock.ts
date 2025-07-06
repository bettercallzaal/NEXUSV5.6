import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage scroll locking and prevent background scroll on mobile devices
 * Based on best practices for handling nested scrollable areas
 */
export function useScrollLock() {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const isIOS = useRef<boolean>(false);

  // Check if the device is iOS
  useEffect(() => {
    isIOS.current = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  // Function to prevent bounce effect on iOS scrollable elements
  const preventBounce = (element: HTMLElement) => {
    const { scrollTop, offsetHeight, scrollHeight } = element;
    
    // If at top, bump down 1px
    if (scrollTop <= 0) {
      element.scrollTo(0, 1);
      return;
    }
    
    // If at bottom, bump up 1px
    if (scrollTop + offsetHeight >= scrollHeight) {
      element.scrollTo(0, scrollHeight - offsetHeight - 1);
    }
  };

  // Function to lock scroll on the body when a modal or overlay is active
  const lockScroll = () => {
    document.body.classList.add('scroll-locked');
    if (isIOS.current) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    }
  };

  // Function to unlock scroll on the body
  const unlockScroll = () => {
    document.body.classList.remove('scroll-locked');
    if (isIOS.current) {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  };

  // Register a scrollable element
  const registerScrollable = (ref: HTMLDivElement | null) => {
    if (ref) {
      scrollableRef.current = ref;
      
      // Add momentum scrolling for iOS
      if (isIOS.current) {
        (ref.style as any)['-webkit-overflow-scrolling'] = 'touch';
        
        // Add touchstart listener to prevent bounce
        const touchStartHandler = () => preventBounce(ref);
        ref.addEventListener('touchstart', touchStartHandler);
        
        return () => {
          ref.removeEventListener('touchstart', touchStartHandler);
        };
      }
    }
    return () => {};
  };

  return {
    lockScroll,
    unlockScroll,
    registerScrollable,
    scrollableRef,
  };
}
