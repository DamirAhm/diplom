"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-md border border-border/50 bg-background p-2 text-foreground/80 hover:bg-muted transition-colors"
      aria-label={
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
    >
      {theme === "light" ?
        <Moon size={16} className="text-primary" /> :
        <Sun size={16} className="text-indigo-400" />
      }
    </button>
  );
}
