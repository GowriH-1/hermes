import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface BrandConfig {
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  tagline?: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  brandConfig: BrandConfig | null;
  setBrandConfig: (config: BrandConfig | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle dynamic brand colors
  useEffect(() => {
    const root = window.document.documentElement;
    if (brandConfig?.primary_color) {
      root.style.setProperty('--brand-primary', brandConfig.primary_color);
      // Generate a hover variant (darker)
      root.style.setProperty('--brand-primary-hover', brandConfig.primary_color + 'dd');
    } else {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-hover');
    }

    if (brandConfig?.secondary_color) {
      root.style.setProperty('--brand-secondary', brandConfig.secondary_color);
    } else {
      root.style.removeProperty('--brand-secondary');
    }
  }, [brandConfig]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, brandConfig, setBrandConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
