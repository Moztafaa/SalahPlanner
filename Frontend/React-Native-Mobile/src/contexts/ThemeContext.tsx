import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import * as SecureStore from 'expo-secure-store';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync('user-theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setColorScheme(savedTheme);
        } else {
            setColorScheme('light'); // Default to light
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = () => {
    const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newTheme);
    SecureStore.setItemAsync('user-theme', newTheme);
  };

  const setTheme = (theme: Theme) => {
    setColorScheme(theme);
    SecureStore.setItemAsync('user-theme', theme);
  };

  // Always render children to preserve navigation context
  // The theme will update once loaded
  return (
    <ThemeContext.Provider value={{ theme: colorScheme as Theme || 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
