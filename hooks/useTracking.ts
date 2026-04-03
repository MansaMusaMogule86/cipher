'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackVisitor, trackButtonClick } from '@/lib/analytics/posthog';

export function useAutoTracking() {
  const pathname = usePathname();

  useEffect(() => {
    trackVisitor({ page: pathname, referrer: document.referrer });

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button, a[role="button"]');
      if (button) {
        const buttonText = button.textContent?.trim() || 'Unknown';
        trackButtonClick(buttonText, { page: pathname });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);
}
