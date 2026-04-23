import { useEffect } from "react";

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (dark) => {
      document.documentElement.classList.toggle("dark", dark);
    };
    apply(mq.matches);
    mq.addEventListener("change", e => apply(e.matches));
    return () => mq.removeEventListener("change", e => apply(e.matches));
  }, []);

  return children;
}