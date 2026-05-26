import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "jostap-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    const sync = () => setTheme(getInitialTheme());
    window.addEventListener("storage", sync);
    window.addEventListener("jostap-theme-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("jostap-theme-change", sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent("jostap-theme-change", { detail: theme }));
  }, [theme]);

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{
        width: compact ? 34 : 38,
        height: compact ? 34 : 38,
        borderRadius: 8,
        border: "1px solid #E5E7EB",
        background: isDark ? "#111827" : "#fff",
        color: isDark ? "#F9FAFB" : "#374151",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
