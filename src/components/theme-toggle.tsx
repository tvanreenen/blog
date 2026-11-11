import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

type Theme = "system" | "light" | "dark";

export const themeScript = `try{const t=localStorage.getItem('blog-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}`;

function readTheme(): Theme {
  const stored = document.documentElement.dataset.theme;
  return stored === "light" || stored === "dark" ? stored : "system";
}

function serverTheme(): Theme {
  return "system";
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = theme === "system" ? Monitor : theme === "light" ? Sun : Moon;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      title={`Theme: ${theme}. Switch to ${next}`}
      onClick={() => {
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
