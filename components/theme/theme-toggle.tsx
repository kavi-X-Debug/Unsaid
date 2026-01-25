"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        aria-label={effectiveDark ? "Switch to light theme" : "Switch to dark theme"}
        className="h-9 w-9 rounded-full flex items-center justify-center bg-white/80 border border-slate-300 hover:border-sky-500 dark:bg-slate-950/70 dark:border-slate-700 transition-colors"
      >
        <AnimatePresence mode="wait" initial={false}>
          {effectiveDark ? (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              aria-hidden="true"
            >
              ☀️
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              aria-hidden="true"
            >
              🌙
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}
