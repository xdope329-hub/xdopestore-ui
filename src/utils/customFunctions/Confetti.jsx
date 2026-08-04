/**
 * Fire a global confetti burst (rendered by <ConfettiBurst /> in the layout).
 * Safe to call from any client component; no-ops during SSR.
 */
export const fireConfetti = (duration = 1600) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("xdope:confetti", { detail: { duration } }));
};
