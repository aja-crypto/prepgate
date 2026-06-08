// src/context/ThemeContext.jsx — dark / light / system + custom accent colors
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { COLOR_PRESETS } from '../design/tokens';

const THEME_MODE_KEY = 'gate2027_theme_mode';
const COLOR_PRESET_KEY = 'gate2027_color_preset';
const ONBOARDING_KEY = 'gate2027_onboarding_done';

const ThemeContext = createContext(null);

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyColorPreset(presetId) {
  const preset = COLOR_PRESETS[presetId] || COLOR_PRESETS.violet;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', preset.primary);
  root.style.setProperty('--color-secondary', preset.secondary);
  root.style.setProperty('--color-accent', preset.accent);
}

function applyThemeMode(mode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  return resolved;
}

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(() => {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    const legacy = localStorage.getItem('gate2027_theme');
    return legacy === 'light' ? 'light' : 'dark';
  });

  const [colorPreset, setColorPresetState] = useState(() => {
    return localStorage.getItem(COLOR_PRESET_KEY) || 'violet';
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');
  const [onboardingDone, setOnboardingDone] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  useEffect(() => {
    applyColorPreset(colorPreset);
    localStorage.setItem(COLOR_PRESET_KEY, colorPreset);
  }, [colorPreset]);

  useEffect(() => {
    const resolved = applyThemeMode(themeMode);
    setResolvedTheme(resolved);
    localStorage.setItem(THEME_MODE_KEY, themeMode);
    localStorage.setItem('gate2027_theme', resolved);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(applyThemeMode('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  const setThemeMode = useCallback((mode) => setThemeModeState(mode), []);
  const setColorPreset = useCallback((id) => setColorPresetState(id), []);
  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const resolved = prev === 'system' ? getSystemTheme() : prev;
      return resolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const completeOnboarding = useCallback((prefs = {}) => {
    if (prefs.themeMode) setThemeModeState(prefs.themeMode);
    if (prefs.colorPreset) setColorPresetState(prefs.colorPreset);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setOnboardingDone(false);
  }, []);

  return (
    <ThemeContext.Provider value={{
      themeMode,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      colorPreset,
      colorPresets: COLOR_PRESETS,
      setThemeMode,
      setColorPreset,
      toggleTheme,
      onboardingDone,
      completeOnboarding,
      resetOnboarding,
      theme: resolvedTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
