import { useEffect, useRef, useState } from 'react';

const overlayMediaQuery = '(max-width: 1279px)';
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDrawerAccessibility(onClose: () => void) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isModal, setIsModal] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(overlayMediaQuery).matches,
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(overlayMediaQuery);
    const handleChange = (event: MediaQueryListEvent) => setIsModal(event.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isModal) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isModal]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      if (event.key === 'Escape') {
        const target = event.target;
        const containingDialog =
          target instanceof Element ? target.closest('[role="dialog"]') : null;

        if (containingDialog && containingDialog !== panel) {
          return;
        }

        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !isModal) {
        return;
      }

      const focusable = [...panel.querySelectorAll<HTMLElement>(focusableSelector)]
        .filter((element) => element.getAttribute('aria-hidden') !== 'true');

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModal]);

  return { closeButtonRef, isModal, panelRef };
}
