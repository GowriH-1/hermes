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
    
    // Helper to ensure we provide r g b format for Tailwind's rgb(var(--...) / <alpha>)
    const normalizeToRgb = (color: string) => {
      if (!color) return null;
      
      // 1. If it's already a hex
      const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      if (hexMatch) {
        return `${parseInt(hexMatch[1], 16)} ${parseInt(hexMatch[2], 16)} ${parseInt(hexMatch[3], 16)}`;
      }

      // 2. If it's rgb(r, g, b) or rgb(r g b)
      const rgbMatch = /rgb\s*\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)/i.exec(color);
      if (rgbMatch) {
        return `${rgbMatch[1]} ${rgbMatch[2]} ${rgbMatch[3]}`;
      }

      // 3. Fallback for common color names (very basic)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `${r} ${g} ${b}`;
      }

      return null;
    };

    if (brandConfig?.primary_color) {
      const rgb = normalizeToRgb(brandConfig.primary_color);
      if (rgb) {
        root.style.setProperty('--brand-primary', rgb);
        root.style.setProperty('--brand-primary-hover', rgb);
      }
    } else {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-hover');
    }

    if (brandConfig?.secondary_color) {
      const rgb = normalizeToRgb(brandConfig.secondary_color);
      if (rgb) {
        root.style.setProperty('--brand-secondary', rgb);
      }
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
