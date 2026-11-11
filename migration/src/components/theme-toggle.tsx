import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

type Theme = "system" | "light" | "dark";

export const themeScript = `try{const t=localStorage.getItem('blog-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}`;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const stored = document.documentElement.dataset.theme;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);
  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = theme === "system" ? Monitor : theme === "light" ? Sun : Moon;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      title={`Theme: ${theme}. Switch to ${next}`}
      onClick={() => {
        setTheme(next);
        if (next === "system") delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("blog-theme", next);
        } catch {
          /* The setting still works when storage is unavailable. */
        }
      }}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
