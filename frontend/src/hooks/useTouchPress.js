import { useCallback, useRef, useState } from 'react';

export function useTouchPress(duration = 100) {
  const [isPressed, setIsPressed] = useState(false);
  const timer = useRef(null);

  const onTouchStart = useCallback(() => {
    setIsPressed(true);
    clearTimeout(timer.current);
  }, []);

  const onTouchEnd = useCallback(() => {
    timer.current = setTimeout(() => setIsPressed(false), duration);
  }, [duration]);

  const onMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const onMouseUp = useCallback(() => {
    timer.current = setTimeout(() => setIsPressed(false), duration);
  }, [duration]);

  const onMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  return {
    isPressed,
    handlers: {
      onTouchStart,
      onTouchEnd,
      onMouseDown,
      onMouseUp,
      onMouseLeave,
    },
  };
}
