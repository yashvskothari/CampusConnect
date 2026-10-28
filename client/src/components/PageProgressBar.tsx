import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Top loading progress bar that sweeps across the top of the viewport
 * whenever navigating between pages, providing interactive and responsive visual feedback.
 */
export default function PageProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const isFirstMount = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    // Avoid triggering on the very first mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    clearTimers();

    // Start loading animation
    setVisible(true);
    setProgress(20);

    // Stage 1: Quick burst
    const t1 = setTimeout(() => {
      setProgress(55);
    }, 50);

    // Stage 2: Slower progress while rendering
    const t2 = setTimeout(() => {
      setProgress(85);
    }, 140);

    // Stage 3: Complete
    const t3 = setTimeout(() => {
      setProgress(100);
    }, 240);

    // Stage 4: Fade out & reset
    const t4 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 420);

    timersRef.current = [t1, t2, t3, t4];

    return () => {
      clearTimers();
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[2.5px] overflow-hidden"
    >
      <div
        className="h-full route-progress-bar relative transition-all ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionProperty: 'width, opacity',
          transitionDuration: progress === 100 ? '120ms, 180ms' : '180ms, 120ms',
        }}
      >
        {/* Glowing spark head */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-8 bg-white/50 blur-[2px] rounded-full" />
      </div>
    </div>
  );
}
