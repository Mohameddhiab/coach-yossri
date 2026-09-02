"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEME_KEY = "coachyosri_theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const initial = stored === "light" ? "light" : "dark";
    const id = setTimeout(() => {
      setTheme(initial);
      document.documentElement.classList.toggle("dark", initial === "dark");
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(THEME_KEY, next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="تغيير المظهر">
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}