import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type Theme = 'dark' | 'light' | 'cream';

export interface ThemeOption {
  id: Theme;
  label: string;
  description: string;
  iconName: 'moon' | 'sun' | 'coffee';
  previewColor: string;
  previewBg: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Dark',
    description: 'Original high-contrast obsidian & emerald',
    iconName: 'moon',
    previewColor: '#10b981',
    previewBg: '#0a0a0f',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Clean, crisp daylight with vivid green',
    iconName: 'sun',
    previewColor: '#059669',
    previewBg: '#f8fafc',
  },
  {
    id: 'cream',
    label: 'Cream',
    description: 'Warm, elegant ivory & botanical forest',
    iconName: 'coffee',
    previewColor: '#15803d',
    previewBg: '#fbf9f4',
  },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_THEMES: Theme[] = ['dark', 'light', 'cream'];

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const rawUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    const userId = rawUser ? JSON.parse(rawUser)?.id : null;
    const userTheme = userId ? localStorage.getItem(`gigverse_theme_${userId}`) : null;
    const generalTheme = localStorage.getItem('gigverse_theme');

    const candidate = (userTheme || generalTheme) as Theme;
    if (candidate && VALID_THEMES.includes(candidate)) {
      return candidate;
    }
  } catch {
    // fallback
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Sync theme to DOM element and local storage
  const applyTheme = (newTheme: Theme, currentUserId?: string) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    document.documentElement.setAttribute('data-theme', newTheme);

    try {
      localStorage.setItem('gigverse_theme', newTheme);
      if (currentUserId) {
        localStorage.setItem(`gigverse_theme_${currentUserId}`, newTheme);
      }
    } catch {
      // storage errors ignored
    }
  };

  const setTheme = (newTheme: Theme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
    applyTheme(newTheme, user?.id);
  };

  // Restore user-specific theme on login / user change
  useEffect(() => {
    if (user?.id) {
      const savedUserTheme = localStorage.getItem(`gigverse_theme_${user.id}`) as Theme;
      if (savedUserTheme && VALID_THEMES.includes(savedUserTheme)) {
        setThemeState(savedUserTheme);
        applyTheme(savedUserTheme, user.id);
        return;
      }
    }
    // ensure current theme is applied to DOM
    applyTheme(theme, user?.id);
  }, [user?.id]);

  // Initial mount application
  useEffect(() => {
    applyTheme(theme, user?.id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: THEME_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
