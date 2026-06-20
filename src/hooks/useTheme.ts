import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode, LayoutDensity, Season } from '../types';

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('sv-theme-mode');
    if (saved && ['light', 'dark', 'sepia'].includes(saved)) return saved as ThemeMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>(() => {
    const saved = localStorage.getItem('sv-layout-density');
    if (saved && ['compact', 'comfortable', 'spacious'].includes(saved)) return saved as LayoutDensity;
    return 'comfortable';
  });

  const [season, setSeason] = useState<Season>(() => {
    const saved = localStorage.getItem('sv-season');
    if (saved && ['spring', 'summer', 'autumn', 'winter'].includes(saved)) return saved as Season;
    return 'spring';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeMode);
    root.setAttribute('data-season', season);

    const headerH = layoutDensity === 'compact' ? 44 : layoutDensity === 'spacious' ? 60 : 52;
    root.style.setProperty('--header-h', `${headerH}px`);

    localStorage.setItem('sv-theme-mode', themeMode);
    localStorage.setItem('sv-layout-density', layoutDensity);
    localStorage.setItem('sv-season', season);

    if (themeMode === 'dark') {
      root.style.colorScheme = 'dark';
    } else {
      root.style.colorScheme = 'light';
    }
  }, [themeMode, layoutDensity, season]);

  const cycleTheme = useCallback(() => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'sepia';
      return 'light';
    });
  }, []);

  return {
    themeMode,
    setThemeMode,
    cycleTheme,
    layoutDensity,
    setLayoutDensity,
    season,
    setSeason,
    darkMode: themeMode === 'dark',
    toggleDarkMode: cycleTheme,
  };
}
