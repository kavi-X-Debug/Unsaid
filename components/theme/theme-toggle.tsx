"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effectiveDark = theme === "dark" || (theme === "system" && prefersDark);

  const handleToggle = () => {
    setTheme(effectiveDark ? "light" : "dark");
  };

  return (
    <div className="fixed top-4 right-4 z-40">
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        className="h-8 px-3 text-xs"
      >
        {effectiveDark ? "Light mode" : "Dark mode"}
      </Button>
    </div>
  );
}

