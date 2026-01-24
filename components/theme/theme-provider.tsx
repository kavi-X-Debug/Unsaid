"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type Props = {
  initialTheme: Theme;
  children: ReactNode;
};

export function ThemeProvider(props: Props) {
  const [theme, setThemeState] = useState<Theme>(props.initialTheme);

  useEffect(() => {
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = (isDark: boolean) => {
        document.documentElement.classList.toggle("dark", isDark);
      };
      apply(media.matches);
      const listener = (event: MediaQueryListEvent) => apply(event.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = (value: Theme) => {
    setThemeState(value);
    document.cookie = `theme=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
