import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  confirmTheme: () => void;
  hasSelectedTheme: boolean;
  colors: {
    background: string;
    card: string;
    cardAlt: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
  };
}

export const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  text: '#0F172A',
  subtext: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  accent: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const darkColors = {
  background: '#0B1220',
  card: '#111827',
  cardAlt: '#1E293B',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  border: '#334155',
  primary: '#3B82F6',
  accent: '#60A5FA',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  confirmTheme: () => {},
  hasSelectedTheme: false,
  colors: darkColors,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [hasSelectedTheme, setHasSelectedTheme] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('@app_theme');
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
          setHasSelectedTheme(true);
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem('@app_theme', t);
  };

  const confirmTheme = () => {
    setHasSelectedTheme(true);
    AsyncStorage.setItem('@has_selected_theme', 'true');
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  if (isLoading) return null; // Or a splash screen

  return (
    <ThemeContext.Provider value={{ theme, setTheme, confirmTheme, hasSelectedTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
