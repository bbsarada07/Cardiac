import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  colors: {
    background: string;
    card: string;
    cardAlt: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
  };
}

export const lightColors = {
  background: '#F1F5F9',
  card: '#FFFFFF',
  cardAlt: '#F8FAFC',
  text: '#0F172A',
  subtext: '#475569',
  border: '#CBD5E1',
  primary: '#3B82F6',
};

export const darkColors = {
  background: '#0A0A0F',
  card: '#1E1E2D',
  cardAlt: '#1E293B',
  text: '#F8FAFC',
  subtext: '#9CA3AF',
  border: '#2D2D3B',
  primary: '#3B82F6',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  colors: darkColors,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');

  useEffect(() => {
    AsyncStorage.getItem('@app_theme').then(saved => {
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
    });
  }, []);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem('@app_theme', t);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
