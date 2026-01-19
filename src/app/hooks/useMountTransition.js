import { useEffect, useState } from "react";

export const useMountTransition = (isMounted, unmountDelay) => {
  const [hasTransitionedIn, setHasTransitionedIn] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isMounted && !hasTransitionedIn) {
      // Wrap in simple requestAnimationFrame (via setTimeout 10ms approx) to ensure paint
      timeoutId = setTimeout(() => setHasTransitionedIn(true), 20);
    } else if (!isMounted && hasTransitionedIn) {
      timeoutId = setTimeout(() => setHasTransitionedIn(false), unmountDelay);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [unmountDelay, isMounted, hasTransitionedIn]);

  return hasTransitionedIn;
};
