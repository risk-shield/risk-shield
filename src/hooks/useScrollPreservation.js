import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Preserved scroll positions keyed by pathname
const scrollPositions = {};

/**
 * Attach ref to a scrollable container. Scroll position is saved on every scroll
 * and restored whenever the pathname matches again.
 */
export function useScrollPreservation() {
  const { pathname } = useLocation();
  const ref = useRef(null);

  // Restore scroll when pathname changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = scrollPositions[pathname] ?? 0;
    el.scrollTop = saved;

    const onScroll = () => {
      scrollPositions[pathname] = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return ref;
}