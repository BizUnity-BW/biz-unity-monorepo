import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

/**
 * Applies the stored theme to <html data-theme="..."> on mount.
 * Call once at the root of the app (App.tsx).
 */
export function useThemeInit(): void {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}
