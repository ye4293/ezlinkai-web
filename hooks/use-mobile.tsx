'use client';

import { useEffect, useState } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始检查
    checkMobile();

    // 添加窗口大小变化监听器
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        width,
        height,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    // 初始检查
    updateScreenSize();

    // 添加窗口大小变化监听器
    window.addEventListener('resize', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, []);

  return screenSize;
}
