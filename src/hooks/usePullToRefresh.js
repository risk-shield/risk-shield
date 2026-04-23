import { useEffect, useRef, useState } from "react";

export function usePullToRefresh(onRefresh, threshold = 72) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(null);
  const el = useRef(null);

  useEffect(() => {
    const container = el.current;
    if (!container) return;

    const onTouchStart = (e) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        e.preventDefault();
        setPullY(Math.min(dy, threshold * 1.5));
        setPulling(dy >= threshold);
      }
    };

    const onTouchEnd = async () => {
      if (pulling) {
        await onRefresh();
      }
      startY.current = null;
      setPullY(0);
      setPulling(false);
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, pulling, threshold]);

  return { ref: el, pullY, pulling };
}