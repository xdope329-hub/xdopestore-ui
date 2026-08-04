"use client";
import { useEffect, useRef, useState } from "react";

// Reuses the theme's confetti styles (.confetti-wrapper / .confetti-N from
// _confetti.scss). Mounted once in the layout; any component triggers it via
// fireConfetti() -> window CustomEvent("xdope:confetti").
const CONFETTI_ITEMS = Array.from({ length: 150 }, (_, index) => index);

const ConfettiBurst = () => {
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const onFire = (e) => {
      const duration = e?.detail?.duration || 1600;
      setShow(false); // restart CSS animations if already showing
      requestAnimationFrame(() => setShow(true));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), duration);
    };
    window.addEventListener("xdope:confetti", onFire);
    return () => {
      window.removeEventListener("xdope:confetti", onFire);
      clearTimeout(timer.current);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="confetti-wrapper show" data-testid="confetti-burst">
      {CONFETTI_ITEMS.map((i) => (
        <div className={`confetti-${i}`} key={i}></div>
      ))}
    </div>
  );
};

export default ConfettiBurst;
