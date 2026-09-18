import { useEffect, useRef, useState } from "react";

/**
 * Returns a boolean that flips to `true` for `duration` ms whenever the given
 * numeric value INCREASES (e.g. the cart item count going up). Used to trigger
 * a one-shot "bump"/pulse animation on the cart badge — works the same on
 * desktop and mobile since it's pure state + CSS.
 */
export default function useBumpOnIncrease(value, duration = 400) {
  const [bumped, setBumped] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (typeof value === "number" && value > prev.current) {
      setBumped(true);
      const timer = setTimeout(() => setBumped(false), duration);
      prev.current = value;
      return () => clearTimeout(timer);
    }
    prev.current = value;
  }, [value, duration]);

  return bumped;
}
