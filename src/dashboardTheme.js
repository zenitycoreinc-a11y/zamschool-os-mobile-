import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getDashboardTheme } from './theme.js';

export const DASHBOARD_THEME_STORAGE_KEY = '@zamschool/dashboard-theme-mode';

export function normalizeDashboardThemeMode(value) {
  return value === 'light' ? 'light' : 'midnight';
}

export function createDashboardThemePreference(storage) {
  return {
    async load() {
      try {
        const storedValue = await storage.getItem(DASHBOARD_THEME_STORAGE_KEY);
        return normalizeDashboardThemeMode(storedValue);
      } catch {
        return 'midnight';
      }
    },
    async save(mode) {
      const nextMode = normalizeDashboardThemeMode(mode);
      try {
        await storage.setItem(DASHBOARD_THEME_STORAGE_KEY, nextMode);
      } catch {
        return nextMode;
      }
      return nextMode;
    },
  };
}

async function getDashboardThemePreference() {
  const storageModule = await import('@react-native-async-storage/async-storage');
  const storage = storageModule.default || storageModule;
  return createDashboardThemePreference(storage);
}

const DashboardThemeContext = createContext({
  mode: 'midnight',
  theme: getDashboardTheme('midnight'),
  setMode: async () => {},
  toggleMode: async () => {},
});

export function DashboardThemeProvider({ children }) {
  const [mode, setModeState] = useState('midnight');

  useEffect(() => {
    let active = true;

    (async () => {
      const preference = await getDashboardThemePreference();
      const storedMode = await preference.load();
      if (active) {
        setModeState(storedMode);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode) => {
    const normalizedMode = normalizeDashboardThemeMode(nextMode);
    setModeState(normalizedMode);
    const preference = await getDashboardThemePreference();
    await preference.save(normalizedMode);
    return normalizedMode;
  }, []);

  const toggleMode = useCallback(async () => {
    const nextMode = mode === 'midnight' ? 'light' : 'midnight';
    await setMode(nextMode);
    return nextMode;
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      mode,
      theme: getDashboardTheme(mode),
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return createElement(DashboardThemeContext.Provider, { value }, children);
}

export function useDashboardTheme() {
  return useContext(DashboardThemeContext);
}
