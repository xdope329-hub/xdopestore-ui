/**
 * Fire a global confetti burst (rendered by <ConfettiBurst /> in the layout).
 * Safe to call from any client component; no-ops during SSR.
 */
export const fireConfetti = (duration = 1600) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("xdope:confetti", { detail: { duration } }));
};

/**
 * Schedule confetti after the browser has had a chance to paint the current
 * interaction (for example, a checkout route transition). This keeps the
 * particle render out of the navigation click handler.
 */
export const fireConfettiAsync = (duration = 1600) => {
  if (typeof window === "undefined") return;

  const schedule = () => window.setTimeout(() => fireConfetti(duration), 0);
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(schedule);
  } else {
    schedule();
  }
};
